const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');

function log(msg) {
    console.log(msg);
    fs.appendFileSync('groq-result.txt', msg + '\n');
}

async function main() {
    fs.writeFileSync('groq-result.txt', '--- Groq Verification Log ---\n');
    log('Starting verification...');

    // 1. Manually load .env.local
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        log('Loading .env.local...');
        const content = fs.readFileSync(envPath, 'utf8');
        content.split(/\r?\n/).forEach(line => {
            if (!line.trim() || line.startsWith('#')) return;
            const idx = line.indexOf('=');
            if (idx === -1) return;
            const key = line.substring(0, idx).trim();
            let val = line.substring(idx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            if (key === 'GROQ_API_KEY') {
                process.env.GROQ_API_KEY = val;
                log('✅ Loaded GROQ_API_KEY');
            }
        });
    } else {
        log('❌ .env.local not found at ' + envPath);
    }

    if (!process.env.GROQ_API_KEY) {
        log('❌ GROQ_API_KEY is missing from environment variables.');
        return;
    }

    // 2. Initialize Client
    try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        log('Using API Key: ' + process.env.GROQ_API_KEY.substring(0, 10) + '...');

        const models = [
            'llama-3.3-70b-versatile', 
            'llama-3.1-8b-instant',
            'openai/gpt-oss-120b'
        ];

        log('\n--- Testing Models ---');
        
        for (const model of models) {
            log(`Testing ${model}...`);
            try {
                const completion = await groq.chat.completions.create({
                    messages: [
                        { role: 'system', content: 'You are a test helper.' },
                        { role: 'user', content: 'Reply with "OK"' }
                    ],
                    model: model,
                });
                log(`✅ Success! Response: "${completion.choices[0]?.message?.content}"`);
                log('-----------------------------------');
            } catch (err) {
                log(`❌ Failed: ${err.message}`);
                log('-----------------------------------');
            }
        }

    } catch (err) {
        log('❌ Initialization failed: ' + err);
    }
}

main();
