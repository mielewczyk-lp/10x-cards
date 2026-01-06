# Architektura UI dla 10x Cards

## 1. Przegląd struktury UI

Aplikacja 10x Cards składa się z pojedynczej aplikacji React osadzonej w Astro. Po zalogowaniu użytkownik trafia do głównego ekranu „Create”, w którym może:

1. wygenerować kandydatów fiszek z użyciem AI (domyślna zakładka),
2. dodać pojedynczą fiszkę manualnie (druga zakładka lub modal).

Pozostałe kluczowe widoki to lista zaakceptowanych fiszek, opcjonalny ekran sesji powtórek, ustawienia konta oraz formularze auth. Nawigacja realizowana jest poprzez top-bar (desktop) / hamburger (mobile) i wykorzystuje standardowy router kliencki. Komponenty modal/toast renderują się w portalu `#__portal`. Całość spełnia WCAG AA, obsługuje dark mode i zabezpiecza trasy guardami Supabase Auth.

## 2. Lista widoków

### Login

**Ścieżka URL:** `/login`  
**Główny cel:** Umożliwić logowanie istniejącego użytkownika  
**Kluczowe informacje:** Pola e-mail, hasło, link „Register”  
**Kluczowe komponenty:** `AuthForm`, `Button`, `Input`  
**UX / A11y / Bezpieczeństwo:** Walidacja klient/serwer, focus management, obsługa 401/403

### Register

**Ścieżka URL:** `/register`  
**Główny cel:** Utworzyć nowe konto  
**Kluczowe informacje:** Pola e-mail, hasło + confirm  
**Kluczowe komponenty:** `AuthForm`  
**UX / A11y / Bezpieczeństwo:** Walidacja, powiadomienia o błędach Supabase

### Create (AI)

**Ścieżka URL:** `/create?tab=ai` (domyślna)  
**Główny cel:** Generacja kandydatów AI i ich recenzja  
**Kluczowe informacje:** Pole tekstowe 1000–10000, przycisk „Generate”, licznik znaków, lista kandydatów, pasek podsumowania, przycisk „Zapisz zatwierdzone”  
**Kluczowe komponenty:** `TextAreaWithCounter`, `GenerateButton`, `CandidateList`, `StatusBar`, `BulkSaveButton`  
**UX / A11y / Bezpieczeństwo:** ARIA-live dla licznika i błędów, loading overlay, lokalny state kandydatów

### Create (Manual)

**Ścieżka URL:** `/create?tab=manual` lub modal `#/create/manual`  
**Główny cel:** Ręczne dodanie jednej fiszki  
**Kluczowe informacje:** Pola front/back, przycisk „Save”  
**Kluczowe komponenty:** `FlashcardForm`, `Modal`  
**UX / A11y / Bezpieczeństwo:** Walidacja natychmiastowa, focus trap w modalu

### Flashcards List

**Ścieżka URL:** `/flashcards`  
**Główny cel:** Zarządzanie zaakceptowanymi fiszkami  
**Kluczowe informacje:** Tabela front/back, źródło, sort, paginacja, wyszukiwarka `q`  
**Kluczowe komponenty:** `Table`, `Pagination`, `SearchInput`, `SortDropdown`, `EditButton`, `DeleteButton`  
**UX / A11y / Bezpieczeństwo:** Responsywna tabela (scroll x), rola ARIA `table`, potwierdzenie usuwania

### Flashcard Edit

**Ścieżka URL:** `/flashcards?edit={id}` (modal)  
**Główny cel:** Edycja istniejącej fiszki  
**Kluczowe informacje:** Formularz front/back (prefill)  
**Kluczowe komponenty:** `FlashcardForm`, `Modal`  
**UX / A11y / Bezpieczeństwo:** Etykiety pól, walidacja, PATCH `/flashcards/{id}`

### Review Session

