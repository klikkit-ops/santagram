import Replicate from 'replicate';

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

// TODO: Update HERO_VIDEO_URL to use R2 once hero.mp4 is migrated
const HERO_VIDEO_URL = process.env.HERO_VIDEO_URL || 'https://z9igvokaxzvbcuwi.public.blob.vercel-storage.com/hero.mp4';

export async function createLipsyncVideo(audioUrl: string): Promise<string> {
    // Run the Kling lip-sync model
    const output = await replicate.run(
        'kwaivgi/kling-lip-sync',
        {
            input: {
                video_url: HERO_VIDEO_URL,
                audio_file: audioUrl, // Use audio_file, not audio_url
            },
        }
    );

    // The output should be a URL to the generated video
    if (!output || typeof output !== 'string') {
        throw new Error('Unexpected output from Kling lip-sync model');
    }

    return output;
}

// Async version that returns prediction ID for polling
export async function createLipsyncVideoPrediction(audioUrl: string, script?: string): Promise<string> {
    // Verify audio URL is accessible before creating prediction
    try {
        const headResponse = await fetch(audioUrl, { method: 'HEAD' });
        if (!headResponse.ok) {
            throw new Error(`Audio URL not accessible: ${headResponse.status} ${headResponse.statusText}`);
        }
        console.log('Verified audio URL is accessible before Replicate call:', audioUrl);
    } catch (error) {
        console.error('Error verifying audio URL:', error);
        throw new Error(`Audio URL verification failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    // According to Replicate API docs: use audio_file (not audio_url)
    // audio_file can accept a URL string
    const input: {
        video_url: string;
        audio_file: string;
        text?: string;
    } = {
        video_url: HERO_VIDEO_URL,
        audio_file: audioUrl,
    };

    // Note: According to API docs, provide either audio_file OR text, not both
    // We'll use audio_file as primary, and only include text if audio fails
    // But for now, let's not include text when we have audio_file

    console.log('Creating Replicate prediction with audio URL:', audioUrl);
    
    const prediction = await replicate.predictions.create({
        model: 'kwaivgi/kling-lip-sync',
        input,
    });

    console.log('Replicate prediction created:', prediction.id);
    return prediction.id;
}

export async function getLipsyncPredictionStatus(predictionId: string): Promise<{
    status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
    output?: string;
    error?: string;
}> {
    const prediction = await replicate.predictions.get(predictionId);
    
    console.log(`Replicate prediction status for ${predictionId}:`, {
        status: prediction.status,
        output: prediction.output,
        outputType: typeof prediction.output,
        isArray: Array.isArray(prediction.output),
        error: prediction.error,
    });

    // Map any unexpected status to a known status
    let status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
    switch (prediction.status) {
        case 'starting':
            status = 'starting';
            break;
        case 'processing':
            status = 'processing';
            break;
        case 'succeeded':
            status = 'succeeded';
            break;
        case 'failed':
            status = 'failed';
            break;
        case 'canceled':
            status = 'canceled';
            break;
        default:
            status = 'failed';
    }

    // Handle output - it might be a string, array, or other format
    let output: string | undefined;
    if (prediction.output) {
        if (typeof prediction.output === 'string') {
            output = prediction.output;
        } else if (Array.isArray(prediction.output) && prediction.output.length > 0) {
            // If output is an array, take the first element
            output = typeof prediction.output[0] === 'string' ? prediction.output[0] : String(prediction.output[0]);
            console.log(`Replicate output was array, using first element: ${output}`);
        } else {
            // Try to convert to string
            output = String(prediction.output);
            console.log(`Replicate output converted to string: ${output}`);
        }
    }

    return {
        status,
        output,
        error: prediction.error as string | undefined,
    };
}

/**
 * Create lipsync video predictions for multiple audio chunks in parallel
 * @param audioChunks - Array of audio chunk URLs
 * @returns Array of prediction IDs
 */
export async function createLipsyncVideoChunks(audioChunks: string[]): Promise<string[]> {
    console.log(`Creating ${audioChunks.length} video predictions with rate limiting...`);

    // Verify all audio URLs are accessible
    for (const audioUrl of audioChunks) {
        try {
            const headResponse = await fetch(audioUrl, { method: 'HEAD' });
            if (!headResponse.ok) {
                throw new Error(`Audio URL not accessible: ${audioUrl} - ${headResponse.status}`);
            }
        } catch (error) {
            console.error('Error verifying audio URL:', audioUrl, error);
            throw new Error(`Audio URL verification failed: ${audioUrl}`);
        }
    }

    // Replicate rate limit: 60 requests/minute with burst of 5
    // Create predictions in batches of 5 to respect burst limit
    const BATCH_SIZE = 5;
    const predictionIds: string[] = [];

    for (let i = 0; i < audioChunks.length; i += BATCH_SIZE) {
        const batch = audioChunks.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(audioChunks.length / BATCH_SIZE);
        
        console.log(`Creating batch ${batchNumber}/${totalBatches} (${batch.length} predictions)...`);

        const batchPromises = batch.map((audioUrl, batchIndex) => {
            const globalIndex = i + batchIndex + 1;
            console.log(`Creating prediction ${globalIndex}/${audioChunks.length} for audio: ${audioUrl}`);
            
            const input: {
                video_url: string;
                audio_file: string;
            } = {
                video_url: HERO_VIDEO_URL,
                audio_file: audioUrl,
            };

            return replicate.predictions.create({
                model: 'kwaivgi/kling-lip-sync',
                input,
            }).catch(async (error) => {
                // Handle rate limiting with retry
                if (error.status === 429) {
                    const retryAfter = error.response?.headers?.get('retry-after') || '5';
                    const waitTime = parseInt(retryAfter, 10) * 1000;
                    console.log(`Rate limited, waiting ${waitTime}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    // Retry once
                    return replicate.predictions.create({
                        model: 'kwaivgi/kling-lip-sync',
                        input,
                    });
                }
                throw error;
            });
        });

        try {
            const batchPredictions = await Promise.all(batchPromises);
            const batchIds = batchPredictions.map(p => p.id);
            predictionIds.push(...batchIds);
            console.log(`Batch ${batchNumber} completed:`, batchIds);

            // Wait a bit between batches to avoid rate limiting (except for the last batch)
            if (i + BATCH_SIZE < audioChunks.length) {
                const waitTime = 2000; // 2 seconds between batches
                console.log(`Waiting ${waitTime}ms before next batch...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        } catch (error) {
            console.error(`Error creating batch ${batchNumber}:`, error);
            throw new Error(`Failed to create video predictions in batch ${batchNumber}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    console.log(`Created ${predictionIds.length} predictions total:`, predictionIds);
    return predictionIds;
}

/**
 * Get status of multiple lipsync predictions
 * @param predictionIds - Array of prediction IDs
 * @returns Array of prediction statuses
 */
export async function getLipsyncPredictionStatuses(
    predictionIds: string[]
): Promise<Array<{
    id: string;
    status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
    output?: string;
    error?: string;
}>> {
    const statusPromises = predictionIds.map(async (id) => {
        const status = await getLipsyncPredictionStatus(id);
        return {
            id,
            ...status,
        };
    });

    return Promise.all(statusPromises);
}

/**
 * Wait for all predictions to complete
 * @param predictionIds - Array of prediction IDs
 * @param pollInterval - Polling interval in milliseconds (default: 5000)
 * @param maxWaitTime - Maximum wait time in milliseconds (default: 600000 = 10 minutes)
 * @returns Array of completed prediction outputs
 */
export async function waitForAllPredictions(
    predictionIds: string[],
    pollInterval: number = 5000,
    maxWaitTime: number = 600000
): Promise<string[]> {
    const startTime = Date.now();
    const completed: Map<string, string> = new Map();

    console.log(`Waiting for ${predictionIds.length} predictions to complete...`);

    while (completed.size < predictionIds.length) {
        if (Date.now() - startTime > maxWaitTime) {
            const remaining = predictionIds.filter(id => !completed.has(id));
            throw new Error(`Timeout waiting for predictions: ${remaining.join(', ')}`);
        }

        const statuses = await getLipsyncPredictionStatuses(predictionIds);

        for (const status of statuses) {
            if (status.status === 'succeeded' && status.output && !completed.has(status.id)) {
                completed.set(status.id, status.output);
                console.log(`Prediction ${status.id} completed: ${status.output}`);
            } else if (status.status === 'failed') {
                throw new Error(`Prediction ${status.id} failed: ${status.error || 'Unknown error'}`);
            } else if (status.status === 'canceled') {
                throw new Error(`Prediction ${status.id} was canceled`);
            }
        }

        if (completed.size < predictionIds.length) {
            const remaining = predictionIds.length - completed.size;
            console.log(`${remaining} prediction(s) still processing...`);
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
    }

    // Return outputs in the same order as input prediction IDs
    return predictionIds.map(id => {
        const output = completed.get(id);
        if (!output) {
            throw new Error(`No output for prediction ${id}`);
        }
        return output;
    });
}
