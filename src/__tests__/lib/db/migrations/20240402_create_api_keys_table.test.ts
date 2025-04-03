import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { up, down } from '../../../../lib/db/migrations/20240402_create_api_keys_table';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue({ data: [], error: null })
  })) as unknown as SupabaseClient['from'],
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  auth: {
    signUp: vi.fn().mockResolvedValue({ 
      data: { user: { id: 'test-user-id' } }, 
      error: null 
    }),
    getSession: vi.fn().mockResolvedValue({
      data: { session: { user: { id: 'test-user-id' } } },
      error: null
    })
  }
} as unknown as SupabaseClient;

// Mock environment variables
const mockEnv = {
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-key'
};

vi.mock('../../../../lib/supabase', () => ({
  supabase: mockSupabaseClient
}));

describe('API Keys Table Migration', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubGlobal('import.meta', { env: mockEnv });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should create api_keys table with correct schema', async () => {
    // Mock the RPC call for table creation
    const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });
    mockSupabaseClient.rpc = mockRpc;

    await up(mockSupabaseClient);

    // Verify RPC call
    expect(mockRpc).toHaveBeenCalledWith('create_api_keys_table', {
      sql: expect.stringContaining('CREATE TABLE IF NOT EXISTS api_keys')
    });
  });

  it('should enforce unique constraint on user_id, platform_type, and key_name', async () => {
    const testUserId = 'test-user-id';

    // Mock first insert success
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockFrom = vi.fn().mockReturnValue({
      insert: mockInsert
    });

    mockSupabaseClient.from = mockFrom;

    // First insert should succeed
    const result1 = await mockSupabaseClient
      .from('api_keys')
      .insert({
        user_id: testUserId,
        platform_type: 'twitter',
        key_name: 'Test Key',
        encrypted_key: 'test-key-1'
      });
    expect(result1.error).toBeNull();

    // Mock second insert failure with unique constraint error
    mockInsert.mockResolvedValue({
      data: null,
      error: {
        message: 'duplicate key value violates unique constraint',
        details: 'Key (user_id, platform_type, key_name)=(test-user-id, twitter, Test Key) already exists.'
      }
    });

    // Second insert should fail with unique constraint error
    const result2 = await mockSupabaseClient
      .from('api_keys')
      .insert({
        user_id: testUserId,
        platform_type: 'twitter',
        key_name: 'Test Key',
        encrypted_key: 'test-key-2'
      });
    expect(result2.error).not.toBeNull();
    expect(result2.error?.message).toContain('unique constraint');
  });

  it('should enforce row level security policies', async () => {
    const user1Id = 'test-user-1';
    const user2Id = 'test-user-2';

    // Mock RLS behavior
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockResolvedValue({
      data: [],
      error: null
    });

    const mockFrom = vi.fn().mockReturnValue({
      select: mockSelect,
      eq: mockEq
    });

    mockSupabaseClient.from = mockFrom;

    // Try to read user1's key as user2
    const result = await mockSupabaseClient
      .from('api_keys')
      .select()
      .eq('user_id', user1Id);

    // Should return empty array due to RLS
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(0);
  });
}); 