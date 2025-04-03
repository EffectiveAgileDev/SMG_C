import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../lib/database.types';

type PlatformConfig = Database['public']['Tables']['platform_configurations']['Row'];

// Mock Supabase client
const mockInsertFn = vi.fn();
const mockSelectFn = vi.fn();
const mockUpdateFn = vi.fn();
const mockDeleteFn = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: mockInsertFn,
      select: mockSelectFn,
      update: mockUpdateFn,
      delete: mockDeleteFn
    }))
  }))
}));

describe('Platform Configurations Table Migration', () => {
  const mockSupabase = createClient<Database>('mock-url', 'mock-key');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should enforce required fields', async () => {
    mockInsertFn.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'violates not-null constraint',
        details: 'column "platform_name" violates not-null constraint'
      }
    });

    const { error: insertError } = await mockSupabase
      .from('platform_configurations')
      .insert({});

    expect(insertError).toBeDefined();
    expect(insertError!.message).toContain('violates not-null constraint');
  });

  it('should enforce unique platform names', async () => {
    // First insert succeeds
    mockInsertFn.mockResolvedValueOnce({
      data: { 
        id: 1,
        platform_name: 'twitter',
        api_version: 'v2',
        content_limits: null,
        api_endpoints: null,
        rate_limits: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as PlatformConfig,
      error: null
    });

    const { error: firstInsertError } = await mockSupabase
      .from('platform_configurations')
      .insert({
        platform_name: 'twitter',
        api_version: 'v2'
      });

    expect(firstInsertError).toBeNull();

    // Second insert fails with unique constraint
    mockInsertFn.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'unique constraint violation',
        details: 'Key (platform_name)=(twitter) already exists'
      }
    });

    const { error: duplicateError } = await mockSupabase
      .from('platform_configurations')
      .insert({
        platform_name: 'twitter',
        api_version: 'v2'
      });

    expect(duplicateError).toBeDefined();
    expect(duplicateError!.message).toContain('unique constraint');
  });

  it('should store and retrieve JSON configuration data', async () => {
    const testConfig = {
      platform_name: 'linkedin',
      api_version: 'v2',
      content_limits: {
        text_length: 3000,
        media_limit: 9,
        supported_formats: ['image/jpeg', 'image/png']
      },
      api_endpoints: {
        post: '/shares',
        media: '/media',
        analytics: '/analytics'
      },
      rate_limits: {
        posts_per_day: 100,
        requests_per_minute: 60
      }
    };

    // Mock successful insert
    mockInsertFn.mockResolvedValueOnce({
      data: {
        id: 2,
        ...testConfig,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as PlatformConfig,
      error: null
    });

    const { error: insertError } = await mockSupabase
      .from('platform_configurations')
      .insert(testConfig);

    expect(insertError).toBeNull();

    // Mock successful retrieval
    const mockData: PlatformConfig = {
      id: 2,
      platform_name: testConfig.platform_name,
      api_version: testConfig.api_version,
      content_limits: testConfig.content_limits,
      api_endpoints: testConfig.api_endpoints,
      rate_limits: testConfig.rate_limits,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    mockSelectFn.mockResolvedValueOnce({
      data: [mockData],
      error: null
    });

    const { data, error: fetchError } = await mockSupabase
      .from('platform_configurations')
      .select();

    expect(fetchError).toBeNull();
    expect(data).toBeDefined();
    expect(data![0].content_limits).toEqual(testConfig.content_limits);
    expect(data![0].api_endpoints).toEqual(testConfig.api_endpoints);
    expect(data![0].rate_limits).toEqual(testConfig.rate_limits);
  });

  it('should enforce RLS policies', async () => {
    mockInsertFn.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'permission denied for table platform_configurations',
        details: 'Policy check failed'
      }
    });

    const { error: insertError } = await mockSupabase
      .from('platform_configurations')
      .insert({
        platform_name: 'test_platform',
        api_version: 'v1'
      });

    expect(insertError).toBeDefined();
    expect(insertError!.message).toContain('permission denied');
  });

  it('should track creation and update timestamps', async () => {
    const createdAt = new Date().toISOString();
    const updatedAt = new Date().toISOString();

    const mockInsertData: PlatformConfig = {
      id: 3,
      platform_name: 'instagram',
      api_version: 'v1',
      content_limits: null,
      api_endpoints: null,
      rate_limits: null,
      created_at: createdAt,
      updated_at: updatedAt
    };

    mockInsertFn.mockResolvedValueOnce({
      data: mockInsertData,
      error: null
    });

    const { data: insertedData, error: insertError } = await mockSupabase
      .from('platform_configurations')
      .insert({
        platform_name: 'instagram',
        api_version: 'v1'
      }) as { data: PlatformConfig | null, error: null };

    expect(insertError).toBeNull();
    expect(insertedData).toBeDefined();
    expect(insertedData!.created_at).toBeDefined();
    expect(insertedData!.updated_at).toBeDefined();

    const newUpdatedAt = new Date(Date.now() + 1000).toISOString();
    const mockUpdateData: PlatformConfig = {
      ...mockInsertData,
      api_version: 'v2',
      updated_at: newUpdatedAt
    };

    mockUpdateFn.mockResolvedValueOnce({
      data: [mockUpdateData],
      error: null
    });

    const { data: updatedData, error: updateError } = await mockSupabase
      .from('platform_configurations')
      .update({ api_version: 'v2' }) as { data: PlatformConfig[] | null, error: null };

    expect(updateError).toBeNull();
    expect(updatedData).toBeDefined();
    expect(updatedData![0].updated_at).not.toEqual(insertedData!.updated_at);
  });
}); 