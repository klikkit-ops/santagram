/**
 * Test script to list all RunPod endpoints
 * This will help verify if the endpoint exists and is accessible
 */

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;

if (!RUNPOD_API_KEY) {
    console.error('ERROR: RUNPOD_API_KEY environment variable is not set');
    process.exit(1);
}

async function listEndpoints() {
    console.log('Fetching list of RunPod endpoints...\n');
    
    try {
        // Try to list all endpoints
        const response = await fetch('https://api.runpod.io/v2/endpoints', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${RUNPOD_API_KEY}`,
            },
        });

        const responseText = await response.text();
        console.log('Status:', response.status, response.statusText);
        console.log('Response:', responseText);

        if (response.ok) {
            const data = JSON.parse(responseText);
            console.log('\n✅ Successfully retrieved endpoints!');
            console.log('\nEndpoints found:');
            if (Array.isArray(data)) {
                data.forEach((endpoint, index) => {
                    console.log(`\n${index + 1}. ID: ${endpoint.id || endpoint.endpointId || 'N/A'}`);
                    console.log(`   Name: ${endpoint.name || 'N/A'}`);
                    console.log(`   Status: ${endpoint.status || 'N/A'}`);
                });
            } else if (data.data && Array.isArray(data.data)) {
                data.data.forEach((endpoint, index) => {
                    console.log(`\n${index + 1}. ID: ${endpoint.id || endpoint.endpointId || 'N/A'}`);
                    console.log(`   Name: ${endpoint.name || 'N/A'}`);
                    console.log(`   Status: ${endpoint.status || 'N/A'}`);
                });
            } else {
                console.log('Response structure:', JSON.stringify(data, null, 2));
            }
        } else {
            console.log('❌ Failed to list endpoints');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

listEndpoints();





