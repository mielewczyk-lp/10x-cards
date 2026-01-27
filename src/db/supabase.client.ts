import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { SupabaseClient as SupabaseClientType } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";

import type { Database } from "./database.types";
import { getEnv, type CloudflareRuntime } from "../lib/env";

// Re-export SupabaseClient type for use in other modules
export type SupabaseClient = SupabaseClientType<Database>;

// Cookie options for server-side auth
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

/**
 * Parse Cookie header string into array of cookie objects
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Create Supabase server instance with SSR cookie handling
 * Works in both local dev and Cloudflare Pages runtime
 */
export const createSupabaseServerInstance = (context: {
  headers: Headers;
  cookies: AstroCookies;
  runtime?: CloudflareRuntime;
}) => {
  const supabaseUrl = getEnv("SUPABASE_URL", context.runtime);
  const supabaseKey = getEnv("SUPABASE_KEY", context.runtime);

  // Validate required environment variables
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing required Supabase environment variables");
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};
