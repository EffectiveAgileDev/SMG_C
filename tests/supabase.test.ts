import { describe, it, expect, beforeAll } from 'vitest';
import { supabase } from '../src/lib/supabase';

describe('Supabase Configuration', () => {
  beforeAll(() => {
    // Set environment variables for testing
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'example-anon-key';
  });

  it('should create a Supabase client', () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
    expect(supabase.from).toBeDefined();
  });

  it('should throw error when environment variables are missing', () => {
    // Temporarily remove environment variables
    const originalUrl = process.env.VITE_SUPABASE_URL;
    const originalKey = process.env.VITE_SUPABASE_ANON_KEY;
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_ANON_KEY;

    expect(() => {
      require('../src/lib/supabase');
    }).toThrow('Missing Supabase environment variables');

    // Restore environment variables
    process.env.VITE_SUPABASE_URL = originalUrl;
    process.env.VITE_SUPABASE_ANON_KEY = originalKey;
  });
}); 