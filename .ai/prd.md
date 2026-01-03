# Dokument wymagań produktu (PRD) - 10x Cards

## 1. Przegląd produktu

10x Cards to webowa aplikacja wspierająca tworzenie i utrwalanie wiedzy poprzez fiszki oraz algorytm spaced repetition. Produkt adresuje pojedynczego, samodzielnego użytkownika, który chce szybko zamienić własne materiały w zestawy fiszek i wracać do nich w powtarzalnym planie nauki. MVP dostarcza dwie ścieżki tworzenia fiszek (AI i manualną), prosty przepływ recenzji kandydatów, przechowywanie zaakceptowanych fiszek na koncie użytkownika oraz integrację z otwartoźródłową biblioteką powtórek. Interfejs budowany jest na gotowych komponentach UI, a całość utrzymywana przez jednego full-stack developera.

## 2. Problem użytkownika

Manualne pisanie fiszek wymaga znacznego czasu i dyscypliny, co skutkuje porzucaniem metody spaced repetition mimo jej wysokiej skuteczności. Użytkownicy mają rozproszone materiały (notatki, artykuły, skrypty) i potrzebują narzędzia, które w kilka minut wygeneruje gotowe fiszki, pozwoli je szybko przejrzeć i natychmiast rozpocząć naukę. Dodatkowo chcą przechowywać wszystkie zaakceptowane fiszki w jednym miejscu oraz mieć pewność, że mogą zarządzać swoim kontem i prywatnością.

## 3. Wymagania funkcjonalne

1. Generowanie AI:
   - Formularz przyjmujący tekst 1000–10000 znaków (walidacja front/back-end).
   - Synchroniczne wywołanie modelu AI zwracające listę kandydatów (front/back).
   - Przechowywanie kandydatów wyłącznie w pamięci przeglądarki do czasu decyzji.
2. Manualne tworzenie fiszek:
   - Formularz front/back z walidacją pól.
   - Natychmiastowe zapisanie zaakceptowanej fiszki w bazie użytkownika.
3. Recenzja kandydatów:
   - Widok listy pod formularzem AI.
   - Akcje zaakceptuj, edytuj, odrzuć dla pojedynczych pozycji.
   - Zapisanie decyzji, przy czym tylko zaakceptowane trafiają do bazy.
4. Zarządzanie fiszkami:
   - Lista zaakceptowanych fiszek z paginacją i wyszukiwarką tekstową.
   - Edycja istniejącej fiszki przechowywanej w bazie użytkownika.
   - Usuwanie fiszek z potwierdzeniem.
5. Konta użytkowników:
   - Rejestracja, logowanie, wylogowanie przez Supabase Auth.
   - Zmiana hasła oraz samodzielne usunięcie konta.
6. Algorytm powtórek:
   - Integracja z gotowym algorytmem do wyznaczania harmonogramu.
   - Brak zaawansowanych funkcji oraz metadanych w MVP
7. Observability i dane:
   - Logowanie zdarzeń (akceptacja, odrzucenie, źródło fiszki) w bazie do kalkulacji KPI.
   - Brak zewnętrznej analityki; raporty realizowane zapytaniami do bazy.
8. Walidacja i obsługa błędów:
   - Komunikaty błędów na formularzach (długość tekstu, brak pól, time-out AI).
   - Retries i komunikat o niepowodzeniu integracji algorytmu powtórek.

## 4. Granice produktu

1. W zakresie:
   - Webowa aplikacja desktop/mobile-web.
   - Jedna persona, brak ról administracyjnych.
2. Poza zakresem MVP:
   - Import dokumentów (PDF, DOCX, itp.) oraz API do masowego wgrywania treści.
   - Współdzielenie lub publikowanie zestawów między użytkownikami.
   - Integracje z platformami edukacyjnymi i aplikacje mobilne natywne.
   - Zaawansowana telemetria, dashboardy, A/B testy.
   - Rozszerzone metadane fiszek (tagi, decki wielopoziomowe) poza front/back.

## 5. Historyjki użytkowników

ID: US-001  
Tytuł: Rejestracja i logowanie  
Opis: Jako nowy użytkownik chcę utworzyć konto i logować się przez Supabase Auth, aby moje fiszki były przypisane do mojego profilu.  
Kryteria akceptacji:

- Formularz rejestracji waliduje email i hasło, a po sukcesie użytkownik jest zalogowany.
- Logowanie wymaga poprawnych danych; błędy wyświetlane są na formularzu.
- Wylogowanie usuwa sesję z przeglądarki.

ID: US-002  
Tytuł: Zarządzanie hasłem i kontem  
Opis: Jako zalogowany użytkownik chcę zmienić hasło i móc usunąć konto, aby zachować kontrolę nad bezpieczeństwem.  
Kryteria akceptacji:

- Zmiana hasła wymaga podania obecnego hasła i potwierdzenia nowego.
- Po usunięciu konta wszystkie fiszki użytkownika są trwale usuwane.
- System potwierdza e-mailem krytyczne operacje (o ile wspiera to Supabase).

