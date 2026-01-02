import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Default user ID for development/testing purposes
 * TODO: Replace with real authentication later
 */
export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";
