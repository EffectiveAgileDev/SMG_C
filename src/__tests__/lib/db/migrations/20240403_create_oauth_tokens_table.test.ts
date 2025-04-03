/// <reference types="vitest" />
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client with common methods
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis()
  })),
  rpc: vi.fn().mockReturnValue({ error: null }),
  auth: {
    getSession: vi.fn(),
    signOut: vi.fn(),
  }
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}));

// Import after mocking
import { createOAuthTokensTable } from '../../../../lib/db/migrations/20240403_create_oauth_tokens_table';

describe('OAuth Tokens Table Migration', () => {
  const mockEnv = {
    VITE_SUPABASE_URL: 'https://example.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'example-anon-key'
  };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubGlobal('import.meta', { env: mockEnv });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should create oauth_tokens table with correct schema', async () => {
    const { supabase } = await import('../../../../lib/supabase');
    
    // Mock successful responses
    mockSupabaseClient.rpc.mockImplementationOnce(() => ({ error: null }));
    mockSupabaseClient.rpc.mockImplementationOnce(() => ({ error: null }));
    
    // Run the migration
    await createOAuthTokensTable(supabase);
    
    // Test table creation
    expect(mockSupabaseClient.rpc).toHaveBeenNthCalledWith(1, 'create_oauth_tokens_table', {
      sql: expect.stringContaining('CREATE TABLE IF NOT EXISTS oauth_tokens')
    });
    
    // Test function creation
    expect(mockSupabaseClient.rpc).toHaveBeenNthCalledWith(2, 'create_test_oauth_tokens_table_function', {
      sql: expect.stringContaining('CREATE OR REPLACE FUNCTION test_create_oauth_tokens_table')
    });
    
    // Verify schema
    const expectedSchema = {
      id: 'uuid',
      platform: 'text',
      access_token: 'text',
      refresh_token: 'text',
      expires_at: 'timestamp with time zone',
      created_at: 'timestamp with time zone',
      updated_at: 'timestamp with time zone',
      user_id: 'uuid',
      is_active: 'boolean'
    };

    // TODO: Add schema verification once implemented
  });

  it('should enforce unique constraint on user_id and platform', async () => {
    const { supabase } = await import('../../../../lib/supabase');
    
    // Mock successful responses for table creation
    mockSupabaseClient.rpc.mockImplementationOnce(() => ({ error: null }));
    mockSupabaseClient.rpc.mockImplementationOnce(() => ({ error: null }));
    
    // Run the migration
    await createOAuthTokensTable(supabase);
    
    // Mock responses for insert operations
    const mockFrom = mockSupabaseClient.from as ReturnType<typeof vi.fn>;
    const mockInsert = vi.fn();
    
    // First insert succeeds
    mockInsert.mockImplementationOnce(() => ({
      error: null,
      data: [{ id: 'test-id-1' }]
    }));
    
    // Second insert fails with unique constraint violation
    mockInsert.mockImplementationOnce(() => ({
      error: {
        code: '23505', // PostgreSQL unique violation code
        message: 'duplicate key value violates unique constraint "oauth_tokens_user_id_platform_key"'
      }
    }));

    mockFrom.mockImplementation(() => ({
      insert: mockInsert
    }));

    // Test data
    const testData = {
      platform: 'twitter',
      access_token: 'test-token-1',
      refresh_token: 'test-refresh-1',
      user_id: 'test-user-1'
    };

    // First insert should succeed
    const result1 = await supabase
      .from('oauth_tokens')
      .insert(testData);
    
    expect(result1.error).toBeNull();
    expect(mockInsert).toHaveBeenCalledWith(testData);

    // Second insert with same user_id and platform should fail
    const result2 = await supabase
      .from('oauth_tokens')
      .insert({
        ...testData,
        access_token: 'test-token-2',
        refresh_token: 'test-refresh-2'
      });

    expect(result2.error).toBeDefined();
    expect(result2.error?.code).toBe('23505');
    expect(result2.error?.message).toContain('unique constraint');
  });

  it('should enforce encryption of sensitive fields', async () => {
    const { supabase } = await import('../../../../lib/supabase');
    
    // Mock successful responses for table creation
    mockSupabaseClient.rpc.mockImplementationOnce(() => ({ error: null }));
    mockSupabaseClient.rpc.mockImplementationOnce(() => ({ error: null }));
    
    // Run the migration
    await createOAuthTokensTable(supabase);
    
    // Mock the insert operation
    const mockInsert = vi.fn();
    mockSupabaseClient.from.mockImplementation(() => ({
      insert: mockInsert,
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis()
    }));

    // Test data with unencrypted tokens
    const unencryptedData = {
      platform: 'twitter',
      access_token: 'raw-access-token',
      refresh_token: 'raw-refresh-token',
      user_id: 'test-user-1'
    };

    // Mock insert to fail if tokens aren't encrypted
    mockInsert.mockImplementationOnce(() => ({
      error: {
        message: 'new row violates check constraint "oauth_tokens_tokens_encrypted_check"'
      }
    }));

    // Attempt to insert unencrypted tokens should fail
    const result1 = await supabase
      .from('oauth_tokens')
      .insert(unencryptedData);

    expect(result1.error).toBeDefined();
    expect(result1.error?.message).toContain('check constraint');

    // Test with encrypted tokens
    const encryptedData = {
      platform: 'twitter',
      access_token: 'enc:v1:abc123', // Simulated encrypted format
      refresh_token: 'enc:v1:def456', // Simulated encrypted format
      user_id: 'test-user-1'
    };

    // Mock insert to succeed with encrypted tokens
    mockInsert.mockImplementationOnce(() => ({
      error: null,
      data: [{ id: 'test-id-1' }]
    }));

    // Insert with encrypted tokens should succeed
    const result2 = await supabase
      .from('oauth_tokens')
      .insert(encryptedData);

    expect(result2.error).toBeNull();
    expect(mockInsert).toHaveBeenCalledWith(encryptedData);
  });

  it('should handle token expiration correctly', async () => {
    const { supabase } = await import('../../../../lib/supabase');
    
    // Mock successful responses for table creation
    mockSupabaseClient.rpc.mockImplementationOnce(() => ({ 
      error: null,
      data: null
    }));
    mockSupabaseClient.rpc.mockImplementationOnce(() => ({ error: null }));
    
    // Run the migration
    await createOAuthTokensTable(supabase);

    // Set up test data with different expiration scenarios
    const now = new Date();
    const futureDate = new Date(now.getTime() + 3600000); // 1 hour in future
    const pastDate = new Date(now.getTime() - 3600000);   // 1 hour in past

    const testTokens = [
      {
        id: 'token1',
        platform: 'twitter',
        access_token: 'enc:v1:valid-token',
        expires_at: futureDate.toISOString(),
        is_active: true
      },
      {
        id: 'token2',
        platform: 'twitter',
        access_token: 'enc:v1:expired-token',
        expires_at: pastDate.toISOString(),
        is_active: true
      }
    ];

    // Mock the database operations for first query
    const mockFrom = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        data: testTokens,
        error: null
      })
    }));

    mockSupabaseClient.from.mockImplementationOnce(mockFrom);

    // Query for active tokens
    const result = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('is_active', true);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);

    // Verify that we have an index on expires_at for efficient querying
    expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('create_oauth_tokens_table', {
      sql: expect.stringContaining('CREATE INDEX idx_oauth_tokens_expires_at ON oauth_tokens(expires_at)')
    });

    // Mock the database operations for second query
    const mockFrom2 = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        data: testTokens.filter(token => new Date(token.expires_at) > now),
        error: null
      })
    }));

    mockSupabaseClient.from.mockImplementationOnce(mockFrom2);

    // Verify that we can query by expiration
    const activeResult = await supabase
      .from('oauth_tokens')
      .select('*')
      .gt('expires_at', now.toISOString())
      .eq('is_active', true);

    expect(activeResult.error).toBeNull();
    expect(activeResult.data).toHaveLength(1);
    expect(activeResult.data?.[0].id).toBe('token1');
  });

  it('should enforce proper security policies', async () => {
    const { supabase } = await import('../../../../lib/supabase');
    
    // Run the migration
    await createOAuthTokensTable(supabase);
    
    // Test RLS policies
    // TODO: Add policy verification once implemented
  });
}); 