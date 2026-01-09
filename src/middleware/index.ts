import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client";

// Public paths - Auth pages and API endpoints
const PUBLIC_PATHS = [
  // Server-Rendered Astro Pages
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/reset-password",
];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create Supabase server instance for this request
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Attach supabase client to locals for use in pages
  locals.supabase = supabase;

  // IMPORTANT: Always get user session first before any other operations
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && user.email) {
    locals.user = {
      email: user.email,
      id: user.id,
    };
  }

  // Public paths can be accessed without auth check
  if (PUBLIC_PATHS.includes(url.pathname)) {
    return next();
  }

  // Protected routes - redirect to login if not authenticated
  if (!user) {
    return redirect("/login");
  }

  return next();
});
