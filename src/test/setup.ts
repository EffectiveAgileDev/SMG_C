import { vi, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock environment variables
vi.stubGlobal('import.meta', {
  env: {
    VITE_SUPABASE_URL: 'http://localhost:54321',
    VITE_SUPABASE_ANON_KEY: 'test-key',
  },
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
}); 