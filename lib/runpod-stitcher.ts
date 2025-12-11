import { downloadFromR2, uploadToR2 } from './r2-storage';

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const RUNPOD_ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID;

if (!RUNPOD_API_KEY) {
    console.warn('Missing RUNPOD_API_KEY environment variable');
}

/**
 * Stitch multiple video chunks together with the full audio using RunPod
 * @param videoChunks - Array of R2 URLs for video chunks
 * @param audioUrl - R2 URL of the full audio file
 * @param outputKey - R2 key for the final stitched video
 * @returns R2 URL of the final stitched video
 */
export async function stitchVideoChunks(
    videoChunks: string[],
    audioUrl: string,
    outputKey: string
): Promise<string> {
    if (!RUNPOD_API_KEY) {
        throw new Error('RUNPOD_API_KEY is not configured');
    }

    if (videoChunks.length === 0) {
        throw new Error('No video chunks provided');
    }

    console.log(`[stitchVideoChunks] Starting stitching process for ${videoChunks.length} chunks`);

    try {
        // Extract R2 keys from URLs
        const extractKey = (url: string): string => {
            try {
                const urlObj = new URL(url);
                return urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;
            } catch {
                // If it's already a key, return as is
                return url;
            }
        };

        const videoKeys = videoChunks.map(extractKey);
        const audioKey = extractKey(audioUrl);

        // Prepare RunPod job input
        const jobInput = {
            input: {
                video_chunks: videoKeys,
                audio_key: audioKey,
                output_key: outputKey,
                r2_account_id: process.env.CLOUDFLARE_R2_ACCOUNT_ID,
                r2_access_key_id: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
                r2_secret_access_key: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
                r2_bucket_name: process.env.CLOUDFLARE_R2_BUCKET_NAME,
                r2_endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            },
        };

        // Submit job to RunPod
        const endpointUrl = RUNPOD_ENDPOINT_ID
            ? `https://api.runpod.io/v2/${RUNPOD_ENDPOINT_ID}/run`
            : 'https://api.runpod.io/v2/run';

        const response = await fetch(endpointUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RUNPOD_API_KEY}`,
            },
            body: JSON.stringify(jobInput),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`RunPod API error: ${response.status} ${error}`);
        }

        const result = await response.json();
        const jobId = result.id;

        console.log(`[stitchVideoChunks] RunPod job submitted: ${jobId}`);

        // Poll for job completion
        const maxAttempts = 120; // 10 minutes max (5 second intervals)
        let attempts = 0;

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

            const statusResponse = await fetch(
                RUNPOD_ENDPOINT_ID
                    ? `https://api.runpod.io/v2/${RUNPOD_ENDPOINT_ID}/status/${jobId}`
                    : `https://api.runpod.io/v2/status/${jobId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${RUNPOD_API_KEY}`,
                    },
                }
            );

            if (!statusResponse.ok) {
                throw new Error(`Failed to check RunPod job status: ${statusResponse.status}`);
            }

            const statusResult = await statusResponse.json();
            const status = statusResult.status;

            console.log(`[stitchVideoChunks] Job status: ${status} (attempt ${attempts + 1}/${maxAttempts})`);

            if (status === 'COMPLETED') {
                // Job completed, get the output
                const output = statusResult.output;
                if (output && output.video_url) {
                    console.log(`[stitchVideoChunks] Video stitching completed: ${output.video_url}`);
                    return output.video_url;
                } else {
                    // Output should be in R2, construct URL
                    const { getPublicUrl } = await import('./r2-storage');
                    const finalUrl = getPublicUrl(outputKey);
                    console.log(`[stitchVideoChunks] Video stitching completed: ${finalUrl}`);
                    return finalUrl;
                }
            } else if (status === 'FAILED') {
                const error = statusResult.error || 'Unknown error';
                throw new Error(`RunPod job failed: ${error}`);
            }

            attempts++;
        }

        throw new Error('RunPod job timed out');
    } catch (error) {
        console.error('[stitchVideoChunks] Error:', error);
        throw new Error(`Failed to stitch video chunks: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Split an audio file into chunks using RunPod
 * @param audioUrl - R2 URL of the full audio file
 * @param chunkDuration - Duration of each chunk in seconds (default: 10)
 * @returns Array of R2 URLs for each audio chunk
 */
export async function splitAudioWithRunPod(
    audioUrl: string,
    chunkDuration: number = 10
): Promise<string[]> {
    console.log(`[splitAudioWithRunPod] Starting audio splitting process`);
    console.log(`[splitAudioWithRunPod] Configuration check:`, {
        hasApiKey: !!RUNPOD_API_KEY,
        hasEndpointId: !!RUNPOD_ENDPOINT_ID,
        endpointId: RUNPOD_ENDPOINT_ID || 'NOT SET',
        audioUrl,
        chunkDuration,
    });

    if (!RUNPOD_API_KEY) {
        const error = 'RUNPOD_API_KEY is not configured. Please set it in your environment variables.';
        console.error(`[splitAudioWithRunPod] ${error}`);
        throw new Error(error);
    }

    if (!RUNPOD_ENDPOINT_ID) {
        const error = 'RUNPOD_ENDPOINT_ID is not configured. Please set it in your environment variables.';
        console.error(`[splitAudioWithRunPod] ${error}`);
        throw new Error(error);
    }

    try {
        // Extract R2 key from URL
        const extractKey = (url: string): string => {
            try {
                const urlObj = new URL(url);
                return urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;
            } catch {
                return url;
            }
        };

        const audioKey = extractKey(audioUrl);

        // Prepare RunPod job input for audio splitting
        const jobInput = {
            input: {
                mode: 'split_audio', // Tell handler to split audio instead of stitch video
                audio_key: audioKey,
                chunk_duration: chunkDuration,
                r2_account_id: process.env.CLOUDFLARE_R2_ACCOUNT_ID,
                r2_access_key_id: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
                r2_secret_access_key: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
                r2_bucket_name: process.env.CLOUDFLARE_R2_BUCKET_NAME,
                r2_public_url: process.env.CLOUDFLARE_R2_PUBLIC_URL,
            },
        };

        // Submit job to RunPod
        // For RunPod Serverless, the API format is: https://api.runpod.io/v2/{endpoint_id}/run
        const endpointUrl = `https://api.runpod.io/v2/${RUNPOD_ENDPOINT_ID}/run`;
        console.log(`[splitAudioWithRunPod] Submitting job to RunPod endpoint: ${endpointUrl}`);
        
        // First, try to get endpoint status to verify it exists and is accessible
        try {
            const statusUrl = `https://api.runpod.io/v2/${RUNPOD_ENDPOINT_ID}/status`;
            const statusResponse = await fetch(statusUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${RUNPOD_API_KEY}`,
                },
            });
            console.log(`[splitAudioWithRunPod] Endpoint status check: ${statusResponse.status} ${statusResponse.statusText}`);
            if (!statusResponse.ok) {
                const statusText = await statusResponse.text();
                console.error(`[splitAudioWithRunPod] Endpoint status check failed:`, statusText);
            }
        } catch (statusError) {
            console.warn(`[splitAudioWithRunPod] Status check failed (continuing anyway):`, statusError);
        }
        console.log(`[splitAudioWithRunPod] Job input (without secrets):`, {
            mode: jobInput.input.mode,
            audio_key: jobInput.input.audio_key,
            chunk_duration: jobInput.input.chunk_duration,
            has_r2_config: !!(jobInput.input.r2_account_id && jobInput.input.r2_bucket_name),
        });

        const response = await fetch(endpointUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RUNPOD_API_KEY}`,
            },
            body: JSON.stringify(jobInput),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[splitAudioWithRunPod] RunPod API error:`, {
                status: response.status,
                statusText: response.statusText,
                error: errorText,
                endpointUrl,
            });
            throw new Error(`RunPod API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        const jobId = result.id;

        console.log(`[splitAudioWithRunPod] RunPod job submitted: ${jobId}`);

        // Poll for job completion
        const maxAttempts = 60; // 5 minutes max (5 second intervals)
        let attempts = 0;

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

            const statusResponse = await fetch(
                `https://api.runpod.io/v2/${RUNPOD_ENDPOINT_ID}/status/${jobId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${RUNPOD_API_KEY}`,
                    },
                }
            );

            if (!statusResponse.ok) {
                throw new Error(`Failed to check RunPod job status: ${statusResponse.status}`);
            }

            const statusResult = await statusResponse.json();
            const status = statusResult.status;

            console.log(`[splitAudioWithRunPod] Job status: ${status} (attempt ${attempts + 1}/${maxAttempts})`);

            if (status === 'COMPLETED') {
                // Job completed, get the output
                const output = statusResult.output;
                if (output && output.chunk_urls && Array.isArray(output.chunk_urls)) {
                    console.log(`[splitAudioWithRunPod] Audio split into ${output.chunk_urls.length} chunks`);
                    return output.chunk_urls;
                } else {
                    throw new Error('RunPod job completed but no chunk_urls in output');
                }
            } else if (status === 'FAILED') {
                const error = statusResult.error || 'Unknown error';
                throw new Error(`RunPod job failed: ${error}`);
            }

            attempts++;
        }

        throw new Error('RunPod job timed out');
    } catch (error) {
        console.error('[splitAudioWithRunPod] Error:', error);
        throw new Error(`Failed to split audio: ${error instanceof Error ? error.message : String(error)}`);
    }
}

