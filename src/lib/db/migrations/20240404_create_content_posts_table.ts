import { SupabaseClient } from '@supabase/supabase-js';

export interface ContentPost {
  id: string;
  title: string;
  content: string;
  platform: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed' | 'archived';
  scheduled_for?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  media_urls: string[];
  platform_specific_data: Record<string, any>;
  metadata: Record<string, any>;
}

export async function createContentPostsTable(supabase: SupabaseClient) {
  // Create the content_posts table
  const { error: tableError } = await supabase.rpc('create_content_posts_table', {
    sql: `
      -- Create enum for post status
      DO $$ BEGIN
        CREATE TYPE post_status AS ENUM (
          'draft',
          'scheduled',
          'published',
          'failed',
          'archived'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      CREATE TABLE IF NOT EXISTS content_posts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        platform TEXT NOT NULL,
        status post_status NOT NULL DEFAULT 'draft',
        scheduled_for TIMESTAMPTZ,
        published_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        media_urls JSONB DEFAULT '[]'::jsonb,
        platform_specific_data JSONB DEFAULT '{}'::jsonb,
        metadata JSONB DEFAULT '{}'::jsonb
      );

      -- Create trigger for updating updated_at
      CREATE OR REPLACE FUNCTION update_content_posts_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER update_content_posts_updated_at
        BEFORE UPDATE ON content_posts
        FOR EACH ROW
        EXECUTE FUNCTION update_content_posts_updated_at();

      -- Create function to validate status transitions
      CREATE OR REPLACE FUNCTION validate_content_post_status_transition()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Allow any transition from draft
        IF OLD.status = 'draft' THEN
          RETURN NEW;
        END IF;

        -- Scheduled posts can only be published or archived
        IF OLD.status = 'scheduled' AND NEW.status NOT IN ('published', 'archived') THEN
          RAISE EXCEPTION 'Invalid status transition from scheduled to %', NEW.status;
        END IF;

        -- Published posts can only be archived
        IF OLD.status = 'published' AND NEW.status != 'archived' THEN
          RAISE EXCEPTION 'Published posts can only be archived';
        END IF;

        -- Failed posts can be rescheduled or archived
        IF OLD.status = 'failed' AND NEW.status NOT IN ('scheduled', 'archived') THEN
          RAISE EXCEPTION 'Failed posts can only be rescheduled or archived';
        END IF;

        -- Archived posts cannot change status
        IF OLD.status = 'archived' THEN
          RAISE EXCEPTION 'Archived posts cannot change status';
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER validate_content_post_status_transition
        BEFORE UPDATE ON content_posts
        FOR EACH ROW
        EXECUTE FUNCTION validate_content_post_status_transition();

      -- Create status transition constraint
      ALTER TABLE content_posts
        ADD CONSTRAINT content_posts_status_transition_check
        CHECK (
          (status = 'scheduled' AND scheduled_for IS NOT NULL) OR
          (status = 'published' AND published_at IS NOT NULL) OR
          (status NOT IN ('scheduled', 'published'))
        );

      -- Enable Row Level Security
      ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;

      -- Create policies for company-wide access
      CREATE POLICY "Authenticated users can view posts"
        ON content_posts FOR SELECT
        USING (auth.role() = 'authenticated');

      CREATE POLICY "Authenticated users can create posts"
        ON content_posts FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');

      CREATE POLICY "Authenticated users can update posts"
        ON content_posts FOR UPDATE
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');

      CREATE POLICY "Authenticated users can delete posts"
        ON content_posts FOR DELETE
        USING (auth.role() = 'authenticated');

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_content_posts_user_platform ON content_posts(user_id, platform);
      CREATE INDEX IF NOT EXISTS idx_content_posts_status ON content_posts(status);
      CREATE INDEX IF NOT EXISTS idx_content_posts_scheduled_for ON content_posts(scheduled_for);
      CREATE INDEX IF NOT EXISTS idx_content_posts_published_at ON content_posts(published_at);
    `
  });

  if (tableError) {
    throw new Error(`Error creating content_posts table: ${tableError.message}`);
  }

  // Create function to test table creation (used in tests)
  const { error: functionError } = await supabase.rpc('create_test_content_posts_table_function', {
    sql: `
      CREATE OR REPLACE FUNCTION test_create_content_posts_table()
      RETURNS void AS $$
      BEGIN
        -- Test table existence
        IF NOT EXISTS (
          SELECT FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'content_posts'
        ) THEN
          RAISE EXCEPTION 'Table content_posts does not exist';
        END IF;

        -- Test RLS is enabled
        IF NOT EXISTS (
          SELECT FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'content_posts'
          AND rowsecurity = true
        ) THEN
          RAISE EXCEPTION 'Row Level Security is not enabled on content_posts table';
        END IF;

        -- Test policies exist
        IF NOT EXISTS (
          SELECT FROM pg_policies
          WHERE schemaname = 'public'
          AND tablename = 'content_posts'
          AND policyname = 'Authenticated users can view posts'
        ) THEN
          RAISE EXCEPTION 'Select policy is not properly configured';
        END IF;

        -- Test enum type exists
        IF NOT EXISTS (
          SELECT FROM pg_type
          WHERE typname = 'post_status'
        ) THEN
          RAISE EXCEPTION 'post_status enum type does not exist';
        END IF;

        -- Test columns
        IF NOT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = 'content_posts'
          AND column_name = 'id'
          AND data_type = 'uuid'
        ) THEN
          RAISE EXCEPTION 'Column id not found or wrong type';
        END IF;

        -- Test status transition trigger exists
        IF NOT EXISTS (
          SELECT FROM pg_trigger
          WHERE tgname = 'validate_content_post_status_transition'
        ) THEN
          RAISE EXCEPTION 'Status transition trigger not found';
        END IF;
      END;
      $$ LANGUAGE plpgsql;
    `
  });

  if (functionError) {
    throw new Error(`Error creating test function: ${functionError.message}`);
  }
} 