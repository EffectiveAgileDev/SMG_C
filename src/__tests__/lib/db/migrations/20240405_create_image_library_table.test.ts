import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import { createImageLibraryTable, ImageLibraryEntry } from '../../../../lib/db/migrations/20240405_create_image_library_table';

// Helper function to normalize SQL for comparison
const normalizeSQL = (sql: string) => sql.replace(/\s+/g, ' ').trim();

// Helper function to extract SQL from RPC call
const getCallSQL = (calls: any, procedureName: string) => {
  const call = calls.find(([name]: [string, any]) => name === procedureName);
  return call ? normalizeSQL(call[1].sql) : '';
};

type MockAuth = {
  getSession: ReturnType<typeof vi.fn>;
};

interface MockSupabaseClient extends Omit<Partial<SupabaseClient>, 'auth'> {
  rpc: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn> & {
    mockImplementationOnce: (fn: () => any) => any;
  };
  auth: MockAuth;
}

describe('Image Library Table Migration', () => {
  let mockSupabaseClient: MockSupabaseClient;
  let supabase: SupabaseClient;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    const mockGetSession = vi.fn();
    
    mockSupabaseClient = {
      rpc: vi.fn().mockImplementation((procedure: string, params: { sql: string }) => {
        return Promise.resolve({ 
          data: { success: true, sql: params.sql },
          error: null 
        });
      }),
      from: vi.fn().mockImplementation(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue({ data: null, error: null })
      })),
      auth: {
        getSession: mockGetSession
      }
    } as MockSupabaseClient;

    vi.mock('../../../../lib/supabase', () => ({
      supabase: mockSupabaseClient
    }));

    supabase = mockSupabaseClient as unknown as SupabaseClient;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create image_library table with correct schema', async () => {
    await createImageLibraryTable(supabase);
    const createTableSql = getCallSQL(mockSupabaseClient.rpc.mock.calls, 'create_image_library_table');

    const requiredColumns = [
      'id UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
      'user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE',
      'file_path TEXT NOT NULL',
      'file_name TEXT NOT NULL',
      'file_size BIGINT NOT NULL',
      'mime_type TEXT NOT NULL',
      'content_hash TEXT NOT NULL',
      'width INTEGER NOT NULL',
      'height INTEGER NOT NULL',
      'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
      'updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
      'thumbnail_path TEXT',
      'metadata JSONB NOT NULL DEFAULT \'{}\'::\JSONB',
      'tags TEXT[] NOT NULL DEFAULT \'{}\'',
      'categories TEXT[] NOT NULL DEFAULT \'{}\'',
      'platform_compatibility TEXT[] NOT NULL DEFAULT \'{}\'',
      'usage_count INTEGER NOT NULL DEFAULT 0',
      'UNIQUE(user_id, content_hash)'
    ];

    requiredColumns.forEach(column => {
      expect(createTableSql).toContain(normalizeSQL(column));
    });

    expect(createTableSql).toContain(normalizeSQL('CREATE TRIGGER set_updated_at'));
    expect(createTableSql).toContain(normalizeSQL('BEFORE UPDATE ON image_library'));
    expect(createTableSql).toContain(normalizeSQL('EXECUTE FUNCTION update_updated_at_column()'));
  });

  it('should enforce unique content hash per user', async () => {
    await createImageLibraryTable(supabase);

    const testImage: ImageLibraryEntry = {
      id: 'test-id',
      user_id: 'test-user',
      file_path: '/path/to/image.jpg',
      file_name: 'image.jpg',
      file_size: 1024,
      mime_type: 'image/jpeg',
      content_hash: 'abc123',
      width: 800,
      height: 600,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {},
      tags: [],
      categories: [],
      platform_compatibility: ['twitter', 'linkedin'],
      usage_count: 0
    };

    // Mock first insert success
    mockSupabaseClient.from.mockImplementationOnce(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ 
        data: [testImage], 
        error: null 
      })
    }));

    const result1 = await supabase
      .from('image_library')
      .insert(testImage)
      .select();

    expect(result1.error).toBeNull();
    expect(result1.data).toEqual([testImage]);

    // Mock second insert failure (duplicate)
    mockSupabaseClient.from.mockImplementationOnce(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ 
        data: null, 
        error: { 
          message: 'duplicate key value violates unique constraint "image_library_user_id_content_hash_key"'
        }
      })
    }));

    const result2 = await supabase
      .from('image_library')
      .insert({ ...testImage, id: 'different-id' })
      .select();

    expect(result2.error).toBeDefined();
    expect(result2.error?.message).toContain('duplicate key value');
  });

  it('should enforce RLS policies', async () => {
    await createImageLibraryTable(supabase);

    const testImage: ImageLibraryEntry = {
      id: 'test-id',
      user_id: 'test-user',
      file_path: '/path/to/image.jpg',
      file_name: 'image.jpg',
      file_size: 1024,
      mime_type: 'image/jpeg',
      content_hash: 'abc123',
      width: 800,
      height: 600,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {},
      tags: [],
      categories: [],
      platform_compatibility: ['twitter', 'linkedin'],
      usage_count: 0
    };

    // Mock authenticated user session
    mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
      data: { 
        session: { 
          user: { id: 'any-user-id' },
          access_token: 'test-token',
          role: 'authenticated'
        }
      },
      error: null
    });

    // Mock select operation for authenticated user (should succeed)
    const mockSelectChain1 = {
      data: [testImage],
      error: null,
      count: null,
      status: 200,
      statusText: 'OK'
    };

    mockSupabaseClient.from.mockImplementationOnce(() => ({
      select: vi.fn().mockReturnValue(mockSelectChain1)
    }));

    const result1 = await supabase.from('image_library').select('*');
    expect(result1.error).toBeNull();
    expect(result1.data).toHaveLength(1);

    // Mock unauthenticated session
    mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
      data: { session: null },
      error: null
    });

    // Mock select operation for unauthenticated user (should fail)
    const mockSelectChain2 = {
      data: null,
      error: { message: 'Policy check failed' },
      count: null,
      status: 403,
      statusText: 'Forbidden'
    };

    mockSupabaseClient.from.mockImplementationOnce(() => ({
      select: vi.fn().mockReturnValue(mockSelectChain2)
    }));

    const result2 = await supabase.from('image_library').select('*');
    expect(result2.error).toBeDefined();
    expect(result2.error?.message).toContain('Policy check failed');

    // Verify RLS is enabled and policies are created
    const rlsSql = getCallSQL(mockSupabaseClient.rpc.mock.calls, 'enable_rls_on_image_library');
    expect(rlsSql).toContain('ALTER TABLE image_library ENABLE ROW LEVEL SECURITY');

    // Define the expected policies
    const expectedPolicies = [
      {
        name: 'Authenticated users can view images',
        action: 'SELECT',
        condition: 'auth.role() = \'authenticated\'',
        type: 'USING'
      },
      {
        name: 'Authenticated users can insert images',
        action: 'INSERT',
        condition: 'auth.role() = \'authenticated\'',
        type: 'WITH CHECK'
      },
      {
        name: 'Authenticated users can update images',
        action: 'UPDATE',
        condition: 'auth.role() = \'authenticated\'',
        type: 'USING'
      },
      {
        name: 'Authenticated users can delete images',
        action: 'DELETE',
        condition: 'auth.role() = \'authenticated\'',
        type: 'USING'
      }
    ];

    // Check each policy
    expectedPolicies.forEach(policy => {
      const policyCreation = `CREATE POLICY "${policy.name}" ON image_library FOR ${policy.action}`;
      expect(rlsSql).toContain(policyCreation);
      
      if (policy.type === 'USING') {
        expect(rlsSql).toContain(`${policy.type} (${policy.condition})`);
      } else {
        expect(rlsSql).toContain(`${policy.type} (${policy.condition})`);
      }
    });
  });

  it('should create indexes for efficient querying', async () => {
    await createImageLibraryTable(supabase);
    const indexesSql = getCallSQL(mockSupabaseClient.rpc.mock.calls, 'create_image_library_indexes');

    const expectedIndexes = [
      'CREATE INDEX idx_image_library_user_id ON image_library(user_id)',
      'CREATE INDEX idx_image_library_content_hash ON image_library(content_hash)',
      'CREATE INDEX idx_image_library_tags ON image_library USING GIN(tags)',
      'CREATE INDEX idx_image_library_categories ON image_library USING GIN(categories)',
      'CREATE INDEX idx_image_library_platform_compatibility ON image_library USING GIN(platform_compatibility)'
    ];

    expectedIndexes.forEach(index => {
      expect(indexesSql).toContain(normalizeSQL(index));
    });
  });
}); 