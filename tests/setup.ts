import { vi, afterEach, afterAll } from 'vitest';

// Mock Vite's import.meta.env
vi.stubGlobal('import.meta', {
  env: {
    VITE_SUPABASE_URL: 'https://example.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'example-anon-key',
    MODE: 'test',
    DEV: true,
  }
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

// Clean up after all tests
afterAll(() => {
  vi.unstubAllGlobals();
}); 