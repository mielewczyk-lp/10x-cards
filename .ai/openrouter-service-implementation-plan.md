# Przewodnik implementacji: Usługa **OpenRouterService**

---

## 1. Opis usługi
Usługa `OpenRouterService` stanowi dedykowaną warstwę integracji między aplikacją 10× Cards a publicznym interfejsem **OpenRouter API**. Odpowiada za:

* budowanie, wysyłanie i autoryzowanie zapytań do modeli LLM,
* serializację/odczyt ustrukturyzowanych komunikatów (system/user),
* walidację odpowiedzi zgodnie z `response_format`,
* bilansowanie parametrów modeli (temperatura, max tokens, top-p itp.),
* logowanie i obsługę błędów (rate-limit, invalid request, auth itp.).

---

## 2. Opis konstruktora
```ts
class OpenRouterService {
  constructor(private readonly apiKey: string, private readonly baseUrl = "https://openrouter.ai/api/v1") {}
}
```
Parametry:
1. **apiKey** – klucz autoryzacyjny (trzymany w `process.env.OPENROUTER_API_KEY`).
2. **baseUrl** – URL API (opcjonalny, domyślny do produkcyjnego endpointu – umożliwia mockowanie podczas testów).

---

## 3. Publiczne metody i pola
* **`chatCompletion(options: ChatCompletionOptions): Promise<LLMResponse>`**  
  Wysyła pojedyncze żądanie *chat / completions*.
  
  **`ChatCompletionOptions`** zawiera kluczowe pola:  
  * `system: string` – komunikat systemowy definiujący rolę/model działania. Domyślnie `DEFAULT_SYSTEM_PROMPT`.  
  * `user: string` – właściwa treść od użytkownika.  
  * `model: string` – pełna nazwa modelu (np. `openai/gpt-4o-mini`).  
  * `responseFormat: ResponseFormat` – opis schematu JSON  
  * `parameters?: ModelParams` – opcjonalne parametry temperatury, maxTokens itd.

* **statyczne pole** `DEFAULT_SYSTEM_PROMPT`  
  Ogólny komunikat systemowy wykorzystywany jeśli caller nie poda własnego.

---

## 4. Prywatne metody i pola
* **`#buildRequest(options: ChatCompletionOptions)`**  
  Łączy: `system`, `user`, `model`, `responseFormat`, `parameters` w payload wymagany przez OpenRouter API.
* **`#validateSchema(response, schema)`**  
  Waliduje zwrócony JSON z użyciem pola `responseFormat`.
* **`#http`** – instancja `fetch` z pre-konfiguracją nagłówków (Authorization, Content-Type).

---

## 5. Obsługa błędów
1. **AuthenticationError** – brak lub niepoprawny klucz.  
2. **ValidationError** – wejściowy payload nie spełnia wymagań Zod.  
3. **SchemaValidationError** – odpowiedź nie przechodzi walidacji `response_format`.  
4. **APIError** – niesklasyfikowany błąd 5xx/4xx.
5. **TimeoutError** – `AbortController` przekroczył `timeoutMs`.

---

## 6. Kwestie bezpieczeństwa
* **Przechowywanie klucza** – w zmiennych środowiskowych; brak logowania pełnego klucza.
* **Cenzura logów** – usuwanie wrażliwych danych (np. klucze API) z promptów przed zapisem.
* **Dep-type isolation** – komunikacja wyłącznie przez serwer (brak dostępu z front-endu).

---

## 7. Plan wdrożenia krok po kroku

### Krok 1 – Konfiguracja środowiska
1. Dodaj do **.env**:  
   `OPENROUTER_API_KEY=`
2. W `src/env.d.ts` rozszerz typy:
```ts
interface ImportMetaEnv {
  readonly OPENROUTER_API_KEY: string;
}
```

### Krok 2 – Struktura plików
```
src/
  lib/
    services/
      openRouterService.ts  <-- nowy plik
```

### Krok 3 – Implementacja klasy
1. Utwórz klasę `OpenRouterService` zgodnie z sekcjami 2-4.
2. Dodaj Zod schematy dla `ChatCompletionOptions` i ustrukturyzowanych odpowiedzi.

Przykład wywołania:
```ts
const service = new OpenRouterService(import.meta.env.OPENROUTER_API_KEY);
const response = await service.chatCompletion({
  model: "openai/gpt-4o-mini",
  system: OpenRouterService.DEFAULT_SYSTEM_PROMPT,
  user: "Wygeneruj zestaw fiszek…",
  responseFormat: {
    type: "json_schema",
    json_schema: {
      name: "FlashcardSet",
      strict: true,
      schema: {
        type: "object",
        properties: {
          flashcards: {
            type: "array",
            items: {
              type: "object",
              properties: {
                front: { type: "string" },
                back: { type: "string" }
              },
              required: ["front", "back"],
              additionalProperties: false
            }
          }
        },
        required: ["flashcards"],
        additionalProperties: false
      }
    }
  },
  parameters: { temperature: 0.7, max_tokens: 1024 }
});
```

### Krok 4 – Obsługa błędów
* Dodaj plik `src/lib/errors/openRouterErrors.ts` z klasami wymienionymi w sekcji 5.
