-- Dodaj kolumny SM-2 do istniejącej tabeli flashcards
ALTER TABLE public.flashcards 
  ADD COLUMN IF NOT EXISTS sm2_interval INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sm2_repetition INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sm2_efactor DECIMAL(3,2) NOT NULL DEFAULT 2.50,
  ADD COLUMN IF NOT EXISTS next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Dodaj constraints
ALTER TABLE public.flashcards 
  ADD CONSTRAINT check_sm2_interval CHECK (sm2_interval >= 0),
  ADD CONSTRAINT check_sm2_repetition CHECK (sm2_repetition >= 0),
  ADD CONSTRAINT check_sm2_efactor CHECK (sm2_efactor >= 1.3 AND sm2_efactor <= 3.0);

-- Dodaj indeks dla wydajnego pobierania fiszek do powtórki
-- Indeks bez warunku WHERE - PostgreSQL nie pozwala na NOW() w partial index
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review 
  ON public.flashcards(user_id, next_review_at ASC);

-- Zaktualizuj istniejące fiszki (jeśli są) aby miały sensowne wartości
UPDATE public.flashcards 
SET next_review_at = NOW() 
WHERE next_review_at IS NULL OR next_review_at < created_at;

-- Dodaj komentarze dla dokumentacji
COMMENT ON COLUMN public.flashcards.sm2_interval IS 
  'SM-2 algorithm: days until next review';
COMMENT ON COLUMN public.flashcards.sm2_repetition IS 
  'SM-2 algorithm: number of successful repetitions';
COMMENT ON COLUMN public.flashcards.sm2_efactor IS 
  'SM-2 algorithm: ease factor (1.3-3.0, default 2.5)';
COMMENT ON COLUMN public.flashcards.next_review_at IS 
  'Timestamp when flashcard is due for next review';
