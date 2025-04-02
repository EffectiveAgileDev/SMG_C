# Testing Environment Variables with Vite and Vitest

This document serves as a permanent reference for testing environment variables in Vite projects using Vitest.

## Approaches

### 1. Using vi.stubGlobal (Recommended for Component Tests)
Best for testing components that directly use `import.meta.env`:

```javascript
// In your test file
beforeEach(() => {
  vi.stubGlobal('import.meta', {
    env: {
      VITE_SUPABASE_URL: 'https://test-project.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-key-123',
      // Add other variables as needed
    }
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})
```

### 2. Using loadEnv in Vitest Config
For global environment variable configuration:

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'

export default defineConfig({
  test: {
    environment: 'jsdom',
    env: loadEnv('test', process.cwd(), ''),
  },
})
```

### 3. Using Test-Specific Environment
For dedicated test environment setup:

```javascript
// setupTests.ts
import { vi } from 'vitest'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })
```

### 4. Using Node.js v20+ Env File
For projects using Node.js v20 or later:

```json
{
  "scripts": {
    "test": "node --env-file=.env.test vitest"
  }
}
```

## Best Practices

1. Always clean up environment mocks after tests
2. Use descriptive test environment variables
3. Keep test environment variables separate from development
4. Document any special environment requirements
5. Use TypeScript for better type safety

## Example Implementation

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('Environment Variable Tests', () => {
  const mockEnv = {
    VITE_SUPABASE_URL: 'https://test-project.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-key-123'
  }

  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('import.meta', { env: mockEnv })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should access environment variables', async () => {
    const module = await import('./your-module')
    expect(module).toBeDefined()
  })
})
```

## References

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Vitest Configuration](https://vitest.dev/config/)
- [Testing Best Practices](https://vitest.dev/guide/) 