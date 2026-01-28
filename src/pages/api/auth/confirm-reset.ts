import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, locals, redirect }) => {
  try {
    const url = new URL(request.url);

    // Supabase can send tokens in different formats:
    // 1. ?token_hash=XXX&type=recovery (new PKCE format)
    // 2. ?code=XXX&type=recovery (alternative format)
    // 3. ?access_token=XXX&refresh_token=YYY (legacy format)
    const tokenHash = url.searchParams.get("token_hash");
    const code = url.searchParams.get("code");
    const accessToken = url.searchParams.get("access_token");
    const refreshToken = url.searchParams.get("refresh_token");
    const type = url.searchParams.get("type");

    // Log for debugging
    console.log("Reset link params:", {
      hasTokenHash: !!tokenHash,
      hasCode: !!code,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      type,
    });

    // Select token to use (priority: token_hash > code > access_token)
    const token = tokenHash || code || accessToken;

    // Validate parameters
    if (!token) {
      return redirect("/forgot-password?error=invalid_link");
    }

    // Accept recovery flow or missing type parameter (Supabase may not send it)
    // Reject only if type is set and is NOT "recovery" or "magiclink"
    if (type && type !== "recovery" && type !== "magiclink") {
      return redirect("/forgot-password?error=invalid_type");
    }

    // Create Supabase client
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
      runtime: locals.runtime,
    });

    // Exchange code for session - automatically sets cookies
    // If we have access_token + refresh_token, use setSession instead of exchangeCodeForSession
    let error;

    if (accessToken && refreshToken) {
      // Legacy format - set session directly
      const result = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      error = result.error;
    } else {
      // New PKCE format - exchange code for session
      const result = await supabase.auth.exchangeCodeForSession(token);
      error = result.error;
    }

    if (error) {
      console.error("Error exchanging code for session:", error);
      return redirect("/forgot-password?error=expired_link");
    }

    // Session established! Redirect to reset form
    return redirect("/reset-password");
  } catch (err) {
    console.error("Confirm reset error:", err);
    return redirect("/forgot-password?error=server_error");
  }
};
