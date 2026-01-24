import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock astro:schema to use zod
vi.mock("astro:schema", async () => {
  const zod = await import("zod");
  return {
    z: zod.z,
  };
});

// Mock environment variables
vi.stubGlobal("import.meta", {
  env: {
    PUBLIC_SUPABASE_URL: "http://localhost:54321",
    PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
  },
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
