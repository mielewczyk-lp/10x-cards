import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { ForgotPasswordSchema } from "../../../lib/validation/authSchemas";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = ForgotPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "VALIDATION_ERROR",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email } = validationResult.data;

    // Create Supabase server client
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
      env: {
        SUPABASE_URL: locals.runtime.env.SUPABASE_URL,
        SUPABASE_KEY: locals.runtime.env.SUPABASE_KEY,
      },
    });

    // Get the origin from the request
    const origin = new URL(request.url).origin;

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });

    if (error) {
      // Map Supabase errors to user-friendly messages
      let errorCode = "RESET_EMAIL_FAILED";

      if (error.message.includes("Unable to validate email")) {
        errorCode = "EMAIL_INVALID";
      } else if (error.message.includes("Email rate limit exceeded")) {
        errorCode = "TOO_MANY_REQUESTS";
      }

      return new Response(
        JSON.stringify({
          error: errorCode,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Always return success for security reasons
    // (don't reveal if email exists in database)
    return new Response(
      JSON.stringify({
        message: "If an account exists with this email, a password reset link has been sent",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Forgot password error:", err);
    return new Response(
      JSON.stringify({
        error: "INTERNAL_ERROR",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
