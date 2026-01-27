import type { APIContext } from "astro";

/**
 * Get environment variable from Cloudflare runtime or import.meta.env fallback
 * Works in both Cloudflare Pages (production) and local development
 */
export function getEnv(
  locals: APIContext["locals"],
  key: "SUPABASE_URL" | "SUPABASE_KEY" | "OPENROUTER_API_KEY"
): string {
  return locals.runtime?.env?.[key] || import.meta.env[key];
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
