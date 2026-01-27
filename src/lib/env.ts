/**
 * Type for Cloudflare environment bindings
 */
export interface Env {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  OPENROUTER_API_KEY: string;
}

/**
 * Type for Cloudflare runtime with env bindings
 */
export interface CloudflareRuntime {
  env?: Env;
}

/**
 * Get environment variable that works in both local dev and Cloudflare Pages
 *
 * @param key - Environment variable key
 * @param runtime - Optional Cloudflare runtime (available in Astro.locals.runtime)
 * @returns Environment variable value
 */
export function getEnv(key: string, runtime?: CloudflareRuntime): string {
  // Try runtime.env first (Cloudflare Pages)
  if (runtime?.env && key in runtime.env) {
    return runtime.env[key as keyof Env];
  }

  // Fallback to import.meta.env (local dev, tests, build time)
  return import.meta.env[key] as string;
}
