import type { APIRoute } from "astro";
import type { StartPracticeCommand, StartPracticeResponseDto, PracticeFlashcardDto } from "@/types";
import { StartPracticeSchema } from "@/lib/validation/flashcardSchemas";
import { z } from "zod";

export const prerender = false;

/**
 * POST /api/flashcards/practice
 *
 * Fetches random flashcards for practice mode (free learning)
 * Does not filter by next_review_at - all flashcards are available
 *
 * @returns Random flashcards for practice
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase;

  // Step 1: Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({
        error: {
          message: "Unauthorized",
        },
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Step 2: Parse and validate request body
  let command: StartPracticeCommand;
  try {
    const body = await request.json();
    command = StartPracticeSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Validation failed",
            fields: error.flatten().fieldErrors,
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        error: {
          message: "Invalid request body",
        },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Step 3: Fetch random flashcards from database
  try {
    // Get total count first
    const { count, error: countError } = await supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) {
      // eslint-disable-next-line no-console
      console.error("Failed to count flashcards:", countError);
      return new Response(
        JSON.stringify({
          error: {
            message: "Failed to fetch flashcards",
          },
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const totalFlashcards = count ?? 0;

    // If no flashcards, return empty array
    if (totalFlashcards === 0) {
      const response: StartPracticeResponseDto = {
        flashcards: [],
        total: 0,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch all flashcards and randomize in JavaScript
    // Supabase JS client doesn't support random() in order()
    const { data: flashcards, error: fetchError } = await supabase
      .from("flashcards")
      .select("id, front, back")
      .eq("user_id", user.id);

    if (fetchError) {
      // eslint-disable-next-line no-console
      console.error("Failed to fetch flashcards:", fetchError);
      return new Response(
        JSON.stringify({
          error: {
            message: "Failed to fetch flashcards",
          },
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 4: Shuffle array using Fisher-Yates algorithm
    const shuffled = [...(flashcards ?? [])];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Take only requested amount
    const effectiveLimit = Math.min(command.limit, totalFlashcards);
    const selectedFlashcards = shuffled.slice(0, effectiveLimit);

    // Map to DTOs
    const flashcardDtos: PracticeFlashcardDto[] = selectedFlashcards.map((fc) => ({
      id: fc.id,
      front: fc.front,
      back: fc.back,
    }));

    const response: StartPracticeResponseDto = {
      flashcards: flashcardDtos,
      total: totalFlashcards,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error in practice endpoint:", error);
    return new Response(
      JSON.stringify({
        error: {
          message: "Internal server error",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
