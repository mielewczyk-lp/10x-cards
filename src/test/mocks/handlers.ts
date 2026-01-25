import { http, HttpResponse } from "msw";

// Define mock handlers for API endpoints
export const handlers = [
  // Example: Mock flashcards endpoint
  http.get("/api/flashcards", () => {
    return HttpResponse.json({
      flashcards: [],
      total: 0,
    });
  }),

  // Example: Mock OpenRouter API
  http.post("https://openrouter.ai/api/v1/chat/completions", () => {
    return HttpResponse.json({
      id: "mock-id",
      choices: [
        {
          message: {
            role: "assistant",
            content: "Mock AI response",
          },
        },
      ],
    });
  }),
];
