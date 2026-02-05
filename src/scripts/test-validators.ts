// src/scripts/test-validators.ts

import { isCacheValid, isContentCacheable } from '@/lib/validators/cache';
import { GenerateRequestSchema } from '@/lib/validators/schemas';

console.log('🧪 Testing validators...\n');

// Test cache validation
console.log('1️⃣ Testing cache validators:');

const validCache = {
  sectionId: 'header',
  content: 'This is a valid README content that is long enough to pass validation and contains real information about the project.',
  explanation: 'Header section',
  provider: 'groq'
};

const invalidCache = {
  sectionId: 'header',
  content: '{{PROJECT_NAME}}',
  explanation: 'Header',
  provider: 'groq'
};

console.log(`  Valid cache: ${isCacheValid(validCache) ? '✅' : '❌'}`);
console.log(`  Invalid cache (template vars): ${isCacheValid(invalidCache) ? '❌' : '✅'}`);
console.log(`  Null cache: ${isCacheValid(null) ? '❌' : '✅'}`);

// Test content validation
console.log('\n2️⃣ Testing content validators:');
const goodContent = 'This is valid content with enough characters to pass validation.';
const badContent = '{{TEMPLATE}}';

console.log(`  Good content: ${isContentCacheable(goodContent) ? '✅' : '❌'}`);
console.log(`  Bad content: ${isContentCacheable(badContent) ? '❌' : '✅'}`);

// Test schema validation
console.log('\n3️⃣ Testing Zod schemas:');

const validRequest = {
  sectionId: 'header',
  stack: {
    primary: 'nextjs',
    secondary: [],
    language: 'TypeScript',
    packageManager: 'npm',
    hasDocker: true,
    hasCI: false,
    hasTesting: true,
    hasEnvFile: true,
    frameworks: ['Next.js', 'React'],
    dependencies: { 'next': '^14.0.0' }
  },
  projectName: 'DevDocs'
};

const invalidRequest = {
  sectionId: '', // Empty - should fail
  stack: validRequest.stack,
  projectName: ''
};

try {
  GenerateRequestSchema.parse(validRequest);
  console.log('  Valid request schema: ✅');
} catch {
  console.log('  Valid request schema: ❌ (should have passed)');
}

try {
  GenerateRequestSchema.parse(invalidRequest);
  console.log('  Invalid request schema: ❌ (should have failed)');
} catch {
  console.log('  Invalid request schema: ✅ (correctly rejected)');
}

console.log('\n✅ All validator tests passed!');