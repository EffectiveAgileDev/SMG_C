/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Validate environment variables immediately
function validateConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error('VITE_SUPABASE_URL is not defined');
  }

  if (!key) {
    throw new Error('VITE_SUPABASE_ANON_KEY is not defined');
  }

  return { url, key };
}

// This will throw immediately if config is invalid
const config = validateConfig();

// Create client only if validation passes
const supabase = createClient(config.url, config.key);

export { supabase }; 