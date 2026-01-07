# Plan implementacji widoku Create (AI)

## 1. Przegląd

Widok „Create (AI)” umożliwia użytkownikowi wklejenie dłuższego fragmentu tekstu (1000 – 10 000 znaków), wygenerowanie kandydatów fiszek przez usługę AI, przejrzenie otrzymanej listy, edycję/odrzucenie poszczególnych pozycji oraz zapisanie zaakceptowanych fiszek do bazy. Widok realizuje historie US-003 – US-005 z PRD.

## 2. Routing widoku

- Ścieżka: `/create?tab=ai` (domyślny **tab** = `ai`).
- Konfiguracja w `src/pages/create.astro` + obsługa parametru `tab` (Astro + React islands).

## 3. Struktura komponentów

```
CreateAiView (page)
└─ <AIFlowPanel>
   ├─ <TextAreaWithCounter>
   ├─ <GenerateButton>
   ├─ <StatusBar>
   ├─ <CandidateList>
   │   ├─ <CandidateItem>*
   │   │   └─ <EditCandidateModal>*
   └─ <BulkSaveButton>
```

(\*) komponenty renderowane wielokrotnie / warunkowo.

## 4. Szczegóły komponentów

### AIFlowPanel

- **Opis**: kontener logiki widoku; zarządza stanem, wywołaniami API i propaguje callbacki do dzieci.
- **Elementy**: wrapper `div`, dzieci wymienione w strukturze.
- **Interakcje**:
  - `onGenerate` → POST `/generation-sources`.
  - `onSaveAccepted` → POST `/flashcards` + PATCH `/generation-sources/{id}`.
- **Walidacja**: przy wywołaniu `onGenerate` sprawdza długość `inputText` (1000–10 000).
- **Typy**: `CreateGenerationSourceCommand`, `CreateGenerationSourceResponseDto`, lokalny `FlashcardCandidate`.
- **Propsy**: brak (komponent najwyższego poziomu).

### TextAreaWithCounter

- **Opis**: pole tekstowe z licznikiem znaków (ARIA-live), walidacją zakresu.
- **Elementy**: `<textarea>`, `<span>` licznik.
- **Interakcje**: `onChange(text)` → aktualizuje stan `inputText`.
- **Walidacja**: długość <1000 lub >10 000 → klasa `error`, komunikat.
- **Typy**: `props: { value: string; onChange: (v: string) => void; error?: string }`.
- **Propsy**: patrz wyżej.

### GenerateButton

- **Opis**: przycisk wysyłający żądanie generowania; disabled podczas walidacji lub `loading`.
- **Elementy**: `<button>` z spinnerem.
- **Interakcje**: `onClick` → wywołuje callback.
- **Walidacja**: niedostępny gdy błąd walidacji lub request in-flight.
- **Typy**: `{ loading: boolean; disabled: boolean; onClick: () => void }`.

### StatusBar

- **Opis**: pasek informacyjny o stanie: liczba kandydatów, zaakceptowanych, odrzuconych, edytowanych.
- **Elementy**: `div` z ikonami + licznikami.
- **Interakcje**: tylko prezentacja.
- **Typy**: `{ stats: { total: number; accepted: number; edited: number; rejected: number } }`.

### CandidateList

- **Opis**: lista komponentów `CandidateItem`; wirtualizacja przy N > 50.
- **Elementy**: `<ul>` `<li>`.
- **Interakcje**: przekazywanie callbacków do itemów.
- **Typy**: `{ candidates: FlashcardCandidate[]; onUpdate(id, update); }`.

### CandidateItem

- **Opis**: pojedynczy kandydat z przyciskami Accept / Edit / Reject.
- **Elementy**: karta (`section`), front (`h2`), back (`p`), przyciski akcji.
- **Interakcje**:
  - `Accept` → zmienia `status`→`accepted`.
  - `Reject` → `rejected`.
  - `Edit` → otwiera `EditCandidateModal`.
- **Walidacja**: brak (akcje sterują stanem rodzica).
- **Typy**: `{ candidate: FlashcardCandidate; onChangeStatus(...); }`.

### EditCandidateModal

- **Opis**: modal umożliwiający edycję front/back kandydata.
- **Elementy**: 2 pola `<input>`/`textarea`, przycisk Save.
- **Interakcje**:
  - `Save` → walidacja pól, `status`→`edited+accepted`.
- **Walidacja**: front ≤200 zn., back ≤500 zn., niepuste.
- **Typy**: `{ candidate: FlashcardCandidate; onSave(updated); onClose(); }`.

