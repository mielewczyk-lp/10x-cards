# Specyfikacja modułu Autentykacji (US-001, US-002)

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 1.1 Strony Astro

• `/login` – layout `AuthLayout.astro`, dostęp publiczny, formularz logowania.  
• `/register` – layout `AuthLayout.astro`, dostęp publiczny, formularz rejestracji.  
• `/forgot-password` – layout `AuthLayout.astro`, dostęp publiczny, formularz przypomnienia hasła.  
• `/reset-password` – layout `AuthLayout.astro`, dostęp publiczny, formularz ustawienia nowego hasła (otwierany z linku w emailu Supabase).  
• `/account` – layout `Layout.astro` (główny), tylko dla zalogowanych; zmiana hasła, usunięcie konta.  
• Fallback – każda próba wejścia na stronę chronioną bez sesji przekierowuje do `/login`.

`AuthLayout.astro` to uproszczony layout bez globalnej nawigacji, z centralnym panelem formularza.

### 1.2 Komponenty React (client:only / client:load)

• `AuthForm.tsx` – kontener przyjmujący `mode: 'login' | 'register'`, konfiguruje pola formularza i akcję submit.  
• `PasswordStrength.tsx` – wskaźnik siły hasła (tylko w trybie rejestracji).  
• `ForgotPasswordForm.tsx` – formularz wysyłki linku resetu hasła.  
• `ResetPasswordForm.tsx` – formularz ustawienia nowego hasła po kliknięciu w link z e-maila.  
• `ChangePasswordForm.tsx` – formularz zmiany hasła na stronie `/account`.  
• `DangerZoneCard.tsx` – sekcja „Delete account” na `/account`.  
• Komponenty bazowe UI: `Input`, `Button`, `Label`, `Card`, `Alert` z katalogu `src/components/ui`.

Interaktywność (walidacja, wysyłka) obsługuje React; SSR zapewnia Astro.

### 1.3 Przepływy

1. **Rejestracja**  
   a. Użytkownik wypełnia email + hasło (+ opcjonalnie powtórz hasło).  
   b. `AuthForm` wywołuje `supabase.auth.signUp()`.  
   c. Sukces → redirect do `/create`.  
   d. Błąd → komunikat w polu/alert, fokus na pierwszym błędnym polu.

2. **Logowanie**  
   a. Strona `/login` z `AuthForm mode='login'`.  
   b. `supabase.auth.signInWithPassword()`.  
   c. Sukces → redirect do `/create`.  
   d. Błąd (401/403) → komunikat.

3. **Wylogowanie**  
   • Przycisk w nawigacji głównej (`Header.tsx`) wywołuje `supabase.auth.signOut()` i przekierowuje do `/login`.

4. **Zmiana hasła**  
   a. Strona `/account` z `ChangePasswordForm`.  
   b. `supabase.auth.updateUser({ password })`.  
   c. Sukces → toast „Hasło zaktualizowane”.  
   d. Błąd → komunikat.

5. **Usunięcie konta**  
   a. Klik „Delete account” w `DangerZoneCard`.  
   b. Modal potwierdzenia.  
   c. Wywołanie `/api/account/delete` (patrz §2).  
   d. Sukces → redirect do `/register` + toast.  
  
6. **Przypomnienie hasła / Reset**  
   a. Użytkownik klika link „Zapomniałem hasła” na `/login` → redirect `/forgot-password`.  
   b. `ForgotPasswordForm` wysyła `supabase.auth.resetPasswordForEmail(email)` (ustawiając URL `SITE_URL/reset-password`).  
   c. Sukces → komunikat „Sprawdź skrzynkę e-mail”.  
   d. Użytkownik otwiera link z e-maila: `/reset-password?access_token=...`.  
   e. Strona `/reset-password` z `ResetPasswordForm` (pola: nowe hasło + powtórz).  
   f. Submit wywołuje `supabase.auth.updateUser({ password })` (token z query jest użyty automatycznie).  
   g. Sukces → redirect `/login` + toast „Hasło zmienione, możesz się zalogować”.  
   h. Błąd / wygasły token → komunikat.

### 1.4 Walidacja i komunikaty

* Frontend: Zod z dzielonymi schematami (`src/lib/validation/authSchemas.ts`).
* Reguły
  * Email – zgodny z RFC 5322, wymagany.
  * Hasło – min. 8 znaków, co najmniej 1 litera i 1 cyfra.
  * Powtórzone hasło musi być identyczne.
