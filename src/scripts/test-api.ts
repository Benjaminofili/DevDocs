// Create: src/scripts/test-api.ts

const API_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing API endpoints...\n');

  // 1. Test /api/analyze
  console.log('1️⃣ Testing /api/analyze...');
  try {
    const analyzeResponse = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repoUrl: 'https://github.com/vercel/next.js'
      })
    });

    const analyzeData = await analyzeResponse.json();
    
    if (analyzeData.success) {
      console.log('  ✅ Analysis successful');
      console.log(`  - Stack detected: ${analyzeData.data.stack.primary}`);
      console.log(`  - Sections suggested: ${analyzeData.data.suggestedSections.length}`);
    } else {
      console.log('  ❌ Analysis failed:', analyzeData.error);
    }
  } catch (error) {
    console.log('  ❌ Request failed:', error);
  }

  // 2. Test /api/generate
  console.log('\n2️⃣ Testing /api/generate...');
  try {
    const generateResponse = await fetch(`${API_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sectionId: 'header',
        projectName: 'Test Project',
        stack: {
          primary: 'nextjs',
          secondary: [],
          language: 'TypeScript',
          packageManager: 'npm',
          hasDocker: false,
          hasCI: false,
          hasTesting: false,
          hasEnvFile: false,
          frameworks: ['Next.js'],
          dependencies: {}
        }
      })
    });

    // Check response headers
    console.log('  Response Headers:');
    console.log(`  - X-RateLimit-Remaining: ${generateResponse.headers.get('X-RateLimit-Remaining')}`);
    console.log(`  - X-Cache: ${generateResponse.headers.get('X-Cache')}`);
    console.log(`  - X-Response-Time: ${generateResponse.headers.get('X-Response-Time')}`);

    const generateData = await generateResponse.json();
    
    if (generateData.success) {
      console.log('  ✅ Generation successful');
      console.log(`  - Provider used: ${generateData.data.provider}`);
      console.log(`  - Content length: ${generateData.data.content.length} chars`);
      console.log(`  - Cached: ${generateData.cached ? 'Yes' : 'No'}`);
    } else {
      console.log('  ❌ Generation failed:', generateData.error);
    }
  } catch (error) {
    console.log('  ❌ Request failed:', error);
  }

  // 3. Test validation errors
  console.log('\n3️⃣ Testing validation (should fail)...');
  try {
    const invalidResponse = await fetch(`${API_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sectionId: '', // Invalid - empty
        projectName: '',
      })
    });

    const invalidData = await invalidResponse.json();
    
    if (invalidResponse.status === 400 && !invalidData.success) {
      console.log('  ✅ Validation correctly rejected bad input');
      console.log('  - Error:', invalidData.error);
    } else {
      console.log('  ❌ Should have rejected invalid input');
    }
  } catch (error) {
    console.log('  ❌ Request failed:', error);
  }

  console.log('\n✅ API tests complete!');
}

testAPI().catch(console.error);