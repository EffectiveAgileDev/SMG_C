import { SupabaseClient } from '@supabase/supabase-js';

export interface ImageLibraryEntry {
  id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  content_hash: string;
  width: number;
  height: number;
  created_at: string;
  updated_at: string;
  thumbnail_path?: string;
  metadata: {
    exif?: Record<string, any>;
    colors?: string[];
    dominant_color?: string;
  };
  tags: string[];
  categories: string[];
  platform_compatibility: string[];
  usage_count: number;
}

export async function createImageLibraryTable(supabase: SupabaseClient): Promise<void> {
  // Create the table
  await supabase.rpc('create_image_library_table', {
    sql: `
      CREATE TABLE IF NOT EXISTS image_library (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        file_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        thumbnail_path TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
        tags TEXT[] NOT NULL DEFAULT '{}',
        categories TEXT[] NOT NULL DEFAULT '{}',
        platform_compatibility TEXT[] NOT NULL DEFAULT '{}',
        usage_count INTEGER NOT NULL DEFAULT 0,
        UNIQUE(user_id, content_hash)
      );

      -- Add updated_at trigger
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON image_library
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `
  });

  // Enable RLS
  await supabase.rpc('enable_rls_on_image_library', {
    sql: `
      ALTER TABLE image_library ENABLE ROW LEVEL SECURITY;

      -- All authenticated users can view images
      CREATE POLICY "Authenticated users can view images"
        ON image_library
        FOR SELECT
        USING (auth.role() = 'authenticated');

      -- All authenticated users can insert images
      CREATE POLICY "Authenticated users can insert images"
        ON image_library
        FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');

      -- All authenticated users can update images
      CREATE POLICY "Authenticated users can update images"
        ON image_library
        FOR UPDATE
        USING (auth.role() = 'authenticated');

      -- All authenticated users can delete images
      CREATE POLICY "Authenticated users can delete images"
        ON image_library
        FOR DELETE
        USING (auth.role() = 'authenticated');
    `
  });

  // Create indexes
  await supabase.rpc('create_image_library_indexes', {
    sql: `
      -- Index for user_id foreign key
      CREATE INDEX idx_image_library_user_id ON image_library(user_id);

      -- Index for content hash lookups (duplicate detection)
      CREATE INDEX idx_image_library_content_hash ON image_library(content_hash);

      -- GIN indexes for array columns
      CREATE INDEX idx_image_library_tags ON image_library USING GIN(tags);
      CREATE INDEX idx_image_library_categories ON image_library USING GIN(categories);
      CREATE INDEX idx_image_library_platform_compatibility ON image_library USING GIN(platform_compatibility);
    `
  });
} 