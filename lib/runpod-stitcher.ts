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
 * Alternative: Use RunPod's serverless API with a custom handler
 * This function can be used if you have a custom RunPod endpoint that handles ffmpeg
 */
export async function stitchVideoChunksWithFFmpeg(
    videoChunks: string[],
    audioUrl: string,
    outputKey: string
): Promise<string> {
    // This would call a RunPod endpoint that runs ffmpeg commands:
    // 1. Download all chunks and audio from R2
    // 2. Concatenate: ffmpeg -i "concat:chunk1.mp4|chunk2.mp4|..." -c copy temp.mp4
    // 3. Merge with audio: ffmpeg -i temp.mp4 -i audio.mp3 -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 final.mp4
    // 4. Upload final.mp4 to R2
    // 5. Return R2 URL

    // For now, use the generic stitchVideoChunks function
    // The actual ffmpeg commands will be handled by the RunPod endpoint
    return stitchVideoChunks(videoChunks, audioUrl, outputKey);
}

