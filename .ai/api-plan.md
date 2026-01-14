# Plan REST API

## 1. Zasoby

| Zasób                   | Tabela w bazie       | Opis                                                                                      |
| ----------------------- | -------------------- | ----------------------------------------------------------------------------------------- |
| User                    | `auth.users`         | Konto użytkownika zarządzane przez Supabase Auth                                          |
| GenerationSource        | `generation_sources` | Pojedyncze żądanie do silnika AI wraz z zagregowanymi statystykami recenzji              |
| Flashcard               | `flashcards`         | Zaakceptowana fiszka należąca do użytkownika, widoczna na listach do nauki               |
| ReviewSession (virtual) | —                    | Kolejka w pamięci generowana przez bibliotekę spaced-repetition; brak dedykowanej tabeli w MVP |

## 2. Endpointy

### 2.1 Autentykacja (zarządzana przez Supabase)

Supabase obsługuje rejestrację, logowanie, wylogowanie, reset hasła i usuwanie użytkownika przez wbudowane ścieżki `/auth/*` i JS SDK. Wszystkie pozostałe endpointy wymagają nagłówka `Authorization: Bearer <access_token>` zawierającego JWT Supabase.

---

### 2.2 Generation Sources

| Czasownik | Ścieżka                    | Opis                                                                                        |
| --------- | -------------------------- | ------------------------------------------------------------------------------------------- |
| POST      | `/generation-sources`      | Rozpocznij generację AI, zapisz `input_text_hash`, wywołaj OpenRouter, zwróć listę kandydatów |
| GET       | `/generation-sources/{id}` | Pobierz metadane i statystyki dla jednego źródła (bez kandydatów)                          |
| PATCH     | `/generation-sources/{id}` | Zaktualizuj statystyki `total_*` po recenzji użytkownika                                   |
| GET       | `/generation-sources`      | Lista stronicowana przefiltrowana dla aktualnego użytkownika                               |

**Parametry zapytania (GET lista)**

- `page`, `page_size` – stronicowanie (domyślnie 1 / 20)
- `sort` – `created_at` (domyślnie `desc`)

**Request → POST /generation-sources**

```json
{
  "inputText": "string 1000–10000 znaków"
}
```

**Sukces 201 Response**

```json
{
  "id": "uuid",
  "createdAt": "ISO-8601",
  "candidates": [
    { "front": "string", "back": "string" },
    ...
  ]
}
```

**Walidacja / Kody błędów**

- 400 `INPUT_TEXT_INVALID` – długość <1000 lub >10000
- 502 `AI_SERVICE_UNAVAILABLE` – błąd usługi upstream

---

### 2.3 Flashcards

| Czasownik | Ścieżka            | Opis                                                                 |
| --------- | ------------------ | -------------------------------------------------------------------- |
| GET       | `/flashcards`      | Wyszukiwanie stronicowane fiszek użytkownika                         |
| POST      | `/flashcards`      | Utwórz jedną lub więcej fiszek (manualne lub zaakceptowane)          |
| GET       | `/flashcards/{id}` | Pobierz pojedynczą fiszkę                                            |
| PATCH     | `/flashcards/{id}` | Zaktualizuj front/back, source_type zmienia się na `ai-edited` po edycji |
| DELETE    | `/flashcards/{id}` | Usuń fiszkę na stałe (hard-delete)                                   |

**Parametry zapytania (GET lista)**

- `q` – wyszukiwanie pełnotekstowe w front/back (tokenizowane przez `to_tsvector`)
- `page`, `page_size` – stronicowanie (domyślnie 1 / 20, max 100)
- `sort` – `created_at` | `updated_at` (domyślnie `created_at desc`)

**Request → POST /flashcards**

```json
[
  {
    "front": "string ≤200",
    "back": "string ≤500",
    "sourceType": "ai-full" | "ai-edited" | "manual",
    "generationSourceId": "uuid | null"
  }
]
```

**Sukces 201 Response**

