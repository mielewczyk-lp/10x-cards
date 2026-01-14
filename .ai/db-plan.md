1. Lista tabel z kolumnami

### auth.users (zarządzane przez Supabase Auth)

- `id UUID PRIMARY KEY`
- `email TEXT UNIQUE NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- ... (pozostałe kolumny zarządzane przez Supabase Auth)

### generation_sources

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
- `input_text_hash TEXT NOT NULL`
- `model_name VARCHAR(100)`
- `total_generated INTEGER NOT NULL CHECK (total_generated >= 0)`
- `total_accepted INTEGER NOT NULL DEFAULT 0 CHECK (total_accepted >= 0)`
- `total_accepted_edited INTEGER NOT NULL DEFAULT 0 CHECK (total_accepted_edited >= 0)`
- `total_rejected INTEGER NOT NULL DEFAULT 0 CHECK (total_rejected >= 0)`
- `error_message TEXT`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

### flashcards

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
- `generation_source_id UUID NULL REFERENCES generation_sources(id) ON DELETE SET NULL`
- `front TEXT NOT NULL CHECK (length(trim(front)) > 0 AND length(front) <= 200)`
- `back TEXT NOT NULL CHECK (length(trim(back)) > 0 AND length(back) <= 500)`
- `source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('ai-full','ai-edited','manual'))`
- `search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('simple', coalesce(front,'') || ' ' || coalesce(back,''))) STORED`
- `sm2_interval INTEGER NOT NULL DEFAULT 0 CHECK (sm2_interval >= 0)`
- `sm2_repetition INTEGER NOT NULL DEFAULT 0 CHECK (sm2_repetition >= 0)`
- `sm2_efactor DECIMAL(3,2) NOT NULL DEFAULT 2.50 CHECK (sm2_efactor >= 1.3 AND sm2_efactor <= 3.0)`
- `next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

2. Relacje między tabelami

- `auth.users 1:N generation_sources` (ON DELETE CASCADE)
- `generation_sources 1:N flashcards` (ON DELETE SET NULL, nullable FK)
- `auth.users 1:N flashcards` (ON DELETE CASCADE)

3. Indeksy

- `CREATE INDEX idx_generation_sources_user_created ON generation_sources(user_id, created_at DESC);`
- `CREATE INDEX idx_flashcards_user_created ON flashcards(user_id, created_at DESC);`
- `CREATE INDEX idx_flashcards_user_updated ON flashcards(user_id, updated_at DESC NULLS LAST);`
- `CREATE INDEX idx_flashcards_search ON flashcards USING GIN(search_vector);`
- `CREATE INDEX idx_flashcards_next_review ON flashcards(user_id, next_review_at ASC);`

4. Zasady PostgreSQL (RLS)

- Włącz RLS na `generation_sources` i `flashcards`.
- Polityki wspólne:
  - `SELECT`: `USING (user_id = auth.uid())`
  - `INSERT`: `WITH CHECK (user_id = auth.uid())`
  - `UPDATE`: `USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`
  - `DELETE`: `USING (user_id = auth.uid())`

5. Dodatkowe uwagi

- Utrzymuj spójność kolumn `updated_at` za pomocą triggera `SET updated_at = NOW()` na `generation_sources` i `flashcards`.
- Hard delete w całej bazie; usunięcie użytkownika kaskadowo usuwa jego źródła i fiszki.
- Telemetria KPI pochodzi z pól statystycznych `generation_sources` oraz `source_type` w `flashcards`, co pozwala raportować udział AI vs manual oraz wskaźniki akceptacji.
- Stan algorytmu SM-2 przechowywany bezpośrednio w tabeli `flashcards`. Sesje powtórek są tymczasowe (React state/sessionStorage), ale stan każdej fiszki persystuje w bazie po każdej odpowiedzi, co pozwala na kalkulację harmonogramu w kolejnych sesjach.
