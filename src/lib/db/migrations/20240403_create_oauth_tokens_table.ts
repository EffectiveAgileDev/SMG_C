import { SupabaseClient } from '@supabase/supabase-js';

export async function createOAuthTokensTable(supabase: SupabaseClient) {
  // Create the oauth_tokens table
  const { error: tableError } = await supabase.rpc('create_oauth_tokens_table', {
    sql: `
      CREATE TABLE IF NOT EXISTS oauth_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        platform TEXT NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT true,
        UNIQUE(user_id, platform)
      );

      -- Create trigger for updating updated_at
      CREATE OR REPLACE FUNCTION update_oauth_tokens_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER update_oauth_tokens_updated_at
        BEFORE UPDATE ON oauth_tokens
        FOR EACH ROW
        EXECUTE FUNCTION update_oauth_tokens_updated_at();

      -- Enable Row Level Security
      ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can view their own tokens" ON oauth_tokens;
      DROP POLICY IF EXISTS "Users can insert their own tokens" ON oauth_tokens;
      DROP POLICY IF EXISTS "Users can update their own tokens" ON oauth_tokens;
      DROP POLICY IF EXISTS "Users can delete their own tokens" ON oauth_tokens;

      -- Create policies
      CREATE POLICY "Users can view their own tokens"
        ON oauth_tokens
        FOR SELECT
        USING (auth.uid() = user_id);

      CREATE POLICY "Users can insert their own tokens"
        ON oauth_tokens
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can update their own tokens"
        ON oauth_tokens
        FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can delete their own tokens"
        ON oauth_tokens
        FOR DELETE
        USING (auth.uid() = user_id);

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_platform ON oauth_tokens(user_id, platform);
      CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires_at ON oauth_tokens(expires_at);

      -- Add check constraint for encrypted tokens
      ALTER TABLE oauth_tokens ADD CONSTRAINT oauth_tokens_tokens_encrypted_check
        CHECK (
          access_token LIKE 'enc:v1:%' AND
          (refresh_token IS NULL OR refresh_token LIKE 'enc:v1:%')
        );
    `
  });

  if (tableError) {
    throw new Error(`Error creating oauth_tokens table: ${tableError.message}`);
  }

  // Create function to test table creation (used in tests)
  const { error: functionError } = await supabase.rpc('create_test_oauth_tokens_table_function', {
    sql: `
      CREATE OR REPLACE FUNCTION test_create_oauth_tokens_table()
      RETURNS void AS $$
      BEGIN
        -- Test table existence
        IF NOT EXISTS (
          SELECT FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'oauth_tokens'
        ) THEN
          RAISE EXCEPTION 'Table oauth_tokens does not exist';
        END IF;

        -- Test RLS is enabled
        IF NOT EXISTS (
          SELECT FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'oauth_tokens'
          AND rowsecurity = true
        ) THEN
          RAISE EXCEPTION 'Row Level Security is not enabled on oauth_tokens table';
        END IF;

        -- Test policies exist
        IF NOT EXISTS (
          SELECT FROM pg_policies
          WHERE schemaname = 'public'
          AND tablename = 'oauth_tokens'
          AND policyname = 'Users can view their own tokens'
        ) THEN
          RAISE EXCEPTION 'Select policy is not properly configured';
        END IF;

        -- Test columns
        IF NOT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = 'oauth_tokens'
          AND column_name = 'id'
          AND data_type = 'uuid'
        ) THEN
          RAISE EXCEPTION 'Column id not found or wrong type';
        END IF;
      END;
      $$ LANGUAGE plpgsql;
    `
  });

  if (functionError) {
    throw new Error(`Error creating test function: ${functionError.message}`);
  }
} 