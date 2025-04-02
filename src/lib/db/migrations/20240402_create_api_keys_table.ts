import { SupabaseClient } from '@supabase/supabase-js';

export async function up(supabase: SupabaseClient) {
  const { error } = await supabase.rpc('create_api_keys_table', {
    sql: `
      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        platform_type TEXT NOT NULL,
        key_name TEXT NOT NULL,
        encrypted_key TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        expires_at TIMESTAMP WITH TIME ZONE,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        UNIQUE(user_id, platform_type, key_name)
      );

      -- Add RLS policies
      ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

      -- Policy for users to read their own API keys
      CREATE POLICY "Users can view their own API keys"
        ON api_keys FOR SELECT
        USING (auth.uid() = user_id);

      -- Policy for users to insert their own API keys
      CREATE POLICY "Users can insert their own API keys"
        ON api_keys FOR INSERT
        WITH CHECK (auth.uid() = user_id);

      -- Policy for users to update their own API keys
      CREATE POLICY "Users can update their own API keys"
        ON api_keys FOR UPDATE
        USING (auth.uid() = user_id);

      -- Create updated_at trigger
      CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER api_keys_updated_at
        BEFORE UPDATE ON api_keys
        FOR EACH ROW
        EXECUTE FUNCTION update_api_keys_updated_at();
    `
  });

  if (error) {
    console.error('Error creating api_keys table:', error);
    throw error;
  }
}

export async function down(supabase: SupabaseClient) {
  const { error } = await supabase.rpc('drop_api_keys_table', {
    sql: `
      DROP TRIGGER IF EXISTS api_keys_updated_at ON api_keys;
      DROP FUNCTION IF EXISTS update_api_keys_updated_at();
      DROP TABLE IF EXISTS api_keys;
    `
  });

  if (error) {
    console.error('Error dropping api_keys table:', error);
    throw error;
  }
} 