ID: US-003  
Tytuł: Walidacja tekstu wejściowego  
Opis: Jako użytkownik chcę, aby aplikacja weryfikowała długość i pustą treść, zanim wyślę tekst do AI, żeby uniknąć błędów.  
Kryteria akceptacji:

- Tekst krótszy niż 1000 znaków lub dłuższy niż 10000 znaków nie przechodzi walidacji i wyświetlany jest komunikat.
- Walidacja działa identycznie na froncie i backendzie.
- Po naprawieniu błędu użytkownik może ponowić wysyłkę bez odświeżania strony.

ID: US-004  
Tytuł: Generowanie kandydatów AI  
Opis: Jako użytkownik chcę wkleić tekst i otrzymać listę kandydatów front/back, aby szybko stworzyć fiszki.  
Kryteria akceptacji:

- Po wysłaniu poprawnego tekstu pojawia się wizualny stan ładowania i synchroniczna odpowiedź z kandydatami.
- Każdy kandydat zawiera pytanie i odpowiedź zgodne z formatem fiszki.
- W przypadku błędu sieci/AI użytkownik widzi komunikat i może ponowić próbę.

ID: US-005  
Tytuł: Recenzja kandydatów  
Opis: Jako użytkownik chcę przeglądać kandydatów AI i decydować, które zaakceptować, edytować lub odrzucić.  
Kryteria akceptacji:

- Lista kandydatów jest renderowana pod formularzem i pozostaje w pamięci do zakończenia sesji.
- Dla każdej fiszki dostępne są przyciski akcji; edycja otwiera modal z polami front/back.
- Po potwierdzeniu decyzji tylko zaakceptowane fiszki zapisują się w bazie, reszta jest odrzucana lokalnie.
- W bazie przechowujemy również źródło z którego wygenerowano fiszki z informacjami o tym ile z nich zostało zaakceptowanych/odrzuconych.

ID: US-006  
Tytuł: Manualne tworzenie fiszki  
Opis: Jako użytkownik chcę ręcznie wprowadzić front i back, aby doprecyzować treści trudne dla AI.  
Kryteria akceptacji:

- Formularz nie pozwala zapisać pustych pól i wyświetla komunikaty walidacyjne.
- Po zapisie fiszka trafia do listy zaakceptowanych bez przeładowania strony.
- Użytkownik otrzymuje potwierdzenie sukcesu lub błąd zapisu.

ID: US-007  
Tytuł: Lista zaakceptowanych fiszek  
Opis: Jako użytkownik chcę widzieć wszystkie swoje zatwierdzone fiszki z możliwością filtrowania, aby zarządzać nauką.  
Kryteria akceptacji:

- Widok zawiera wyszukiwarkę tekstową oraz paginację dla większych zbiorów.
- Każdy rekord prezentuje front/back oraz źródło (AI/manualne).
- Wyniki odświeżają się bez przeładowania strony.

ID: US-008  
Tytuł: Edycja fiszki  
Opis: Jako użytkownik chcę edytować istniejącą fiszkę, aby poprawić treść po weryfikacji.  
Kryteria akceptacji:

- Edycja jest dostępna z listy fiszek i otwiera formularz z aktualnymi danymi.
- Po zapisaniu zmiany natychmiast są widoczne i zapisane w bazie.
- W przypadku konfliktu zapisu użytkownik otrzymuje informację i sugestię ponowienia.

ID: US-009  
Tytuł: Usuwanie fiszki  
Opis: Jako użytkownik chcę usuwać niepotrzebne fiszki, aby utrzymać porządek w bazie.  
Kryteria akceptacji:

- Przed usunięciem pojawia się potwierdzenie.
- Po potwierdzeniu fiszka znika z listy i z bazy.
- Błędne próby usunięcia zwracają komunikat z opcją ponowienia.

ID: US-010  
Tytuł: Sesja powtórek  
Opis: Jako użytkownik chcę uruchomić sesję powtórek wykorzystując bibliotekę spaced repetition, by ćwiczyć zaakceptowane fiszki.  
Kryteria akceptacji:

- System generuje kolejkę fiszek zgodnie z harmonogramem biblioteki.
- Po każdej odpowiedzi użytkownik oznacza swój poziom wiedzy, a biblioteka zwraca kolejny termin powtórki.
- Wyniki sesji zapisują się w bazie i aktualizują status fiszek.

ID: US-011  
Tytuł: Telemetria KPI w bazie  
Opis: Jako właściciel produktu chcę odczytywać wskaźniki akceptacji i udziału AI bezpośrednio z bazy, by ocenić sukces MVP.  
Kryteria akceptacji:

- Każde zapisanie fiszki rejestruje źródło (AI/manualne)
-
- Można uruchomić zapytanie SQL zwracające procent akceptacji i udział fiszek z AI dla wybranego okresu.

## 6. Metryki sukcesu

1. 75% fiszek wygenerowanych przez AI jest akceptowanych po recenzji użytkownika (mierzone relacją zaakceptowanych do wszystkich wygenerowanych w bazie).
2. 75% wszystkich fiszek tworzonych przez użytkowników pochodzi z funkcji AI (źródło = AI w logach zapisu).
3. Odsetek sesji powtórek zakończonych bez błędów synchronizacji ⩾ 95% (logi integracji biblioteki).
