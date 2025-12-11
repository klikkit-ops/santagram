import Replicate from 'replicate';

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

const HERO_VIDEO_URL = 'https://z9igvokaxzvbcuwi.public.blob.vercel-storage.com/hero.mp4';

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