```json
{
  "id": "uuid",
  "front": "string",
  "back": "string",
  "sourceType": "ai-full",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

**Zasady walidacji**

- `front` / `back` przycięte (trimmed), niepuste, maksymalna długość wymuszona (200 / 500)
- `sourceType` musi być jedną z dozwolonych wartości literalnych
- Jeśli podano `generationSourceId` → zweryfikuj, że należy do wywołującego

**Kody błędów**

- 400 `FIELD_VALIDATION_FAILED`
- 403 `FORBIDDEN` – naruszenie RLS lub własności
- 404 `NOT_FOUND` – id nie istnieje

---

### 2.4 Review Session (spaced repetition)

Sesje nie są persystowane jako encje – kolejka żyje w pamięci klienta. Stan algorytmu SM-2 każdej fiszki jest aktualizowany w bazie po każdej odpowiedzi.

| Czasownik | Ścieżka                                   | Opis                                                     |
| --------- | ----------------------------------------- | -------------------------------------------------------- |
| POST      | `/review-sessions`                        | Pobierz fiszki do powtórki (next_review_at <= NOW())     |
| PATCH     | `/review-sessions/flashcards/{id}/answer` | Zapisz odpowiedź, aktualizuj SM-2, zwróć kolejną fiszkę  |

**Request → POST /review-sessions**

```json
{
  "limit": 20  // domyślnie 20, max 50
}
```

**Sukces 200 Response**

```json
{
  "flashcards": [
    {
      "id": "uuid",
      "front": "string",
      "back": "string",
      "sm2State": {
        "interval": 0,
        "repetition": 0,
        "efactor": 2.50
      }
    }
  ],
  "total": 15
}
```

**Request → PATCH /review-sessions/flashcards/{id}/answer**

```json
{
  "grade": 4  // 0-5 wg skali SM-2
}
```

**Sukces 200 Response**

```json
{
  "nextReviewAt": "ISO-8601",
  "hasMore": true,
  "nextFlashcard": { /* jw. */ } | null
}
```

**Zasady walidacji**

- `grade` musi być integer 0-5
- `flashcard_id` musi należeć do aktualnego użytkownika (RLS)

**Kody błędów**

- 400 `INVALID_GRADE` - grade poza zakresem
- 404 `FLASHCARD_NOT_FOUND` - fiszka nie istnieje lub nie należy do użytkownika

---

## 3. Autentykacja i autoryzacja

1. **Supabase JWT** – każde żądanie (oprócz `/auth/*`) zawiera access token.
2. **Row Level Security** – tabele `generation_sources` i `flashcards` mają włączony RLS z politykami:
   - SELECT / UPDATE / DELETE ograniczone do `user_id = auth.uid()`
   - INSERT musi spełniać `WITH CHECK (user_id = auth.uid())`
3. **Rate Limiting** – Cloudflare / Edge Function middleware: 60 żądań / minutę na IP.

## 4. Walidacja i logika biznesowa

| Zasób            | Walidacja                                                    | Logika biznesowa                                                                                      |
| ---------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| GenerationSource | `inputText` długość 1000–10000                               | Po generacji zapisz rozmiar `total_generated`; statystyki aktualizowane po recenzji                  |
| Flashcard        | `front` 1–200, `back` 1–500, `sourceType` enum; własność FK  | Edycja wcześniej wygenerowanej fiszki AI zmienia `sourceType` → `ai-edited`                          |
| Review Session   | `limit` 1-50                                                 | Kolejka uporządkowana przez bibliotekę spaced-repetition; każdy PATCH aktualizuje następny termin powtórki |

Triggery zapewniają `updated_at = NOW()` przy UPDATE dla obu tabel.

## 5. Obsługa błędów (wspólna koperta JSON)

```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Czytelne dla człowieka wyjaśnienie"
  }
}
```

Status HTTP przekazuje kategorię (4xx klient / 5xx serwer). Wszystkie błędy walidacji używają 400 z komunikatami na poziomie pól.

## 6. Wydajność i indeksowanie

- Indeks GIN `idx_flashcards_search` wspiera filtr pełnotekstowy `q`.
- Indeksy złożone na `(user_id, created_at)` i `(user_id, updated_at)` obsługują sortowanie list.
- `inputText` nie jest indeksowany – zapisywany raz, rzadko odczytywany.
