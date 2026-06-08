import { createClient } from "@supabase/supabase-js";

import type { AppConfig } from "./config";

export function createDatabaseClient(config: AppConfig) {
  return createClient(
    config.supabase.url,
    config.supabase.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export type DatabaseClient = ReturnType<typeof createDatabaseClient>;
