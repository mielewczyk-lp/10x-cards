import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, locals, redirect }) => {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const type = url.searchParams.get("type");

    // Log dla debugowania
    console.log("Reset link params:", { code: code ? "present" : "missing", type });

    // Walidacja parametrów
    if (!code) {
      return redirect("/forgot-password?error=invalid_link");
    }

    // Akceptuj recovery flow lub brak parametru type (Supabase może nie wysyłać)
    // Odrzuć tylko jeśli type jest ustawiony i NIE jest "recovery"
    if (type && type !== "recovery") {
      return redirect("/forgot-password?error=invalid_type");
    }

    // Utwórz klienta Supabase
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
      runtime: locals.runtime,
    });

    // Wymień kod na sesję - automatycznie ustawi cookies
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);
      return redirect("/forgot-password?error=expired_link");
    }

    // Sesja ustawiona! Przekieruj do formularza
    return redirect("/reset-password");
  } catch (err) {
    console.error("Confirm reset error:", err);
    return redirect("/forgot-password?error=server_error");
  }
};
