import type { APIContext } from "astro";

/**
 * Get environment variable from Cloudflare runtime or import.meta.env fallback
 * Works in both Cloudflare Pages (production) and local development
 */
export function getEnv(
  locals: APIContext["locals"],
  key: "SUPABASE_URL" | "SUPABASE_KEY" | "OPENROUTER_API_KEY"
): string {
  // Try Cloudflare runtime first (production)
  if (locals.runtime?.env?.[key]) {
    return locals.runtime.env[key];
  }

  // Fallback to import.meta.env (local development)
  // Note: We need to use explicit property access for build-time evaluation
  switch (key) {
    case "SUPABASE_URL":
      return import.meta.env.SUPABASE_URL;
    case "SUPABASE_KEY":
      return import.meta.env.SUPABASE_KEY;
    case "OPENROUTER_API_KEY":
      return import.meta.env.OPENROUTER_API_KEY;
    default:
      return "";
  }
}

/**
 * Get Supabase credentials from environment
 * Returns object with SUPABASE_URL and SUPABASE_KEY
 */
export function getSupabaseEnv(locals: APIContext["locals"]) {
  return {
    SUPABASE_URL: getEnv(locals, "SUPABASE_URL"),
    SUPABASE_KEY: getEnv(locals, "SUPABASE_KEY"),
  };
}
