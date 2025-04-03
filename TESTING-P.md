# Testing Standards and Best Practices

## Test Organization

### File Structure
- Test files should mirror the source file structure
- Test files should be named `*.test.ts`
- Place all tests in the `src/__tests__` directory
- Maintain the same directory hierarchy as source files

### Test File Organization
```typescript
// 1. Imports
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// 2. Mocks
vi.mock('external-module');

// 3. Mock Setup
const mockFn = vi.fn();

// 4. Test Suite
describe('Component/Service Name', () => {
  // 5. Test Suite Setup
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  // 6. Individual Tests
  it('should do something', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

## Mocking Standards

### Supabase Mocking

1. **Storage Operations**
```typescript
const mockStorage = {
  from: vi.fn().mockReturnValue({
    download: vi.fn().mockResolvedValue({ data: null, error: null }),
    upload: vi.fn().mockResolvedValue({ data: null, error: null }),
    remove: vi.fn().mockResolvedValue({ data: null, error: null }),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } })
  })
};
```

2. **Database Operations**
```typescript
const mockDatabase = {
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null })
    }),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null })
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null })
    }),
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null })
    })
  })
};
```

3. **Complete Supabase Client Mock**
```typescript
const mockSupabaseClient = {
  storage: mockStorage,
  from: mockDatabase.from,
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null })
  }
} as unknown as SupabaseClient;
```

### External Library Mocking

1. **Sharp Image Processing**
```typescript
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    toFormat: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('processed-image')),
    metadata: vi.fn().mockResolvedValue({
      width: 300,
      height: 300,
      format: 'webp'
    })
  }))
}));
```

## Mock Response Standards

### Success Responses
```typescript
// Database operations
{
  data: expectedData,
  error: null
}

// Storage operations
{
  data: {
    path: 'path/to/file',
    publicUrl: 'https://example.com/file'
  },
  error: null
}
```

### Error Responses
```typescript
// Not found
{
  data: null,
  error: {
    message: 'Resource not found',
    code: 'NOT_FOUND'
  }
}

// Validation error
{
  data: null,
  error: {
    message: 'Validation failed',
    code: 'VALIDATION_ERROR'
  }
}
```

## Testing Best Practices

1. **Follow RED-GREEN-REFACTOR**
   - Write failing test first (RED)
   - Implement minimum code to pass (GREEN)
   - Refactor while keeping tests green

2. **Test One Thing at a Time**
   - Each test should verify one specific behavior
   - Use clear, descriptive test names
   - Follow the Arrange-Act-Assert pattern

3. **Mock Setup**
   - Reset mocks before each test
   - Clear mock calls between tests
   - Verify mock calls when testing integration points

4. **Async Testing**
   - Always await async operations
   - Test both success and error paths
   - Verify proper error handling

5. **Test Coverage**
   - Aim for 100% coverage of business logic
   - Test edge cases and error conditions
   - Include integration tests for critical paths

## Common Patterns

### Testing Async Operations
```typescript
it('should handle async operations', async () => {
  // Arrange
  const mockData = { id: 1 };
  mockFn.mockResolvedValue(mockData);

  // Act
  const result = await someAsyncFunction();

  // Assert
  expect(result).toEqual(mockData);
  expect(mockFn).toHaveBeenCalledTimes(1);
});
```

### Testing Error Handling
```typescript
it('should handle errors', async () => {
  // Arrange
  const error = new Error('Test error');
  mockFn.mockRejectedValue(error);

  // Act
  const result = await someAsyncFunction();

  // Assert
  expect(result.error).toEqual({
    message: 'Test error',
    code: 'ERROR_CODE'
  });
});
```

### Testing State Changes
```typescript
it('should handle state changes', () => {
  // Arrange
  const initialState = { value: 0 };

  // Act
  const newState = reducer(initialState, { type: 'INCREMENT' });

  // Assert
  expect(newState.value).toBe(1);
});
```

## Vitest-Specific Mocking Considerations

### Module Mock Hoisting
```typescript
// CORRECT: Mock definition in vi.mock()
vi.mock('module-name', () => ({
  default: vi.fn().mockImplementation(() => ({
    someMethod: vi.fn()
  }))
}));

// INCORRECT: Don't define mocks outside vi.mock()
const mockFn = vi.fn();  // This won't work with hoisting
vi.mock('module-name', () => ({
  default: mockFn
}));
```

### Changing Mock Behavior
```typescript
// CORRECT: Change behavior for specific test
it('should handle specific case', async () => {
  const module = await import('module-name');
  vi.mocked(module.default).mockImplementationOnce(() => {
    throw new Error('Test error');
  });
});

// INCORRECT: Don't modify mock outside test
const mockFn = vi.fn();
mockFn.mockImplementation(() => {
  throw new Error('Test error');
});
```

### Mock Reset Best Practices
```typescript
describe('Test Suite', () => {
  beforeEach(() => {
    vi.resetModules();  // Reset modules between tests
    vi.clearAllMocks(); // Clear mock calls and implementations
  });

  afterEach(() => {
    vi.clearAllMocks(); // Clean up after each test
  });
});
``` 