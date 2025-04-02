-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
    platform_id UUID NOT NULL,
    user_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT posts_platform_fk FOREIGN KEY (platform_id) REFERENCES platform_configs(id) ON DELETE CASCADE
);

-- Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    post_id UUID NOT NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    timezone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    retry_count INTEGER DEFAULT 0,
    last_attempt TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    CONSTRAINT schedules_post_fk FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Create platform_configs table
CREATE TABLE IF NOT EXISTS platform_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    platform_name TEXT NOT NULL,
    api_key TEXT,
    api_secret TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    user_id UUID NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT platform_configs_unique_user_platform UNIQUE (user_id, platform_name)
);

-- Create analytics table
CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    post_id UUID NOT NULL,
    platform_id UUID NOT NULL,
    metric_type TEXT NOT NULL,
    value NUMERIC NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT analytics_post_fk FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT analytics_platform_fk FOREIGN KEY (platform_id) REFERENCES platform_configs(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_platform_id ON posts(platform_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_schedules_post_id ON schedules(post_id);
CREATE INDEX idx_schedules_status ON schedules(status);
CREATE INDEX idx_platform_configs_user_id ON platform_configs(user_id);
CREATE INDEX idx_analytics_post_id ON analytics(post_id);
CREATE INDEX idx_analytics_platform_id ON analytics(platform_id);
CREATE INDEX idx_analytics_metric_type ON analytics(metric_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_configs_updated_at
    BEFORE UPDATE ON platform_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can only see their own posts"
    ON posts FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can only see their own schedules"
    ON schedules FOR ALL
    USING (post_id IN (SELECT id FROM posts WHERE user_id = auth.uid()))
    WITH CHECK (post_id IN (SELECT id FROM posts WHERE user_id = auth.uid()));

CREATE POLICY "Users can only see their own platform configs"
    ON platform_configs FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can only see analytics for their own posts"
    ON analytics FOR ALL
    USING (post_id IN (SELECT id FROM posts WHERE user_id = auth.uid()))
    WITH CHECK (post_id IN (SELECT id FROM posts WHERE user_id = auth.uid())); 