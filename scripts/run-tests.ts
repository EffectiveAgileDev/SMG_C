import { execa } from 'execa';
import chalk from 'chalk';
import * as glob from 'glob';

interface TestGroup {
  name: string;
  pattern: string;
  description: string;
}

interface TestResult {
  name: string;
  success: boolean;
  error: string | null;
}

const testGroups: TestGroup[] = [
  {
    name: 'Authentication',
    pattern: './src/__tests__/lib/auth/**/*.test.ts',
    description: 'Auth service and role-based access control tests'
  },
  {
    name: 'API Keys',
    pattern: './src/__tests__/lib/apiKeys/**/*.test.ts',
    description: 'API key management, encryption, and validation tests'
  },
  {
    name: 'Database',
    pattern: './src/__tests__/lib/db/**/*.test.ts',
    description: 'Database migrations and schema tests'
  },
  {
    name: 'Middleware',
    pattern: './src/__tests__/lib/middleware/**/*.test.ts',
    description: 'API middleware and validation tests'
  },
  {
    name: 'Image Library',
    pattern: './src/__tests__/lib/imageLibrary/**/*.test.ts',
    description: 'Image import, storage, and processing tests'
  }
];

async function runTestFile(filePath: string): Promise<boolean> {
  try {
    await execa('npx', ['vitest', 'run', filePath], {
      stdio: 'inherit',
      env: {
        ...process.env,
        CI: 'true',
      },
    });
    return true;
  } catch (error) {
    return false;
  }
}

async function runTestGroup(group: TestGroup): Promise<boolean> {
  console.log(`\n🚀 Running ${group.name}`);
  console.log(group.description);
  console.log('──────────────────────────────────────────────────\n');

  try {
    const files = await glob.glob(group.pattern);
    
    if (files.length === 0) {
      console.log(`No test files found for pattern: ${group.pattern}`);
      return false;
    }

    let allPassed = true;
    for (const file of files) {
      console.log(`Running test file: ${file}`);
      const passed = await runTestFile(file);
      if (!passed) {
        allPassed = false;
      }
    }

    if (allPassed) {
      console.log(`✅ ${group.name} Passed`);
    } else {
      console.log(`❌ ${group.name} Failed`);
    }
    return allPassed;
  } catch (error) {
    console.log(`❌ ${group.name} Failed`);
    console.error(error);
    return false;
  }
}

async function runAllTests() {
  console.log(chalk.yellow('🧪 Starting Sequential Test Run\n'));
  
  const results: TestResult[] = [];
  
  for (const group of testGroups) {
    try {
      const success = await runTestGroup(group);
      results.push({
        name: group.name,
        success,
        error: null
      });
    } catch (error) {
      results.push({
        name: group.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  console.log(chalk.gray('──────────────────────────────────────────────────'));
  
  // Print summary
  console.log('\n📊 Test Summary:');
  for (const result of results) {
    const status = result.success 
      ? chalk.green('✅ PASS') 
      : chalk.red('❌ FAIL');
    console.log(`${status} ${result.name}`);
    if (!result.success && result.error) {
      console.log(chalk.gray(`   └─ ${result.error}`));
    }
  }

  const failedGroups = results.filter(r => !r.success).map(r => r.name);
  
  if (failedGroups.length === 0) {
    console.log(chalk.green('\n🎉 All Test Groups Passed!'));
  } else {
    console.log(chalk.red(`\n❌ Failed Test Groups: ${failedGroups.join(', ')}`));
    process.exit(1);
  }
}

runAllTests().catch(error => {
  console.error(chalk.red('Fatal Error:'), error);
  process.exit(1);
}); 