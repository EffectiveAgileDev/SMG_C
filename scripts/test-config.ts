import path from 'path';

export interface TestConfig {
  // Base directory for all tests
  testRoot: string;
  
  // Test group configurations
  testGroups: {
    [key: string]: {
      // Directory relative to testRoot
      directory: string;
      // Test file pattern
      pattern: string;
      // Optional: specific setup/teardown scripts
      setup?: string;
      teardown?: string;
    };
  };
}

// Default configuration that can be overridden
export const defaultTestConfig: TestConfig = {
  testRoot: path.join(process.cwd(), 'src', '__tests__'),
  testGroups: {
    auth: {
      directory: 'lib/auth',
      pattern: '**/*.test.ts'
    },
    apiKeys: {
      directory: 'lib/apiKeys',
      pattern: '**/*.test.ts'
    },
    database: {
      directory: 'lib/db',
      pattern: '**/*.test.ts'
    },
    middleware: {
      directory: 'lib/middleware',
      pattern: '**/*.test.ts'
    }
  }
};

// Function to load custom config and merge with defaults
export function loadTestConfig(customConfigPath?: string): TestConfig {
  if (!customConfigPath) {
    return defaultTestConfig;
  }

  try {
    // This would be replaced with actual config loading logic
    const customConfig = require(customConfigPath);
    return {
      ...defaultTestConfig,
      ...customConfig,
      testGroups: {
        ...defaultTestConfig.testGroups,
        ...(customConfig.testGroups || {})
      }
    };
  } catch (error) {
    console.warn(`Failed to load custom test config from ${customConfigPath}, using defaults`);
    return defaultTestConfig;
  }
} 