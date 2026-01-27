import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { ChangePasswordSchema } from "../../../lib/validation/authSchemas";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    // Check if user is authenticated
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "UNAUTHORIZED",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = ChangePasswordSchema.safeParse(body);

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

    const { currentPassword, newPassword } = validationResult.data;

    // Create Supabase server client
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
      env: {
        SUPABASE_URL: locals.runtime.env.SUPABASE_URL,
        SUPABASE_KEY: locals.runtime.env.SUPABASE_KEY,
      },
    });

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      return new Response(
        JSON.stringify({
          error: "SESSION_EXPIRED",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      return new Response(
        JSON.stringify({
          error: "CURRENT_PASSWORD_INCORRECT",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      // Map Supabase errors to user-friendly messages
      let errorCode = "PASSWORD_UPDATE_FAILED";

      if (updateError.message.includes("New password should be different")) {
        errorCode = "PASSWORD_SAME_AS_OLD";
      } else if (updateError.message.includes("Password should be at least")) {
        errorCode = "WEAK_PASSWORD";
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
        message: "Password updated successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Change password error:", err);
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