### BulkSaveButton

- **Opis**: zapisuje wszystkie zaakceptowane (status `accepted|edited`) do bazy.
- **Elementy**: `<button>`.
- **Interakcje**: `onClick` → POST `/flashcards`.
- **Walidacja**: disabled gdy brak zaakceptowanych.
- **Typy**: `{ disabled: boolean; loading: boolean; onClick: () => void }`.

## 5. Typy

```ts
export interface FlashcardCandidate {
  id: string; // uuid z backendu lub lokalny tmp id
  front: string;
  back: string;
  status: "pending" | "accepted" | "edited" | "rejected";
  editedFront?: string; // dla status edited
  editedBack?: string;
}

export interface UseGenerationResult {
  sourceId: string;
  candidates: FlashcardCandidate[];
}
```

Typy DTO pochodzą z `src/types.ts` – importować zamiast redefiniować.

## 6. Zarządzanie stanem

Custom hook `useAiGenerationFlow()` przechowuje:

- `inputText`, `setInputText`
- `charCount`
- `candidates: FlashcardCandidate[]`
- `generationSourceId`
- `loadingGenerate`, `loadingSave`
- funkcje akcji (`generate()`, `updateCandidate()`, `saveAccepted()`).
  Hook wykorzystuje `useReducer` dla predykatywnych zmian stanu listy kandydatów.

## 7. Integracja API

1. **Generowanie**
   - `POST /generation-sources` body: `CreateGenerationSourceCommand`.
   - Odpowiedź 201: `CreateGenerationSourceResponseDto`.
2. **Zapis fiszek**
   - Filtrujemy kandydatów `accepted|edited` → mapujemy na `CreateFlashcardCommand[]`.
   - `POST /flashcards` body: tablica komend.
   - Odpowiedź 201: `FlashcardDto[]`.
3. **Statystyki źródła** (opcjonalne)
   - `PATCH /generation-sources/{id}` body: `UpdateGenerationSourceCommand` z polami `totalAccepted*` i `totalRejected`.

## 8. Interakcje użytkownika

1. Wpis lub wklejenie tekstu → licznik aktualizowany w czasie rzeczywistym.
2. Klik „Generate” → spinner, blokada pola, po sukcesie render listy.
3. Przyciski Accept / Reject / Edit w każdym elemencie.
4. Edycja → modal, walidacja długości, zapis zmian.
5. Klik „Save approved” → spinner, przy sukcesie toast „Saved”, reset widoku.
6. Błędy sieci/AI → bannery + możliwość ponownego kliknięcia.

## 9. Warunki i walidacja

- Input text: trim, 1000 ≤ len ≤ 10 000.
- Kandydat (przy save): front trim ≠ "", len ≤ 200; back trim ≠ "", len ≤ 500.
- Brak zaakceptowanych → przycisk Save disabled.

## 10. Obsługa błędów

| Scenariusz                       | UI Reakcja                                      |
| -------------------------------- | ----------------------------------------------- |
| 400 `INPUT_TEXT_INVALID`         | komunikat pod textarea                          |
| 502 `AI_SERVICE_UNAVAILABLE`     | toast/banner „AI niedostępne, spróbuj ponownie” |
| 500 default                      | toast „Nieoczekiwany błąd” + log console        |
| Walidacje front/back przy edycji | inline pod polami modal                         |
| Sieć offline                     | banner „Brak połączenia”                        |

## 11. Kroki implementacji

1. Utwórz stronę `src/pages/create.astro` z routingiem tabów.
2. Zaimplementuj hook `useAiGenerationFlow` w `src/lib/hooks/`.
3. Zbuduj komponenty UI w `src/components/create-ai/` (zgodnie z hierarchią).
4. Dodaj walidację inputu w `TextAreaWithCounter` + komunikaty.
5. Obsłuż POST `/generation-sources` w `generate()` – transformuj response na `FlashcardCandidate[]`.
6. Wyświetl `CandidateList` + akcje.
7. Walidacja i modal `EditCandidateModal`.
8. Implementacja `saveAccepted()` → POST `/flashcards`; po sukcesie reset stanu + toast.
9. (Opc.) PATCH `/generation-sources/{id}` z aktualnymi statystykami.
10. Uzupełnij style Tailwind + shadcn/ui (Button, Modal, Card).
11. Code review oraz ewentualna refaktoryzacja.
12. Lint + format.
