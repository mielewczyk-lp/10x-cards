## 1. Wprowadzenie i cele testowania
Celem testów jest potwierdzenie, że aplikacja 10x Cards (Astro + React + Supabase + OpenRouter) spełnia wymagania MVP: bezpieczna obsługa kont, generowanie i zarządzanie fiszkami, sesje powtórek (spaced repetition), stabilna integracja AI oraz poprawne logowanie KPI. Plan uwzględnia SSR Astro, API endpoints w `src/pages/api`, logikę usług w `src/lib/services` oraz walidacje Zod w `src/lib/validation`.

## 2. Zakres testów
- Funkcje kluczowe: rejestracja/logowanie/wylogowanie, reset hasła, zmiana hasła, usunięcie konta.
- Generowanie AI: walidacja długości tekstu, obsługa błędów AI, zapis źródeł generacji i metryk.
- Manualne tworzenie i CRUD fiszek, wyszukiwanie, paginacja, edycja, usuwanie.
- Sesje powtórek (SM-2), zapisywanie wyników, scenariusze braku fiszek do powtórki.
- Tryb practice (losowe fiszki).
- Statystyki i logi błędów (generation_sources).
- Middleware ochrony tras i obsługa sesji Supabase.
- UI (Astro + React islands) oraz kluczowe komponenty interaktywne.

Poza zakresem: import dokumentów, integracje zewnętrzne poza Supabase i OpenRouter, natywne aplikacje mobilne.

## 3. Typy testów do przeprowadzenia
- Testy jednostkowe: usługi w `src/lib/services`, walidacje Zod, utilsy.
- Testy integracyjne: API endpoints + Supabase (CRUD, autoryzacja, błędy).
- Testy end-to-end: kluczowe ścieżki użytkownika w UI (Astro/React).
- Testy bezpieczeństwa: kontrola dostępu, izolacja danych per user, sesje/cookies.
- Testy niezawodności: obsługa błędów AI, timeouty, rate limits.
- Testy wydajnościowe: listy fiszek, generowanie, sesje powtórek.
- Testy dostępności (a11y): formularze, dialogi, komunikaty błędów.
- Testy regresji: kluczowe ścieżki po zmianach.

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1 Uwierzytelnianie i sesja
- Rejestracja z poprawnymi danymi, automatyczne zalogowanie.
- Walidacja pól (email/hasło), komunikaty błędów.
- Logowanie poprawne i błędne (zły login/hasło, niepotwierdzony email, rate limit).
- Wylogowanie i wygaszenie sesji (middleware przekierowuje na `/login`).
- Reset hasła: poprawny flow i błędne tokeny.
- Zmiana hasła w panelu konta, walidacje i potwierdzenia.
- Usunięcie konta: usunięcie fiszek i danych użytkownika.
- Dostęp do stron chronionych bez sesji -> przekierowanie.

### 4.2 Generowanie AI i recenzja kandydatów
- Walidacja inputText: <1000 i >10000 znaków (front i backend).
- Sukces generowania: poprawna lista kandydatów, zapis źródła, model_name.
- Obsługa błędów AI: brak klucza, timeout, rate limit, błędny JSON odpowiedzi.
- Edycja i akceptacja kandydatów: zapis do DB, source_type (ai-full vs ai-edited).
- Odrzucenie kandydatów: nie zapisuje fiszek, aktualizuje metryki.
- Telemetria: total_generated/accepted/rejected/accepted_edited poprawnie liczone.

### 4.3 Manualne tworzenie fiszek
- Walidacja front/back, brak pustych pól.
- Natychmiastowy zapis i pojawienie się na liście bez reloadu.
- Obsługa błędów zapisu i komunikatów.

### 4.4 Lista fiszek i CRUD
- Pobieranie listy z paginacją i sortowaniem.
- Wyszukiwanie full‑text (search_vector) i poprawność wyników.
- Pobranie pojedynczej fiszki po ID (tylko własne dane).
- Edycja: zmiana source_type na ai‑edited przy edycji ai-full.
- Usuwanie z potwierdzeniem i obsługa błędów.

### 4.5 Sesje powtórek (SM‑2)
- Start sesji z limitem (domyślny i >50).
- Brak fiszek do powtórki -> zwracany nextReviewDate.
- Odpowiedzi z oceną 0–5, poprawna aktualizacja stanu SM‑2.
- Aktualizacja next_review_at i pobieranie następnej fiszki.
- Obsługa błędów i przypadków nieautoryzowanych.

### 4.6 Practice (free learning)
- Losowe fiszki, limit i przypadek braku fiszek.
- Stabilne zachowanie przy dużej liczbie fiszek.
- Autoryzacja i izolacja danych per user.

### 4.7 Statystyki i logi
- Endpointy statystyk i logów (sources/errors).
- Poprawność danych KPI (źródło fiszki, akceptacja, udział AI).
- Obsługa pustych danych i błędów bazy.

### 4.8 UI/UX i dostępność
- Stan ładowania, błędy i komunikaty.
- Dialogi edycji/usuwania i focus management.
- Responsywność (mobile/desktop).

## 5. Środowisko testowe
- Lokalny dev: Node 22, Astro dev server.
- Supabase: lokalny projekt z migracjami z `supabase/migrations`.
- Środowisko testowe z osobną bazą i kluczami API.
- OpenRouter: środowisko testowe z mockami lub kontrolowanym kluczem.
- Przeglądarki: Chrome, Firefox, Safari (min. ostatnie 2 wersje).

## 6. Narzędzia do testowania
- Unit/integration: Vitest + Testing Library, Zod schema tests.
- E2E: Playwright (Astro + React).
- Mocki: MSW dla OpenRouter i API.
- API: Vitest + fetch (bezpośrednie testy endpoints).
- Lint: ESLint, Prettier (regresja jakościowa).
- A11y: Axe/Playwright-a11y.

## 7. Harmonogram testów
- Tydzień 1: przygotowanie środowiska + testy jednostkowe usług i walidacji.
- Tydzień 2: testy integracyjne API + Supabase, scenariusze negatywne.
- Tydzień 3: testy E2E kluczowych ścieżek, a11y, smoke.
- Tydzień 4: regresja, wydajność podstawowa, stabilizacja.

## 8. Kryteria akceptacji testów
- 0 krytycznych i wysokich błędów otwartych.
- 100% przejścia ścieżek krytycznych: auth, generowanie AI, CRUD fiszek, review session.
- Pokrycie testami jednostkowymi usług i walidacji min. 80%.
- Brak naruszeń bezpieczeństwa (dostęp do cudzych danych).
- Stabilne zachowanie przy błędach AI i problemach sieciowych.

## 9. Role i odpowiedzialności
- QA Lead: plan, priorytety, raporty jakości.
- QA Engineer: przygotowanie przypadków, automatyzacja testów, raportowanie.
- Developer: wsparcie w triage, naprawy, dostarczanie buildów.
- Product Owner: akceptacja funkcjonalna i priorytety biznesowe.

## 10. Procedury raportowania błędów
- Narzędzie: GitHub Issues.
- Wymagane dane: środowisko, kroki, expected/actual, logi, screeny.
- Priorytety: Critical/High/Medium/Low.
- SLA: Critical <24h, High <48h, Medium <5 dni, Low zgodnie z backlogiem.
