/// <reference types="astro/client" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types";
import type { Runtime } from "@astrojs/cloudflare";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      runtime: Runtime<{
        SUPABASE_URL: string;
        SUPABASE_KEY: string;
        OPENROUTER_API_KEY: string;
      }>;
      user?: {
        id: string;
        email: string;
      };
    }
  }
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
