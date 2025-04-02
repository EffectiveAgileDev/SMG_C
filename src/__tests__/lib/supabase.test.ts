/// <reference types="vitest" />
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { setupTestEnv, cleanupTestEnv, withTestEnv } from '../helpers/envHelper';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(),
    auth: vi.fn(),
  }))
}));

describe('Supabase Configuration', () => {
  const mockEnv = {
    VITE_SUPABASE_URL: 'https://example.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'example-anon-key'
  };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    // Mock import.meta.env
    vi.stubGlobal('import.meta', { env: mockEnv });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should initialize when all environment variables are present', async () => {
    const { supabase } = await import('../../lib/supabase');
    
    expect(createClient).toHaveBeenCalledWith(
      mockEnv.VITE_SUPABASE_URL,
      mockEnv.VITE_SUPABASE_ANON_KEY
    );
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(supabase).toBeDefined();
  });

  it('should throw error when VITE_SUPABASE_URL is missing', async () => {
    vi.resetModules();
    vi.stubGlobal('import.meta', { 
      env: {} 
    });
    
    await expect(import('../../lib/supabase')).rejects.toThrow('VITE_SUPABASE_URL is not defined');
  });

  it('should throw error when VITE_SUPABASE_ANON_KEY is missing', async () => {
    vi.resetModules();
    vi.stubGlobal('import.meta', { 
      env: {
        VITE_SUPABASE_URL: mockEnv.VITE_SUPABASE_URL
      }
    });
    
    await expect(import('../../lib/supabase')).rejects.toThrow('VITE_SUPABASE_ANON_KEY is not defined');
  });
});

describe('Component using environment variables', () => {
  beforeEach(() => {
    setupTestEnv();
  });

  afterEach(() => {
    cleanupTestEnv();
  });

  it('should access environment variables correctly', withTestEnv(async () => {
    const { supabase } = await import('../../lib/supabase');
    expect(supabase).toBeDefined();
    // Add your test assertions here
  }));
}); 