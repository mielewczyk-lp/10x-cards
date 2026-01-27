import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { ResetPasswordSchema } from "../../../lib/validation/authSchemas";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = ResetPasswordSchema.safeParse(body);

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

    const { password } = validationResult.data;

    // Create Supabase server client
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
      env: {
        SUPABASE_URL: locals.runtime.env.SUPABASE_URL,
        SUPABASE_KEY: locals.runtime.env.SUPABASE_KEY,
      },
    });

    // Update password using the session from the reset link
    // The access token should be in the cookies after clicking the reset link
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      // Map Supabase errors to user-friendly messages
      let errorCode = "PASSWORD_RESET_FAILED";

      if (error.message.includes("Auth session missing") || error.message.includes("Invalid token")) {
        errorCode = "INVALID_OR_EXPIRED_TOKEN";
      } else if (error.message.includes("Password should be at least")) {
        errorCode = "WEAK_PASSWORD";
      } else if (error.message.includes("New password should be different")) {
        errorCode = "PASSWORD_SAME_AS_OLD";
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

    return new Response(
      JSON.stringify({
        message: "Password reset successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Reset password error:", err);
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
