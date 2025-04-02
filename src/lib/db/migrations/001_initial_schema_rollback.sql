-- Drop policies
DROP POLICY IF EXISTS "Users can only see their own posts" ON posts;
DROP POLICY IF EXISTS "Users can only see their own schedules" ON schedules;
DROP POLICY IF EXISTS "Users can only see their own platform configs" ON platform_configs;
DROP POLICY IF EXISTS "Users can only see analytics for their own posts" ON analytics;

-- Disable RLS
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE platform_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics DISABLE ROW LEVEL SECURITY;

-- Drop triggers
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
DROP TRIGGER IF EXISTS update_schedules_updated_at ON schedules;
DROP TRIGGER IF EXISTS update_platform_configs_updated_at ON platform_configs;

-- Drop trigger function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables
DROP TABLE IF EXISTS analytics;
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS platform_configs;

-- Drop extension
DROP EXTENSION IF EXISTS "uuid-ossp"; 