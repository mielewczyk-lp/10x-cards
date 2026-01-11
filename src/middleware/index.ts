import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client";

// Public paths - Auth pages and API endpoints that don't require authentication
const PUBLIC_PATHS = [
  // Auth pages
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

// Paths that should redirect to /create if user is already logged in
const AUTH_ONLY_PATHS = ["/login", "/register", "/forgot-password"];

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

  // If user is logged in and tries to access auth-only pages, redirect to /create
  if (user && AUTH_ONLY_PATHS.includes(url.pathname)) {
    return redirect("/create");
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