* Błędy z Supabase mapowane na przyjazne komunikaty (wzorowane na `openRouterErrors.ts`).

### 1.5 Scenariusze edge-case

* Wejście na stronę chronioną bez sesji → middleware przekierowuje do `/login`.
* Wejście na `/login` lub `/register` przy aktywnej sesji → guard w `AuthLayout` przekierowuje do `/create`.
* Wygaśnięcie sesji → globalny listener `supabase.auth.onAuthStateChange` wyświetla toast i przeładowuje do `/login`.

---

## 2. LOGIKA BACKENDOWA (Astro API)

### 2.1 Endpointy API (server-side TypeScript)

• `src/pages/api/account/delete.ts` – metoda `POST`, wymaga uwierzytelnienia; usuwa użytkownika i jego dane (flashcards, generation_sources) w jednej transakcji.  
• `src/pages/api/account/purge-fiszki.ts` – metoda `POST`, opcjonalny endpoint developerski do czyszczenia fiszek użytkownika.

Supabase operacje `signUp`, `signIn`, `updateUser` realizuje bezpośrednio z frontu za pomocą SDK, więc dodatkowe endpointy nie są potrzebne.

### 2.2 Logika `delete.ts`

1. Z nagłówka `Authorization` pobieramy JWT (helper `getSupabaseServerClient`).
2. Walidujemy sesję; brak → 401.
3. W transakcji:  
   • `DELETE FROM flashcards WHERE user_id = auth.uid();`  
   • `DELETE FROM generation_sources WHERE user_id = auth.uid();`  
   • `supabase.auth.admin.deleteUser(uid)`.
4. Zwrot `204 No Content`.

Błędy logujemy w `src/lib/errors`.

### 2.3 Walidacja wejścia

• `delete.ts` – brak payloadu, więc brak walidacji.  
• Przyszłe endpointy – schematy Zod z `src/lib/validation`.

### 2.4 Middleware

W `src/middleware/index.ts` rozszerzamy:

* `isProtected(path)` – brak sesji i ścieżka do `/create`, `/account`, wybranych `/api` → redirect `/login`.
* `isPublicAuth(path)` – aktywna sesja i ścieżka `/login` lub `/register` → redirect `/create`.

Implementacja korzysta z `getSupabaseServerClient(Astro)` zgodnie z istniejącym wzorcem.

---

## 3. SYSTEM AUTENTYKACJI (Supabase Auth × Astro)

### 3.1 Kluczowe elementy

1. Klient przeglądarkowy – `src/lib/supabase.browser.ts`, singleton `createClient(anonKey, url)`.  
2. Klient serwerowy – `src/lib/supabase.server.ts` z cookies (`Astro.request.headers`).  
3. Provider React – `AuthProvider.tsx` (Context) dostarczający `session`, `user`, `signIn`, `signUp`, `signOut`.  
4. Hook – `useAuth()`.

### 3.2 Przechowywanie sesji

Supabase JS używa Auth Cookies. Astro SSR odczytuje je podczas renderowania po stronie serwera.

### 3.3 Flow e-mail / potwierdzenia

• Jeśli skonfigurowano SMTP w Supabase, krytyczne operacje (usunięcie konta, zmiana hasła) wyzwalają maile potwierdzające.
• UI do magic links nie jest wymagane w MVP.

### 3.4 Zmiany w bazie danych

Brak – Supabase tworzy tabelę `auth.users`; istniejące tabele `flashcards` i `generation_sources` zawierają `user_id uuid` z FK do `auth.users(id)`.

### 3.5 Bezpieczeństwo

* CSRF – zabezpieczenie przez SameSite Cookies.  
* Hasła – bezpiecznie przechowywane przez Supabase (bcrypt).  
* Limity prób logowania – domyślne rate-limity Supabase; UI wyświetla komunikat „Too many attempts”.

---

## 4. WYMAGANIA IMPLEMENTACYJNE

1. Wszystkie pliki zgodne ze strukturą katalogów (patrz Shared Rules).  
2. Komponenty React w Typescript.  
3. Walidacja – Zod w `src/lib/validation/authSchemas.ts`.  

---

## 5. PODSUMOWANIE

Specyfikacja opisuje pełny zakres dodania rejestracji, logowania oraz zarządzania kontem z wykorzystaniem Supabase Auth. Zmiany integrują się z istniejącą architekturą Astro + React i nie wpływają na dotychczasowe funkcje generowania fiszek, wprowadzając jednocześnie ochronę poprzez middleware i procedurę kasowania danych użytkownika.