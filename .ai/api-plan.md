# REST API Plan

## 1. Resources

| Resource                | DB Table             | Description                                                                      |
| ----------------------- | -------------------- | -------------------------------------------------------------------------------- |
| User                    | `auth.users`         | End-user account handled by Supabase Auth                                        |
| GenerationSource        | `generation_sources` | Single request to the AI engine together with aggregated review stats            |
| Flashcard               | `flashcards`         | Accepted, user-owned flashcard visible in study lists                            |
| ReviewSession (virtual) | —                    | In-memory queue produced by spaced-repetition library; no dedicated table in MVP |

## 2. Endpoints

### 2.1 Authentication (Supabase‐managed)

Supabase handles sign-up, sign-in, sign-out, password reset and user deletion through its built-in `/auth/*` routes and JS SDK. All other endpoints require the `Authorization: Bearer <access_token>` header carrying the Supabase JWT.

---

### 2.2 Generation Sources

| Verb  | Path                       | Description                                                                                |
| ----- | -------------------------- | ------------------------------------------------------------------------------------------ |
| POST  | `/generation-sources`      | Start AI generation, persist `input_text_hash`, call OpenRouter, return list of candidates |
| GET   | `/generation-sources/{id}` | Fetch metadata & stats for one source (no candidates)                                      |
| PATCH | `/generation-sources/{id}` | Update `total_*` stats after user review                                                   |
| GET   | `/generation-sources`      | Paginated list filtered by current user                                                    |

**Query parameters (GET list)**

- `page`, `page_size` – pagination (default 1 / 20)
- `sort` – `created_at` (default `desc`)

**Request → POST /generation-sources**

```json
{
  "inputText": "string 1000–10000 chars"
}
```

**Success 201 Response**

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

**Validation / Error Codes**

- 400 `INPUT_TEXT_INVALID` – length <1000 or >10000
- 502 `AI_SERVICE_UNAVAILABLE` – upstream failure

---

### 2.3 Flashcards

| Verb   | Path               | Description                                                    |
| ------ | ------------------ | -------------------------------------------------------------- |
| GET    | `/flashcards`      | Paginated search of user flashcards                            |
| POST   | `/flashcards`      | Create one or more flashcards (manual or accepted)             |
| GET    | `/flashcards/{id}` | Retrieve single flashcard                                      |
| PATCH  | `/flashcards/{id}` | Update front/back, source_type becomes `ai-edited` when edited |
| DELETE | `/flashcards/{id}` | Hard-delete flashcard                                          |

**Query parameters (GET list)**

- `q` – full-text search across front/back (tokenised via `to_tsvector`)
- `page`, `page_size` – pagination (default 1 / 20, max 100)
- `sort` – `created_at` | `updated_at` (default `created_at desc`)

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

**Success 201 Response**

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

**Validation Rules**

- `front` / `back` trimmed, non-empty, max length enforced (200 / 500)
- `sourceType` must be one of allowed literal values
- If `generationSourceId` given → verify it belongs to caller

**Error Codes**

- 400 `FIELD_VALIDATION_FAILED`
- 403 `FORBIDDEN` – violates RLS or ownership
- 404 `NOT_FOUND` – id does not exist

---

### 2.4 Review Session (spaced repetition)

No persistence in MVP – the algorithm consumes the user’s flashcards list and returns a queue.

| Verb  | Path                            | Description                                                       |
| ----- | ------------------------------- | ----------------------------------------------------------------- |
| POST  | `/review-sessions`              | Start session, returns ordered queue of flashcard IDs & due dates |
| PATCH | `/review-sessions/{id}/reviews` | Submit user rating for a flashcard, receive next item             |

**Request → POST /review-sessions**

```json
{
  "limit": 20
}
```

**Success 201 Response**

```json
{
  "sessionId": "uuid",
  "queue": [{ "flashcardId": "uuid", "dueAt": "ISO-8601" }]
}
```

---

## 3. Authentication & Authorisation

1. **Supabase JWT** – every request (except `/auth/*`) carries an access token.
2. **Row Level Security** – tables `generation_sources` and `flashcards` enable RLS with policies:
   - SELECT / UPDATE / DELETE restricted to `user_id = auth.uid()`
   - INSERT must match `WITH CHECK (user_id = auth.uid())`
3. **Rate Limiting** – Cloudflare / Edge Function middleware: 60 requests / minute per IP.

## 4. Validation & Business Logic

| Resource         | Validation                                                   | Business Logic                                                                               |
| ---------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| GenerationSource | `inputText` length 1000–10000                                | After generation store `total_generated` size; stats updated after review                    |
| Flashcard        | `front` 1–200, `back` 1–500, `sourceType` enum; FK ownership | Editing a previously AI card flips `sourceType` → `ai-edited`                                |
| Review Session   | `limit` 1-50                                                 | Queue ordered by spaced-repetition lib; each PATCH updates next due date (library in memory) |

Triggers ensure `updated_at = NOW()` on UPDATE for both tables.

## 5. Error Handling (common JSON envelope)

```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable explanation"
  }
}
```

HTTP status conveys category (4xx client / 5xx server). All validation errors use 400 with field-level messages.

## 6. Performance & Indexing

- GIN index `idx_flashcards_search` backs full-text `q` filter.
- Composite indexes on `(user_id, created_at)` and `(user_id, updated_at)` satisfy list sorting.
- `inputText` not indexed – written once, rarely read.
