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
                audio_url: audioUrl,
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

    const input: {
        video_url: string;
        audio_url: string;
        text?: string;
    } = {
        video_url: HERO_VIDEO_URL,
        audio_url: audioUrl,
    };

    // Add text as fallback if provided (some models require it)
    if (script) {
        input.text = script;
    }

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

    return {
        status,
        output: prediction.output as string | undefined,
        error: prediction.error as string | undefined,
    };
}
