/// <reference types="vitest" />
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    // Return a minimal mock client
    from: vi.fn(),
    auth: vi.fn(),
  }))
}));

describe('Supabase Configuration', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should initialize when all environment variables are present', async () => {
    // Set environment variables before importing
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'example-anon-key');
    
    // Import the module
    const module = await import('../../lib/supabase');
    
    // Verify the client was created correctly
    expect(createClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'example-anon-key'
    );
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(module.supabase).toBeDefined();
  });

  it('should throw error when VITE_SUPABASE_URL is missing', async () => {
    // Set only ANON_KEY
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'example-anon-key');
    vi.stubEnv('VITE_SUPABASE_URL', undefined);
    
    // The import should throw
    await expect(() => import('../../lib/supabase')).rejects.toThrow('VITE_SUPABASE_URL is not defined');
  });

  it('should throw error when VITE_SUPABASE_ANON_KEY is missing', async () => {
    // Set only URL
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', undefined);
    
    // The import should throw
    await expect(() => import('../../lib/supabase')).rejects.toThrow('VITE_SUPABASE_ANON_KEY is not defined');
  });
}); 