# API Endpoint Implementation Plan: POST /flashcards

## 1. Przegląd punktu końcowego

Tworzy nowe fiszki przypisane do uwierzytelnionego użytkownika. Obsługuje zarówno fiszki wpisane ręcznie, jak i zaakceptowane propozycje AI. Endpoint umożliwia opcjonalne powiązanie fiszki z rekordem `generation_sources`, dzięki czemu możemy śledzić statystyki skuteczności generowania.

## 2. Szczegóły żądania

- **Metoda HTTP:** `POST`
- **URL:** `/flashcards`
- **Nagłówki:**
  - `Authorization: Bearer <JWT>` – token Supabase Auth (wymagany)
  - `Content-Type: application/json`
- **Body:** tablica obiektów zgodnych z `CreateFlashcardCommand`

```json
[
  {
    "front": "string (1–200)",
    "back": "string (1–500)",
    "sourceType": "ai-full" | "ai-edited" | "manual",
    "generationSourceId": "uuid | null"
  }
]
```

### Parametry

Wszystkie pola poza `generationSourceId` są **wymagane**.

| Pole                 | Typ          | Ograniczenia                             | Uwagi      |
| -------------------- | ------------ | ---------------------------------------- | ---------- |
| `front`              | string       | trimmed, non-empty, ≤200 znaków          |            |
| `back`               | string       | trimmed, non-empty, ≤500 znaków          |            |
| `sourceType`         | enum         | `ai-full` \| `ai-edited` \| `manual`     |            |
| `generationSourceId` | uuid \| null | musi należeć do wywołującego użytkownika | opcjonalne |

## 3. Wykorzystywane typy

- `CreateFlashcardCommand` (request)
- `FlashcardDto` (201 response)
- `ErrorResponseDto` (błędy)

## 4. Szczegóły odpowiedzi

- **Status 201 CREATED**  
  Zwraca tablicę utworzonych rekordów w formacie `FlashcardDto` (kolejność zachowana względem żądania).

```json
[
  {
    "id": "uuid",
    "front": "string",
    "back": "string",
    "sourceType": "ai-full",
    "generationSourceId": "uuid | null",
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601"
  }
]
```

### Kody statusu

| Kod | Kiedy                                                         |
| --- | ------------------------------------------------------------- |
| 201 | Utworzono fiszki                                              |
| 400 | Walidacja danych nie powiodła się (`FIELD_VALIDATION_FAILED`) |
| 401 | Brak lub niepoprawny token                                    |
| 403 | Naruszenie RLS lub próba użycia cudzej `generationSourceId`   |
| 404 | Podane `generationSourceId` nie istnieje                      |
| 500 | Nieoczekiwany błąd serwera                                    |

## 5. Przepływ danych

1. **API Route** `src/pages/api/flashcards/index.ts` odbiera żądanie, pobiera `supabase` z `Astro.locals` oraz `user.id` z JWT.
2. **Walidacja Zod** – schemat `createFlashcardsSchema` waliduje treść żądania (trim, length, enum, UUID).
3. **Service** – `flashcardService.createMany(command[], userId)`:
   1. Pobiera i buforuje `generationSourceIds`, jeśli podano.
      - Sprawdza czy należą do `userId`; brak = 404 / 403.
   2. Przygotowuje tablicę rekordów do wstawienia (`FlashcardInsert`).
   3. Wykonuje **pojedynczą** operację `insert` (bulk) do tabeli `flashcards`.
   4. Jeśli wystąpi `sourceType` ≠ `manual`, aktualizuje statystyki w `generation_sources` (wykonuje `update` z inkrementacją odpowiednich liczników w transakcji lub przez RPC).
4. Zwraca utworzone rekordy z bazy (pola `*`) i mapuje je do `FlashcardDto`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnienie** przez Supabase JWT (middleware już istnieje).  
  Bez JWT → 401.
- **Autoryzacja / RLS** – każda operacja wykonywana poprzez Supabase RLS zabezpieczona politykami:
  - `flashcards.user_id = auth.uid()`
  - `generation_sources.user_id = auth.uid()`
- **Walidacja UUID** – zapobiega SQL-Injection przez pola identyfikatorów.
- **Rate limiting** (opcjonalnie) – middleware Cloudflare / Edge Functions.

## 7. Obsługa błędów

| Scenariusz                          | Kod | Body (`ErrorResponseDto`)                 |
| ----------------------------------- | --- | ----------------------------------------- |
| Niepoprawny JSON / schema           | 400 | `FIELD_VALIDATION_FAILED` + szczegóły pól |
| `generationSourceId` nie istnieje   | 404 | `NOT_FOUND`                               |
| Id źródła nie należy do użytkownika | 403 | `FORBIDDEN`                               |
| Błąd Supabase / baza                | 500 | komunikat ogólny, log wewnętrzny          |

Logowanie błędów → konsola + Sentry (jeśli skonfigurowane). Kody i treść zgodnie z `ErrorResponseDto`.

## 8. Rozważania dotyczące wydajności

- **Bulk insert** zamiast pętli – jedna podróż sieciowa.
- Dodane już indeksy na `user_id` oraz `generation_source_id` (FK) przyspieszą zapytania.
- Body ≤ ~1 MB (ustalić limit `MAX_FLASHCARDS_PER_REQUEST`, np. 50) – chroni przed nadużyciami.

## 9. Etapy wdrożenia

1. **Modele & typy** – potwierdzić, że `src/types.ts` zawiera wszystkie wymagane DTO (już istnieją).
2. **Nowy Service** `src/lib/services/flashcardService.ts` z metodą `createMany` (bulk insert + statystyki).
3. **Definicja schematu Zod** `createFlashcardsSchema` w `src/lib/validation/flashcardSchemas.ts`.
4. **Endpoint** `src/pages/api/flashcards/index.ts`:
   - eksport `POST`, `prerender = false`.
   - użycie schematu, serwisu, mapowanie DTO.
5. **Middleware** – upewnić się, że `src/middleware/index.ts` dodaje `locals.supabase` i `locals.user`.
