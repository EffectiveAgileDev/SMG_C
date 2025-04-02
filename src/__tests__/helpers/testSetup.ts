import { beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../lib/db/types/schema';

export function setupTestEnv() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  let supabase: ReturnType<typeof createClient<Database>>;

  beforeAll(() => {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables for tests');
    }
    supabase = createClient<Database>(supabaseUrl, supabaseKey);
  });

  afterAll(async () => {
    // Cleanup any test data if needed
  });

  return {
    getClient: () => supabase,
    getUrl: () => supabaseUrl,
    getKey: () => supabaseKey,
  };
} 