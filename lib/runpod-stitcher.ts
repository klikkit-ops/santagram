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
        // Try api.runpod.ai first (some accounts use this domain)
        const endpointUrl = RUNPOD_ENDPOINT_ID
            ? `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}/run`
            : 'https://api.runpod.ai/v2/run';

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

            // Use the same domain that worked for the initial request
            const statusDomain = endpointUrl!.includes('api.runpod.ai') ? 'api.runpod.ai' : 'api.runpod.io';
            const statusResponse = await fetch(
                RUNPOD_ENDPOINT_ID
                    ? `https://${statusDomain}/v2/${RUNPOD_ENDPOINT_ID}/status/${jobId}`
                    : `https://${statusDomain}/v2/status/${jobId}`,
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
 * @param chunkDuration - Duration of each chunk in seconds (default: 25)
 * @returns Array of R2 URLs for each audio chunk
 */
export async function splitAudioWithRunPod(
    audioUrl: string,
    chunkDuration: number = 25
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
        // Try both api.runpod.ai and api.runpod.io (different accounts use different domains)
        // Start with api.runpod.ai as it's more commonly used
        const domains = ['api.runpod.ai', 'api.runpod.io'];
        let endpointUrl: string | null = null;
        let lastError: Error | null = null;

        // Try each domain with the actual request
        for (const domain of domains) {
            const url = `https://${domain}/v2/${RUNPOD_ENDPOINT_ID}/run`;
            console.log(`[splitAudioWithRunPod] Trying domain: ${domain}`);
            
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${RUNPOD_API_KEY}`,
                    },
                    body: JSON.stringify(jobInput),
                });

                if (response.status !== 404) {
                    endpointUrl = url;
                    console.log(`[splitAudioWithRunPod] Domain ${domain} responded (status: ${response.status})`);
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`RunPod API error: ${response.status} ${response.statusText} - ${errorText}`);
                    }
                    
                    // Success - parse and return the result
                    const result = await response.json();
                    const jobId = result.id;
                    console.log(`[splitAudioWithRunPod] RunPod job submitted on ${domain}: ${jobId}`);
                    
                    // Continue with polling using the same domain
                    return await pollJobStatus(jobId, domain);
                } else {
                    console.log(`[splitAudioWithRunPod] Domain ${domain} returned 404, trying next...`);
                    lastError = new Error(`404 Not Found on ${domain}`);
                }
            } catch (error) {
                console.warn(`[splitAudioWithRunPod] Domain ${domain} failed:`, error);
                lastError = error instanceof Error ? error : new Error(String(error));
                continue;
            }
        }

        // If we get here, both domains failed
        throw new Error(`RunPod endpoint not accessible on any domain (tried: ${domains.join(', ')}). Last error: ${lastError?.message || 'Unknown'}`);
    } catch (error) {
        console.error('[splitAudioWithRunPod] Error:', error);
            throw new Error(`Failed to split audio: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

/**
 * Submit a job to RunPod and poll its status until completion
 * @param jobInput - The input payload for the RunPod job
 * @param domain - The RunPod API domain to use (e.g., 'api.runpod.ai')
 * @returns The output of the completed job
 */
async function submitAndPollRunPodJob(jobInput: any, domain: string): Promise<any> {
    const endpointUrl = `https://${domain}/v2/${RUNPOD_ENDPOINT_ID}/run`;
    console.log(`[RunPod] Submitting job to RunPod endpoint: ${endpointUrl}`);
    console.log(`[RunPod] Job input (without secrets):`, {
        mode: jobInput.input.mode,
        audio_key: jobInput.input.audio_key,
        video_chunks: jobInput.input.video_chunks ? jobInput.input.video_chunks.length : 0,
        chunk_duration: jobInput.input.chunk_duration,
        output_key: jobInput.input.output_key,
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
        console.error(`[RunPod] RunPod API error:`, {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
            endpointUrl,
        });
        throw new Error(`RunPod API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    const jobId = result.id;
    console.log(`[RunPod] RunPod job submitted on ${domain}: ${jobId}`);

    // Poll for job completion
    const maxAttempts = 300; // 25 minutes max (5 second intervals) - longer for full pipeline
    let attempts = 0;

    while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

        const statusResponse = await fetch(
            `https://${domain}/v2/${RUNPOD_ENDPOINT_ID}/status/${jobId}`,
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

        console.log(`[RunPod] Job ${jobId} status: ${status} (attempt ${attempts + 1}/${maxAttempts})`);

        if (status === 'COMPLETED') {
            return statusResult.output;
        } else if (status === 'FAILED' || status === 'CANCELED') {
            const error = statusResult.error || 'Unknown error';
            throw new Error(`RunPod job ${jobId} failed: ${error}`);
        }

        attempts++;
    }

    throw new Error(`RunPod job ${jobId} timed out after ${maxAttempts * 5} seconds.`);
}

/**
 * Submit a RunPod job for full pipeline (split, generate, stitch) and return job ID
 * This reduces Vercel API calls from 5+ to 1
 * @param audioUrl - R2 URL of the full audio file
 * @param outputKey - R2 key for the final stitched video
 * @param videoUrl - URL of the hero video (defaults to HERO_VIDEO_URL)
 * @param chunkDuration - Duration of each chunk in seconds (default: 25)
 * @returns RunPod job ID (caller should poll for completion)
 */
export async function submitGenerateAndStitchVideo(
    audioUrl: string,
    outputKey: string,
    videoUrl?: string,
    chunkDuration: number = 25
): Promise<string> {
    console.log(`[generateAndStitchVideo] Starting full pipeline orchestration`);
    console.log(`[generateAndStitchVideo] Configuration check:`, {
        hasApiKey: !!RUNPOD_API_KEY,
        hasEndpointId: !!RUNPOD_ENDPOINT_ID,
        endpointId: RUNPOD_ENDPOINT_ID || 'NOT SET',
        audioUrl,
        outputKey,
        videoUrl: videoUrl || 'default',
        chunkDuration,
    });

    if (!RUNPOD_API_KEY) {
        const error = 'RUNPOD_API_KEY is not configured. Please set it in your environment variables.';
        console.error(`[generateAndStitchVideo] ${error}`);
        throw new Error(error);
    }

    if (!RUNPOD_ENDPOINT_ID) {
        const error = 'RUNPOD_ENDPOINT_ID is not configured. Please set it in your environment variables.';
        console.error(`[generateAndStitchVideo] ${error}`);
        throw new Error(error);
    }

    const replicateApiToken = process.env.REPLICATE_API_TOKEN;
    if (!replicateApiToken) {
        const error = 'REPLICATE_API_TOKEN is not configured. Please set it in your environment variables.';
        console.error(`[generateAndStitchVideo] ${error}`);
        throw new Error(error);
    }

    try {
        const extractKey = (url: string): string => {
            try {
                const urlObj = new URL(url);
                return urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;
            } catch {
                return url;
            }
        };

        const audioKey = extractKey(audioUrl);
        const heroVideoUrl = videoUrl || process.env.HERO_VIDEO_URL || 'https://blob.santagram.app/hero/hero.mp4';

        // Construct webhook URL for RunPod to notify us when job completes
        let baseUrl = 'https://santagram.app';
        if (process.env.VERCEL_URL) {
            baseUrl = `https://${process.env.VERCEL_URL}`;
        } else if (process.env.NEXT_PUBLIC_BASE_URL) {
            baseUrl = process.env.NEXT_PUBLIC_BASE_URL.replace(/^https?:\/\//, 'https://');
        }
        const webhookUrl = `${baseUrl}/api/runpod-webhook`;

        const jobInput = {
            input: {
                mode: 'generate_and_stitch',
                audio_key: audioKey,
                video_url: heroVideoUrl,
                chunk_duration: chunkDuration,
                output_key: outputKey,
                replicate_api_token: replicateApiToken,
                r2_account_id: process.env.CLOUDFLARE_R2_ACCOUNT_ID,
                r2_access_key_id: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
                r2_secret_access_key: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
                r2_bucket_name: process.env.CLOUDFLARE_R2_BUCKET_NAME,
                r2_public_url: process.env.CLOUDFLARE_R2_PUBLIC_URL,
            },
            webhook: webhookUrl, // RunPod will POST to this URL when job completes
        };

        const domains = ['api.runpod.ai', 'api.runpod.io'];
        let lastError: Error | null = null;

        for (const domain of domains) {
            try {
                const endpointUrl = `https://${domain}/v2/${RUNPOD_ENDPOINT_ID}/run`;
                console.log(`[submitGenerateAndStitchVideo] Submitting job to: ${endpointUrl}`);

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
                    throw new Error(`RunPod API error: ${response.status} ${response.statusText} - ${errorText}`);
                }

                const result = await response.json();
                const jobId = result.id;
                console.log(`[submitGenerateAndStitchVideo] Job submitted on ${domain}: ${jobId}`);
                return jobId;
            } catch (error) {
                console.warn(`[submitGenerateAndStitchVideo] Failed on domain ${domain}:`, error);
                lastError = error instanceof Error ? error : new Error(String(error));
            }
        }
        throw new Error(`RunPod endpoint not accessible on any domain (tried: ${domains.join(', ')}). Last error: ${lastError?.message || 'Unknown'}`);

    } catch (error) {
        console.error('[submitGenerateAndStitchVideo] Error:', error);
        throw new Error(`Failed to submit generate and stitch job: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Poll RunPod job status and return final video URL when complete
 * @param jobId - RunPod job ID
 * @returns R2 URL of the final stitched video
 */
export async function pollRunPodJobStatus(jobId: string): Promise<{
    status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    video_url?: string;
    error?: string;
}> {
    if (!RUNPOD_API_KEY || !RUNPOD_ENDPOINT_ID) {
        throw new Error('RunPod API key or Endpoint ID is not configured.');
    }

    const domains = ['api.runpod.ai', 'api.runpod.io'];
    let lastError: Error | null = null;

    for (const domain of domains) {
        try {
            const statusResponse = await fetch(
                `https://${domain}/v2/${RUNPOD_ENDPOINT_ID}/status/${jobId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${RUNPOD_API_KEY}`,
                    },
                }
            );

            if (!statusResponse.ok) {
                if (statusResponse.status === 404) {
                    continue; // Try next domain
                }
                throw new Error(`Failed to check RunPod job status: ${statusResponse.status}`);
            }

            const statusResult = await statusResponse.json();
            const status = statusResult.status;

            if (status === 'COMPLETED') {
                const output = statusResult.output;
                if (output && output.video_url) {
                    return {
                        status: 'COMPLETED',
                        video_url: output.video_url,
                    };
                } else {
                    throw new Error('RunPod job completed but no video_url in output.');
                }
            } else if (status === 'FAILED' || status === 'CANCELED') {
                const error = statusResult.error || 'Unknown error';
                return {
                    status: 'FAILED',
                    error: error,
                };
            } else {
                return {
                    status: 'IN_PROGRESS',
                };
            }
        } catch (error) {
            console.warn(`[pollRunPodJobStatus] Failed on domain ${domain}:`, error);
            lastError = error instanceof Error ? error : new Error(String(error));
        }
    }

    throw new Error(`Failed to poll RunPod job on any domain. Last error: ${lastError?.message || 'Unknown'}`);
}

/**
 * Poll RunPod job status until completion
 */
async function pollJobStatus(jobId: string, domain: string): Promise<string[]> {
    const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
    const RUNPOD_ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID;
    const maxAttempts = 60; // 5 minutes max (5 second intervals)
    let attempts = 0;

    while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

        const statusResponse = await fetch(
            `https://${domain}/v2/${RUNPOD_ENDPOINT_ID}/status/${jobId}`,
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
}

