// Create: src/scripts/test-env.ts

import { getEnv, getConfiguredProviders } from '@/lib/env';

try {
  console.log('🧪 Testing environment validation...\n');
  
  const env = getEnv();
  console.log('✅ Environment validation passed!\n');
  
  console.log('📋 Configuration Summary:');
  console.log(`- Redis URL: ${env.UPSTASH_REDIS_REST_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`- Redis Token: ${env.UPSTASH_REDIS_REST_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`- Debug Mode: ${env.DEBUG}`);
  console.log(`- Node Env: ${env.NODE_ENV}\n`);
  
  const providers = getConfiguredProviders();
  console.log(`🤖 Configured AI Providers (${providers.length}):`);
  providers.forEach(p => console.log(`  - ${p}`));
  
  if (providers.length === 0) {
    console.warn('\n⚠️  WARNING: No AI providers configured!');
  }
  
  console.log('\n✅ All checks passed!');
} catch (error) {
  console.error('❌ Environment validation failed:', error);
  process.exit(1);
}