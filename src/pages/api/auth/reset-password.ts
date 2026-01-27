import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { ResetPasswordSchema } from "../../../lib/validation/authSchemas";
import { getSupabaseEnv } from "../../../lib/env";

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
      env: getSupabaseEnv(locals),
    });

    // Check if user has a valid session first
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("Reset password failed: No active session");
      return new Response(
        JSON.stringify({
          error: "INVALID_OR_EXPIRED_TOKEN",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update password using the session from the reset link
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      console.error("Reset password failed:", error.message);
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
