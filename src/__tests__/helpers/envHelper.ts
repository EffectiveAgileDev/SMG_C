import { vi } from 'vitest';

export const mockEnvironmentVariables = {
  VITE_SUPABASE_URL: 'https://test-project.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-key-123',
  // Add other test environment variables as needed
};

export function setupTestEnv() {
  vi.stubGlobal('import.meta', {
    env: mockEnvironmentVariables
  });
}

export function cleanupTestEnv() {
  vi.unstubAllGlobals();
}

export function withTestEnv(fn: () => void | Promise<void>) {
  return async () => {
    setupTestEnv();
    try {
      await fn();
    } finally {
      cleanupTestEnv();
    }
  };
} 