import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestEnv } from '../../helpers/testSetup';
import { executeMigration } from '../../../lib/db/migrations/executeMigration';

describe('Database Schema Acceptance Tests', () => {
  const { getClient, getUrl, getKey } = setupTestEnv();
  const supabase = getClient();

  beforeAll(async () => {
    // Execute initialization migration first
    await executeMigration('000_init_migrations.sql', getUrl(), getKey());
    
    // Execute initial schema migration
    await executeMigration('001_initial_schema.sql', getUrl(), getKey());
  });

  afterAll(async () => {
    // Execute rollback migration
    await executeMigration('001_initial_schema_rollback.sql', getUrl(), getKey());
  });

  describe('Posts Table', () => {
    it('should create a post with required fields', async () => {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          title: 'Test Post',
          content: 'Test Content',
          platform_id: '00000000-0000-0000-0000-000000000000', // Mock UUID
          user_id: '00000000-0000-0000-0000-000000000000', // Mock UUID
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.title).toBe('Test Post');
      expect(data?.content).toBe('Test Content');
      expect(data?.status).toBe('draft'); // Default value
    });

    it('should enforce required fields', async () => {
      const { error } = await supabase
        .from('posts')
        .insert({
          title: 'Test Post',
          // Missing content
          platform_id: '00000000-0000-0000-0000-000000000000',
          user_id: '00000000-0000-0000-0000-000000000000',
        });

      expect(error).toBeDefined();
      expect(error?.message).toContain('content');
    });
  });

  describe('Schedules Table', () => {
    it('should create a schedule for a post', async () => {
      // First create a post
      const { data: post } = await supabase
        .from('posts')
        .insert({
          title: 'Scheduled Post',
          content: 'Content to be scheduled',
          platform_id: '00000000-0000-0000-0000-000000000000',
          user_id: '00000000-0000-0000-0000-000000000000',
        })
        .select()
        .single();

      // Then create a schedule
      const { data, error } = await supabase
        .from('schedules')
        .insert({
          post_id: post!.id,
          scheduled_time: new Date().toISOString(),
          timezone: 'UTC',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.status).toBe('pending'); // Default value
      expect(data?.retry_count).toBe(0); // Default value
    });
  });

  describe('Platform Configs Table', () => {
    it('should create a platform configuration', async () => {
      const { data, error } = await supabase
        .from('platform_configs')
        .insert({
          platform_name: 'test_platform',
          user_id: '00000000-0000-0000-0000-000000000000',
          settings: { test_setting: true },
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.platform_name).toBe('test_platform');
      expect(data?.settings).toEqual({ test_setting: true });
    });

    it('should enforce unique user-platform combinations', async () => {
      // Create first config
      await supabase
        .from('platform_configs')
        .insert({
          platform_name: 'unique_platform',
          user_id: '00000000-0000-0000-0000-000000000000',
        });

      // Try to create duplicate
      const { error } = await supabase
        .from('platform_configs')
        .insert({
          platform_name: 'unique_platform',
          user_id: '00000000-0000-0000-0000-000000000000',
        });

      expect(error).toBeDefined();
      expect(error?.message).toContain('unique');
    });
  });

  describe('Analytics Table', () => {
    it('should create analytics records', async () => {
      const { data, error } = await supabase
        .from('analytics')
        .insert({
          post_id: '00000000-0000-0000-0000-000000000000',
          platform_id: '00000000-0000-0000-0000-000000000000',
          metric_type: 'views',
          value: 100,
          metadata: { source: 'test' },
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.metric_type).toBe('views');
      expect(data?.value).toBe(100);
      expect(data?.metadata).toEqual({ source: 'test' });
    });
  });

  describe('Row Level Security', () => {
    it('should enforce RLS policies', async () => {
      // This test will fail as expected because we're using the anon key
      // which doesn't have the necessary permissions
      const { error } = await supabase
        .from('posts')
        .insert({
          title: 'Unauthorized Post',
          content: 'This should fail',
          platform_id: '00000000-0000-0000-0000-000000000000',
          user_id: '00000000-0000-0000-0000-000000000001', // Different user_id
        });

      expect(error).toBeDefined();
      expect(error?.message).toContain('policy');
    });
  });
}); 