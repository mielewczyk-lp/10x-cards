# API Endpoint Implementation Plan: POST /generation-sources

## 1. Przegląd punktu końcowego
Endpoint przyjmuje duży fragment tekstu dostarczony przez użytkownika, przekazuje go do usługi AI (LLM), a następnie zwraca listę wygenerowanych propozycji fiszek (front/back). Dodatkowo zapisuje w tabeli `generation_sources` metadane oraz statystyki dotyczące późniejszej akceptacji/odrzucenia kandydatów.

## 2. Szczegóły żądania
- **Metoda HTTP**: `POST`
- **Ścieżka URL**: `/generation-sources`
- **Nagłówki**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>` (Supabase Auth JWT)
- **Parametry URL**: brak
- **Body** (`CreateGenerationSourceCommand`):
  ```json
  {
    "inputText": "string 1000–10000 chars"
  }
  ```
- **Walidacja**:
  - `inputText` – wymagany, długość 1000 – 10000 znaków (po przycięciu white-space)
  - typ danych `string`

## 3. Wykorzystywane typy
- `CreateGenerationSourceCommand` – _request DTO_
- `FlashcardCandidateDto` – pojedyncza propozycja fiszki
- `CreateGenerationSourceResponseDto` – _response DTO_
- `GenerationSourceInsert` / `GenerationSourceUpdate` – operacje na bazie

## 4. Szczegóły odpowiedzi
- **201 Created** – pomyślne wygenerowanie
  ```json
  {
    "id": "uuid",
    "createdAt": "ISO-8601",
    "candidates": [
      { "front": "string", "back": "string" }
    ]
  }
  ```
- **Błędy**
  | HTTP | Kod | Znaczenie |
  |------|-----|-----------|
  | 400  | `INPUT_TEXT_INVALID` | Długość `inputText` < 1000 lub > 10000 |
  | 401  | `UNAUTHORIZED` | Brak lub nieważny token JWT |
  | 502  | `AI_SERVICE_UNAVAILABLE` | Upstream LLM nieosiągalny / timeout |
  | 500  | `INTERNAL_SERVER_ERROR` | Niezidentyfikowany błąd serwera |

## 5. Przepływ danych
1. Klient wysyła `POST /generation-sources` z `inputText`.
2. Middleware `src/middleware/index.ts` uwierzytelnia żądanie i do `context.locals` wstrzykuje `supabase` oraz `user`.
3. Handler endpointu (`src/pages/api/generation-sources/index.ts`):
   1. Odczytuje body i waliduje je za pomocą Zod:
      ```ts
      const CreateGenSourceSchema = z.object({
        inputText: z.string().trim().min(1000, 'INPUT_TEXT_INVALID').max(10000, 'INPUT_TEXT_INVALID'),
      });
      ```
   2. Wstawia rekord w `generation_sources` (`total_generated = 0`, pozostałe liczniki = 0, `error_message = null`).
   3. Wywołuje serwis `FlashcardGenerationService.generate(inputText)`:
      - Implementacja w `src/lib/services/flashcardGenerationService.ts`.
      - Serwis komunikuje się z zewnętrzną usługą LLM (np. OpenAI) i zwraca tablicę `FlashcardCandidateDto[]`.
   4. Aktualizuje rekord:
      - `total_generated = candidates.length`
      - `model_name` – nazwa użytego modelu
      - W razie niepowodzenia: `error_message` + zwrot 502.
   5. Zwraca `CreateGenerationSourceResponseDto` z kodem 201.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: tylko zalogowani użytkownicy (Supabase Auth JWT).
- **Autoryzacja**: RLS w Supabase – `generation_sources.user_id = auth.uid()`.
- **Ochrona przed nadużyciami**:
  - Limit znaków 10 000.
  - Rate-limiting (np. middleware oparty o KV / Redis).
- **Hardening LLM**:
  - Sanitizacja wejścia, detekcja prompt-injection (opcjonalnie model bezpieczeństwa).
  - Wymuszanie maks. czasu odpowiedzi (timeout HTTP; abort controller).
- **Transport**: HTTPS.

## 7. Obsługa błędów
1. **Walidacja**
   - Zod rzuca `ZodError` → mapowanie na 400 `INPUT_TEXT_INVALID`.
2. **Błędy AI**
   - Timeout, 5xx od dostawcy → logujemy do `generation_sources.error_message`, rollback `total_generated`, zwracamy 502.
3. **Błędy bazy**
   - Supabase error → 500, log do Sentry.
4. **Format odpowiedzi błędu** – zgodny z `ErrorResponseDto`.

## 8. Rozważania dotyczące wydajności
- Generowanie może być czasochłonne; ustawić timeout (np. 30 s).
- _Future-proof_: przenieść generowanie do kolejki/background job i zwracać `202 Accepted`.
- Indeks na `generation_sources.created_at` dla listowania.
- Ograniczyć wielkość odpowiedzi JSON (max ~1 MB).

## 9. Etapy wdrożenia
1. **Modele & typy** – potwierdzić, że `src/types.ts` zawiera wszystkie wymagane DTO (już istnieją).
2. **Service** – utworzyć `src/lib/services/flashcardGenerationService.ts` z metodą `generate` i adapterem do LLM.
3. **Zod schema** – dodać do `src/lib/validation/generationSourceSchemas.ts` (nowy plik).
4. **Endpoint** –
   - `src/pages/api/generation-sources/index.ts` (`export const POST`).
   - Użyć `export const prerender = false`.
5. **Middleware** – upewnić się, że `src/middleware/index.ts` dodaje `locals.supabase` i `locals.user`.
6. **RLS** – skonfigurować polityki w Supabase migracją SQL (jeśli jeszcze nie istnieją).