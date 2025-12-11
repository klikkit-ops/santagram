/**
 * Test script to verify RunPod endpoint is accessible
 * Run with: node test-runpod.js
 * 
 * Make sure to set RUNPOD_API_KEY and RUNPOD_ENDPOINT_ID in your environment
 */

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const RUNPOD_ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID || 'pjb7pubaju2fh8';

if (!RUNPOD_API_KEY) {
    console.error('ERROR: RUNPOD_API_KEY environment variable is not set');
    process.exit(1);
}

console.log('Testing RunPod endpoint:', RUNPOD_ENDPOINT_ID);
console.log('API Key present:', !!RUNPOD_API_KEY);

// Test 1: Simple test request (like RunPod dashboard example)
async function testSimpleRequest() {
    console.log('\n=== Test 1: Simple Request (like RunPod dashboard) ===');
    const endpointUrl = `https://api.runpod.io/v2/${RUNPOD_ENDPOINT_ID}/run`;
    
    const testInput = {
        input: {
            prompt: "test"
        }
    };

    try {
        const response = await fetch(endpointUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RUNPOD_API_KEY}`,
            },
            body: JSON.stringify(testInput),
        });

        const responseText = await response.text();
        console.log('Status:', response.status, response.statusText);
        console.log('Response:', responseText);

        if (response.ok) {
            console.log('✅ Simple request succeeded!');
            return true;
        } else {
            console.log('❌ Simple request failed');
            return false;
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

// Test 2: Audio splitting request (our actual use case)
async function testAudioSplittingRequest() {
    console.log('\n=== Test 2: Audio Splitting Request (our actual format) ===');
    const endpointUrl = `https://api.runpod.io/v2/${RUNPOD_ENDPOINT_ID}/run`;
    
    const testInput = {
        input: {
            mode: 'split_audio',
            audio_key: 'audio/test.mp3',
            chunk_duration: 10,
            r2_account_id: 'test',
            r2_access_key_id: 'test',
            r2_secret_access_key: 'test',
            r2_bucket_name: 'test',
            r2_public_url: 'https://blob.santagram.app',
        }
    };

    try {
        const response = await fetch(endpointUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RUNPOD_API_KEY}`,
            },
            body: JSON.stringify(testInput),
        });

        const responseText = await response.text();
        console.log('Status:', response.status, response.statusText);
        console.log('Response:', responseText);

        if (response.ok) {
            console.log('✅ Audio splitting request succeeded!');
            const result = JSON.parse(responseText);
            console.log('Job ID:', result.id);
            return true;
        } else {
            console.log('❌ Audio splitting request failed');
            return false;
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

// Test 3: Check endpoint status
async function testEndpointStatus() {
    console.log('\n=== Test 3: Endpoint Status Check ===');
    const statusUrl = `https://api.runpod.io/v2/${RUNPOD_ENDPOINT_ID}/status`;
    
    try {
        const response = await fetch(statusUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${RUNPOD_API_KEY}`,
            },
        });

        const responseText = await response.text();
        console.log('Status:', response.status, response.statusText);
        console.log('Response:', responseText);

        if (response.ok) {
            console.log('✅ Status check succeeded!');
            return true;
        } else {
            console.log('❌ Status check failed');
            return false;
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log('Starting RunPod endpoint tests...\n');
    
    const results = {
        simple: await testSimpleRequest(),
        audioSplitting: await testAudioSplittingRequest(),
        status: await testEndpointStatus(),
    };

    console.log('\n=== Test Results ===');
    console.log('Simple Request:', results.simple ? '✅ PASS' : '❌ FAIL');
    console.log('Audio Splitting Request:', results.audioSplitting ? '✅ PASS' : '❌ FAIL');
    console.log('Status Check:', results.status ? '✅ PASS' : '❌ FAIL');

    if (results.simple || results.audioSplitting) {
        console.log('\n✅ At least one test passed - endpoint is accessible!');
    } else {
        console.log('\n❌ All tests failed - endpoint is not accessible');
        console.log('Check:');
        console.log('  1. RUNPOD_API_KEY is correct');
        console.log('  2. RUNPOD_ENDPOINT_ID is correct');
        console.log('  3. Endpoint is active in RunPod dashboard');
        console.log('  4. API key has serverless permissions');
    }
}

runTests().catch(console.error);

