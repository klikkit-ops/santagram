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

    return blob.url;
}
