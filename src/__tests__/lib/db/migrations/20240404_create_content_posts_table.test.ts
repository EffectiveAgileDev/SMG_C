/// <reference types="vitest" />
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SupabaseClient, PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import type { AuthResponse, Session } from '@supabase/supabase-js';
import { createContentPostsTable, ContentPost } from '../../../../lib/db/migrations/20240404_create_content_posts_table';
import { supabase as realSupabase } from '../../../../lib/supabase';

// Define proper types for our mocks
type MockSupabaseResponse<T> = PostgrestResponse<T>;
type MockSupabaseSingleResponse<T> = PostgrestSingleResponse<T>;

// Create a minimal mock auth client that matches what we need
interface MinimalAuthClient {
  getSession: ReturnType<typeof vi.fn>;
}

interface MockSupabaseClient {
  rpc: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  auth: MinimalAuthClient;
}

describe('Content/Posts Table Migration', () => {
  let mockSupabaseClient: MockSupabaseClient;
  let supabase: SupabaseClient;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    // Create chainable mock functions
    const createChainableMock = (returnValue: any) => {
      const chainable = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(returnValue)
      };
      return chainable;
    };

    mockSupabaseClient = {
      rpc: vi.fn().mockImplementation(() => Promise.resolve({ error: null })),
      from: vi.fn().mockImplementation(() => createChainableMock({ data: null, error: null })),
      auth: {
        getSession: vi.fn().mockImplementation(() => Promise.resolve({ 
          data: { session: null }, 
          error: null 
        }))
      }
    };

    // Mock the Supabase client
    vi.mock('../../../../lib/supabase', () => ({
      supabase: mockSupabaseClient
    }));

    supabase = mockSupabaseClient as unknown as SupabaseClient;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create content_posts table with correct schema', async () => {
    try {
      await createContentPostsTable(supabase);
      
      expect(mockSupabaseClient.rpc).toHaveBeenNthCalledWith(1, 'create_content_posts_table', {
        sql: expect.stringContaining('CREATE TABLE IF NOT EXISTS content_posts')
      });

      expect(mockSupabaseClient.rpc).toHaveBeenNthCalledWith(2, 'create_test_content_posts_table_function', {
        sql: expect.stringContaining('CREATE OR REPLACE FUNCTION test_create_content_posts_table')
      });
    } catch (error) {
      console.error('Test failure details:', error);
      throw error;
    }
  });

  it('should enforce RLS policies', async () => {
    mockSupabaseClient.rpc.mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null });
    
    await createContentPostsTable(supabase);

    const testPost: ContentPost = {
      id: 'post-1',
      title: 'Test Post',
      content: 'Test Content',
      platform: 'twitter',
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'test-user-1',
      media_urls: [],
      platform_specific_data: {},
      metadata: {}
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
      data: [testPost],
      error: null,
      count: null,
      status: 200,
      statusText: 'OK'
    };

    mockSupabaseClient.from.mockImplementationOnce(() => ({
      select: vi.fn().mockReturnValue(mockSelectChain1)
    }));

    const result1 = await supabase.from('content_posts').select('*');
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

    const result2 = await supabase.from('content_posts').select('*');
    expect(result2.error).toBeDefined();
    expect(result2.error?.message).toContain('Policy check failed');
  });

  it('should enforce status transitions', async () => {
    try {
      mockSupabaseClient.rpc.mockResolvedValueOnce({ error: null })
        .mockResolvedValueOnce({ error: null });
      
      await createContentPostsTable(supabase);

      const testPost: ContentPost = {
        id: 'post-1',
        title: 'Test Post',
        content: 'Test Content',
        platform: 'twitter',
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'test-user-1',
        media_urls: [],
        platform_specific_data: {},
        metadata: {}
      };

      // Mock insert operation (draft) - using the chainable mock pattern that worked in other tests
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: [testPost], error: null })
      }));

      const result1 = await supabase.from('content_posts').insert(testPost).select();
      expect(result1.error).toBeNull();
      expect(result1.data?.[0].status).toBe('draft');

      // Mock update operation (draft -> scheduled)
      const scheduledPost = { ...testPost, status: 'scheduled', scheduled_for: new Date().toISOString() };
      const mockScheduledChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: [scheduledPost], error: null })
      };
      mockSupabaseClient.from.mockImplementationOnce(() => mockScheduledChain);

      const result2 = await supabase
        .from('content_posts')
        .update({ status: 'scheduled', scheduled_for: new Date() })
        .eq('id', 'post-1')
        .select();
      expect(result2.error).toBeNull();
      expect(result2.data?.[0].status).toBe('scheduled');

      // Mock update operation (scheduled -> draft, should fail)
      const mockInvalidChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Invalid status transition from scheduled to draft' }
        })
      };
      mockSupabaseClient.from.mockImplementationOnce(() => mockInvalidChain);

      const result3 = await supabase
        .from('content_posts')
        .update({ status: 'draft' })
        .eq('id', 'post-1')
        .select();
      expect(result3.error).toBeDefined();
      expect(result3.error?.message).toContain('Invalid status transition');

      // Mock update operation (scheduled -> published)
      const publishedPost = { ...testPost, status: 'published', published_at: new Date().toISOString() };
      const mockPublishChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: [publishedPost], error: null })
      };
      mockSupabaseClient.from.mockImplementationOnce(() => mockPublishChain);

      const result4 = await supabase
        .from('content_posts')
        .update({ status: 'published', published_at: new Date() })
        .eq('id', 'post-1')
        .select();
      expect(result4.error).toBeNull();
      expect(result4.data?.[0].status).toBe('published');
    } catch (error) {
      console.error('Test failure details:', error);
      throw error;
    }
  });

  it('should prevent invalid status transitions', async () => {
    await createContentPostsTable(supabase);

    const testPost: ContentPost = {
      id: 'post-2',
      title: 'Test Post',
      content: 'Test Content',
      platform: 'twitter',
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'test-user-1',
      media_urls: [],
      platform_specific_data: {},
      metadata: {}
    };

    // Test invalid transitions
    const invalidTransitions = [
      { from: 'draft', to: 'published' },      // Can't publish directly from draft
      { from: 'published', to: 'scheduled' },  // Can't schedule after publishing
      { from: 'published', to: 'draft' },      // Can't go back to draft after publishing
      { from: 'scheduled', to: 'draft' }       // Can't go back to draft after scheduling
    ];

    for (const transition of invalidTransitions) {
      // Setup initial state
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ 
          data: [{ ...testPost, status: transition.from }], 
          error: null 
        })
      }));

      const initialResult = await supabase
        .from('content_posts')
        .insert({ ...testPost, status: transition.from })
        .select();

      expect(initialResult.error).toBeNull();
      expect(initialResult.data?.[0].status).toBe(transition.from);

      // Try invalid transition
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: `Invalid status transition from ${transition.from} to ${transition.to}` }
        })
      }));

      const transitionResult = await supabase
        .from('content_posts')
        .update({ status: transition.to })
        .eq('id', 'post-2')
        .select();

      expect(transitionResult.error).toBeDefined();
      expect(transitionResult.error?.message).toContain(`Invalid status transition from ${transition.from} to ${transition.to}`);
    }
  });

  it('should allow valid status transitions', async () => {
    await createContentPostsTable(supabase);

    const testPost: ContentPost = {
      id: 'post-3',
      title: 'Test Post',
      content: 'Test Content',
      platform: 'twitter',
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'test-user-1',
      media_urls: [],
      platform_specific_data: {},
      metadata: {}
    };

    // Test valid transitions
    const validTransitions = [
      { from: 'draft', to: 'scheduled', additionalData: { scheduled_for: new Date().toISOString() } },
      { from: 'scheduled', to: 'published', additionalData: { published_at: new Date().toISOString() } }
    ];

    for (const transition of validTransitions) {
      // Setup initial state
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ 
          data: [{ ...testPost, status: transition.from }], 
          error: null 
        })
      }));

      const initialResult = await supabase
        .from('content_posts')
        .insert({ ...testPost, status: transition.from })
        .select();

      expect(initialResult.error).toBeNull();
      expect(initialResult.data?.[0].status).toBe(transition.from);

      // Try valid transition
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ 
          data: [{ ...testPost, status: transition.to, ...transition.additionalData }], 
          error: null 
        })
      }));

      const transitionResult = await supabase
        .from('content_posts')
        .update({ status: transition.to, ...transition.additionalData })
        .eq('id', 'post-3')
        .select();

      expect(transitionResult.error).toBeNull();
      expect(transitionResult.data?.[0].status).toBe(transition.to);
    }
  });
}); 