import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client";
import { getSupabaseEnv } from "../lib/env";

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

/**
 * Security headers for all responses
 * CSP (Content Security Policy) protects against XSS, injection attacks, and clickjacking
 */
const SECURITY_HEADERS = {
  // Content Security Policy - restricts resource loading
  "Content-Security-Policy": [
    "default-src 'self'", // Only allow resources from same origin by default
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow inline scripts (needed for React/Astro)
    "style-src 'self' 'unsafe-inline'", // Allow inline styles (needed for Tailwind)
    "img-src 'self' data: https:", // Allow images from same origin, data URIs, and HTTPS
    "font-src 'self' data:", // Allow fonts from same origin and data URIs
    "connect-src 'self' https://*.supabase.co https://openrouter.ai", // Allow API calls to Supabase and OpenRouter
    "frame-ancestors 'none'", // Prevent clickjacking
    "base-uri 'self'", // Restrict base tag to same origin
    "form-action 'self'", // Restrict form submissions to same origin
  ].join("; "),
  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",
  // Enable XSS protection in older browsers
  "X-XSS-Protection": "1; mode=block",
  // Prevent clickjacking
  "X-Frame-Options": "DENY",
  // Referrer policy - don't leak full URL to external sites
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Permissions policy - restrict powerful features
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create Supabase server instance for this request
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
    env: getSupabaseEnv(locals),
  });

  // Attach supabase client to locals for use in pages
  locals.supabase = supabase;

  // Handle PKCE flow: if there's a 'code' in query params, exchange it for a session
  // This is used for password reset and email confirmation flows
  const code = url.searchParams.get("code");
  if (code) {
    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      // Silent fail - invalid codes will result in no session being created
      // The user will see appropriate error messages when they try to perform authenticated actions
      console.error("Failed to exchange code for session:", error);
    }
  }

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

  // Helper function to add security headers to any response
  const addSecurityHeaders = (response: Response): Response => {
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  };

  // If user is logged in and tries to access auth-only pages, redirect to /create
  if (user && AUTH_ONLY_PATHS.includes(url.pathname)) {
    return addSecurityHeaders(redirect("/create"));
  }

  // Public paths can be accessed without auth check
  if (PUBLIC_PATHS.includes(url.pathname)) {
    const response = await next();
    return addSecurityHeaders(response);
  }

  // Protected routes - redirect to login if not authenticated
  if (!user) {
    return addSecurityHeaders(redirect("/login"));
  }

  // Get response from next middleware/page
  const response = await next();

  // Add security headers to all responses
  return addSecurityHeaders(response);
});
