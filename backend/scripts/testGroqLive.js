/**
 * UMNY AI - Groq Live API Verification & Diagnostic Tool
 * 
 * Tests live connection, model discovery, and chat completions on Groq.
 * Usage:
 *   node backend/scripts/testGroqLive.js
 * Or with explicit key:
 *   GROQ_API_KEY=gsk_... node backend/scripts/testGroqLive.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const OpenAI = require('openai');
const axios = require('axios');

async function testGroq() {
  const apiKey = (process.env.GROQ_API_KEY || '').trim();
  const baseURL = (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').trim();
  const model = (process.env.GROQ_MODEL || 'llama-3.1-8b-instant').trim();

  console.log('====================================================');
  console.log(' UMNY AI — Groq Live API Diagnostic & Verification ');
  console.log('====================================================');
  console.log(`Base URL:     ${baseURL}`);
  console.log(`Target Model: ${model}`);
  console.log(`API Key Set:  ${apiKey ? 'YES (masked: ' + apiKey.slice(0, 7) + '...' + apiKey.slice(-4) + ')' : 'NO (not configured locally)'}`);
  console.log('----------------------------------------------------');

  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    console.log('[Notice]: No active GROQ_API_KEY found in local environment or .env.');
    console.log('To run live API requests locally:');
    console.log('  1. Get a key from https://console.groq.com/keys');
    console.log('  2. Set $env:GROQ_API_KEY="gsk_..." in PowerShell');
    console.log('  3. Re-run: node backend/scripts/testGroqLive.js\n');

    console.log('[Simulating endpoint reachability test...]');
    try {
      const res = await axios.get(`${baseURL}/models`, { validateStatus: () => true });
      console.log(`HTTP Status: ${res.status}`);
      console.log('Response body:', res.data);
      if (res.status === 401) {
        console.log('✓ Endpoint https://api.groq.com/openai/v1 is reachable and correctly enforcing authentication.');
      }
    } catch (e) {
      console.error('Network check error:', e.message);
    }
    return;
  }

  // 1. Test Model Discovery (GET /models)
  console.log('\n[Step 1/2]: Testing Dynamic Model Discovery (GET /models)...');
  try {
    const client = new OpenAI({ apiKey, baseURL });
    const modelsResponse = await client.models.list();
    const allModels = modelsResponse.data || [];
    console.log(`✓ Successfully retrieved ${allModels.length} models from Groq API.`);

    const chatModels = allModels.filter(
      (m) =>
        !m.id.includes('whisper') &&
        !m.id.includes('guard') &&
        m.id !== 'llama-3.3-70b-versatile'
    );

    console.log('\nActive Chat Models on your Groq Account:');
    chatModels.forEach((m) => {
      console.log(`  • ID: ${m.id.padEnd(28)} | Owned By: ${m.owned_by || 'Open-Source'} | Active: ${m.active ?? true}`);
    });

    const isTargetAvailable = allModels.some((m) => m.id === model);
    console.log(`\nDefault model "${model}" available in active catalog: ${isTargetAvailable ? 'YES' : 'NO'}`);

    // Check deprecated models
    const hasDeprecated = allModels.some((m) => m.id === 'llama-3.3-70b-versatile');
    console.log(`Deprecated "llama-3.3-70b-versatile" in catalog: ${hasDeprecated ? 'YES' : 'NO (decommissioned as expected)'}`);

    // 2. Test Live Chat Completion
    console.log(`\n[Step 2/2]: Testing Live Chat Completion with "${model}"...`);
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are UMNY AI diagnostic assistant. Reply with one brief sentence.' },
        { role: 'user', content: 'Confirm you are running on Groq LPU inference.' },
      ],
      temperature: 0.2,
      max_tokens: 60,
    });

    const reply = completion.choices[0]?.message?.content;
    console.log('✓ Response received:');
    console.log(`  "${reply}"`);
    console.log('Token Usage:', completion.usage);
    console.log('\n====================================================');
    console.log(' RESULT: Groq API credentials and live model WORK! ');
    console.log('====================================================');
  } catch (err) {
    console.error('\n✗ Live Groq API Error:', err.message);
    if (err.status) console.error(`  Status Code: ${err.status}`);
    if (err.error) console.error('  Details:', err.error);
  }
}

testGroq();

