import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/db/database.types";

async function globalTeardown() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const e2eUserId = process.env.E2E_USERNAME_ID;
  const e2eUsername = process.env.E2E_USERNAME;
  const e2ePassword = process.env.E2E_PASSWORD;

  if (!supabaseUrl || !supabaseKey) {
    console.warn("SUPABASE_URL and SUPABASE_KEY must be set - skipping database cleanup");
    return;
  }

  if (!e2eUserId || !e2eUsername || !e2ePassword) {
    console.warn("E2E credentials must be set - skipping database cleanup");
    return;
  }

  // Create Supabase client for E2E teardown
  const supabase = createClient<Database>(supabaseUrl, supabaseKey);

  try {
    // Sign in as the E2E test user to bypass RLS
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: e2eUsername,
      password: e2ePassword,
    });

    if (authError) {
      console.error("Error authenticating as E2E user:", authError);
      throw authError;
    }

    // First, check how many flashcards exist for this user
    const { error: countError } = await supabase
      .from("flashcards")
      .select("id", { count: "exact", head: false })
      .eq("user_id", e2eUserId);

    if (countError) {
      console.error("Error counting flashcards:", countError);
    }

    // Delete all flashcards created by the E2E test user
    const { error, count } = await supabase.from("flashcards").delete({ count: "exact" }).eq("user_id", e2eUserId);

    if (error) {
      console.error("Error deleting flashcards:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      throw error;
    }

    console.log(`Successfully deleted ${count ?? 0} flashcards from database`);

    // Sign out after cleanup
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Failed to cleanup database:", error);
    throw error;
  }
}

export default globalTeardown;