**Ścieżka URL:** `/review` (feature-flag)  
**Główny cel:** Przeprowadzenie sesji powtórek  
**Kluczowe informacje:** Kolejka fiszek, front, przycisk „Show answer”, ocena wiedzy (Easy/Hard/Again)  
**Kluczowe komponenty:** `ReviewCard`, `AnswerButtons`, `ProgressBar`  
**UX / A11y / Bezpieczeństwo:** Klawisze skrótów, focus management, zapis wyników, obsługa braku fiszek

### Account Settings

**Ścieżka URL:** `/account`  
**Główny cel:** Zmiana hasła, usunięcie konta, wylogowanie  
**Kluczowe informacje:** Formularz zmiany hasła, przycisk „Delete account”  
**Kluczowe komponenty:** `PasswordForm`, `DangerZone`  
**UX / A11y / Bezpieczeństwo:** Potwierdzenia krytycznych akcji, mail potwierdzający, signOut + redirect

### Not Found

**Ścieżka URL:** `*`  
**Główny cel:** Wyświetlić stronę 404  
**Kluczowe informacje:** Komunikat o błędzie, link „Home”  
**Kluczowe komponenty:** `ErrorPage`  
**UX / A11y / Bezpieczeństwo:** Standardowy ekran błędu

## 3. Mapa podróży użytkownika

1. Anonymous użytkownik → `Register` lub `Login`.
2. Po sukcesie auth → redirect do `Create` (AI tab).
3. Użytkownik wkleja tekst → „Generate” → Loading → lista kandydatów.
4. Użytkownik akceptuje/edytuje/odrzuca kandydatów:
   a. „Edit” otwiera modal z pre-wypełnionym front/back.
   b. „Save accepted” wysyła bulk POST `/flashcards` → sukces → lista kandydatów czyści się, toast „Saved!”.
5. Użytkownik przechodzi do `Flashcards List` aby przeglądać/zarządzać fiszkami; może:
   a. wyszukać,
   b. edytować (modal),
   c. usunąć (confirm).
6. (Opcjonalnie) → `Review` → start POST `/review-sessions` → ocenia kolejne karty (PATCH) → sesja kończy się komunikatem.
7. Użytkownik otwiera `Account` aby zmienić hasło lub usunąć konto.
8. Wylogowanie → redirect `/login` i czyszczenie sesji.

## 4. Układ i struktura nawigacji

Top-bar (desktop) / Hamburger (mobile):

- Brand logo → `/create`
- Create (tabbed AI / Manual)
- Flashcards
- Review (feature-flag)
- Account (menu: Change password, Delete account, Logout)

Widok Create wykorzystuje zakładki (`shadcn/ui Tabs`) aby przełączać AI/Manual bez zmiany ścieżki poza query param `tab`. Modalowane ścieżki (`#/create/manual`, `?edit={id}`) wykorzystują portal i zachowują tło.

Guardy routingu:

- Trasy `/create`, `/flashcards`, `/review`, `/account` wymagają aktywnej sesji Supabase; brak → redirect `/login`.

## 5. Kluczowe komponenty wielokrotnego użytku

1. `AuthForm` – obsługuje login/registrację z walidacją.
2. `TextAreaWithCounter` – pole tekstowe z limitem 10 000 znaków, kolorami stanu i ARIA-live.
3. `CandidateList` – lista kandydatów AI z akcjami accept/edit/reject.
4. `FlashcardForm` – uniwersalny formularz front/back używany w manual create i edit.
5. `Table` + `Pagination` + `SearchInput` – zarządzanie dużymi listami.
6. `Modal` – focus trap, role dialog, portal `#__portal`.
7. `LoadingOverlay` – globalny spinner blokujący UI podczas fetch.
8. `Toast` – feedback sukces/błąd.
9. `FetchProvider` – wrapper fetch z jwt oraz auto-signOut on 401/403.
10. `ErrorBoundary` – wychwytuje nieoczekiwane błędy UI.
