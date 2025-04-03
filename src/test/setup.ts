import '@testing-library/jest-dom/vitest';
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

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
  cleanup();
  vi.clearAllMocks();
}); 