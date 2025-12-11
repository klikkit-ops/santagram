import { put } from '@vercel/blob';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_VOICE_ID = 'MDLAMJ0jxkpYkjXbmG4t';

if (!ELEVENLABS_API_KEY) {
    console.warn('Missing ELEVENLABS_API_KEY environment variable');
}

export async function generateSpeech(script: string): Promise<string> {
    // Generate audio from ElevenLabs
    const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
        {
            method: 'POST',
            headers: {
                'xi-api-key': ELEVENLABS_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: script,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                    speed: 0.75, // Set speech speed to 0.75 (slower, more natural pace)
                },
            }),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`ElevenLabs API error: ${error}`);
    }

    // Get audio as buffer
    const audioBuffer = await response.arrayBuffer();

    // Upload to Vercel Blob for Replicate to access
    const blob = await put(`audio/${Date.now()}-santa-speech.mp3`, Buffer.from(audioBuffer), {
        access: 'public',
        contentType: 'audio/mpeg',
    });

    console.log('Audio uploaded to:', blob.url);

    // Verify the audio URL is accessible (with retry)
    let accessible = false;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (!accessible && attempts < maxAttempts) {
        try {
            // Small delay to ensure CDN propagation
            if (attempts > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            }
            
            const headResponse = await fetch(blob.url, { method: 'HEAD' });
            if (headResponse.ok) {
                accessible = true;
                console.log(`Audio URL verified after ${attempts + 1} attempt(s)`);
            } else {
                console.warn(`Audio URL not accessible (status ${headResponse.status}), attempt ${attempts + 1}/${maxAttempts}`);
            }
        } catch (error) {
            console.warn(`Error verifying audio URL (attempt ${attempts + 1}/${maxAttempts}):`, error);
        }
        attempts++;
    }

    if (!accessible) {
        throw new Error(`Audio URL is not accessible after ${maxAttempts} attempts: ${blob.url}`);
    }

    return blob.url;
}
