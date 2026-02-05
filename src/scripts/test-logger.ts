// Create: src/scripts/test-logger.ts

import { logger } from '@/lib/logger';

console.log('🧪 Testing logger utility...\n');

// Test all log levels
logger.debug('This is a debug message', { testData: 'value' });
logger.info('This is an info message', { status: 'testing' });
logger.warn('This is a warning message', { issue: 'minor' });
logger.error('This is an error message', new Error('Test error'), { context: 'test' });

// Test specialized methods
logger.api('POST', '/api/generate', { sectionId: 'header' });
logger.ai('Groq', 'Testing generation', { model: 'llama-3.3-70b' });
logger.cache('hit', 'test-cache-key');
logger.cache('miss', 'another-key');
logger.cache('set', 'cached-key');

console.log('\n✅ Logger test complete!');
console.log('💡 Set DEBUG=true to see debug messages');