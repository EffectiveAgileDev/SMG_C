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
  })),
  auth: {
    getSession: vi.fn(),
    signOut: vi.fn(),
  }
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}));

describe('Supabase Client', () => {
  const mockEnv = {
    VITE_SUPABASE_URL: 'https://SMG_C.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhubWdmaG5zbWtjZ3lzYmNteWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2MTQwMjMsImV4cCI6MjA1OTE5MDAyM30.ghINEpHxRqiTypvfMA59qjKVU9HUrtU6zmouDzljaE8'
  };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubGlobal('import.meta', { env: mockEnv });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should initialize Supabase client with correct configuration', async () => {
    const { supabase } = await import('../../lib/supabase');
    
    expect(createClient).toHaveBeenCalledWith(
      mockEnv.VITE_SUPABASE_URL,
      mockEnv.VITE_SUPABASE_ANON_KEY
    );
    expect(supabase).toBeDefined();
  });

  it('should be able to perform database operations', async () => {
    const { supabase } = await import('../../lib/supabase');
    
    // Test select operation
    await supabase.from('test_table').select();
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('test_table');
    
    // Test insert operation
    const testData = { id: 1, name: 'test' };
    await supabase.from('test_table').insert(testData);
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('test_table');
  });

  it('should be able to perform auth operations', async () => {
    const { supabase } = await import('../../lib/supabase');
    
    await supabase.auth.getSession();
    expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled();
    
    await supabase.auth.signOut();
    expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
  });
}); 