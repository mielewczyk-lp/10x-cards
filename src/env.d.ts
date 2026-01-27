/// <reference types="astro/client" />
/// <reference types="@astrojs/cloudflare" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types";

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare global {
  namespace App {
    interface Locals extends Runtime {
      supabase: SupabaseClient<Database>;
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

interface Env {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
