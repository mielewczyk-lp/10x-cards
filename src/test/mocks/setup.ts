import { beforeAll, afterEach, afterAll } from "vitest";
import { server } from "./server";

// Start MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: "warn" });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
});

// Close MSW server after all tests
afterAll(() => {
  server.close();
});
