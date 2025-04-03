-- Create platform_configurations table
CREATE TABLE platform_configurations (
    id BIGSERIAL PRIMARY KEY,
    platform_name TEXT NOT NULL,
    api_version TEXT NOT NULL,
    content_limits JSONB,
    api_endpoints JSONB,
    rate_limits JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(platform_name)
);

-- Add RLS policies
ALTER TABLE platform_configurations ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view platform configurations
CREATE POLICY "Platform configurations are viewable by authenticated users only"
ON platform_configurations FOR SELECT
TO authenticated
USING (true);

-- Only authenticated users with admin role can insert/update/delete
CREATE POLICY "Platform configurations are manageable by admins only"
ON platform_configurations FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON platform_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 