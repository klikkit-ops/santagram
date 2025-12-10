const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY || '';
const HEYGEN_API_URL = 'https://api.heygen.com';

if (!HEYGEN_API_KEY) {
    console.warn('Missing HEYGEN_API_KEY environment variable');
}

// Default Santa avatar and voice - these can be customized
const SANTA_AVATAR_ID = process.env.HEYGEN_SANTA_AVATAR_ID || 'Santa_Claus_Front_public';
const SANTA_VOICE_ID = process.env.HEYGEN_SANTA_VOICE_ID || 'en-US-male-Santa';

interface PersonalizationData {
    childName: string;
    childAge?: number;
    childGender: string;
    achievements?: string;
    interests?: string;
    specialMessage?: string;
    messageType: string;
}

export function generateSantaScript(data: PersonalizationData): string {
    const pronoun = data.childGender === 'girl' ? 'she' : data.childGender === 'boy' ? 'he' : 'they';
    const possessive = data.childGender === 'girl' ? 'her' : data.childGender === 'boy' ? 'his' : 'their';

    let script = `Ho ho ho! Merry Christmas! Hello there, ${data.childName}! `;

    script += `This is Santa Claus calling all the way from the North Pole, and I have a very special message just for you! `;

    // Add achievements section
    if (data.achievements) {
        script += `My elves told me all about your wonderful achievements this year. ${data.achievements} I'm so proud of you! `;
    }

    // Add interests section
    if (data.interests) {
        script += `I also heard that you love ${data.interests}. That's wonderful! `;
    }

    // Message type specific content
    switch (data.messageType) {
        case 'christmas-morning':
            script += `On Christmas morning, make sure to look under the tree for some special surprises! Remember, the magic of Christmas is all about love, family, and spreading joy to others. `;
            break;
        case 'bedtime':
            script += `Now it's time for you to get a good night's sleep! Remember, my reindeer and I will be visiting very soon, and I need you to be in dreamland when I arrive! `;
            break;
        case 'encouragement':
            script += `I want you to know that you're doing an amazing job! Keep being kind, keep working hard, and always believe in yourself. `;
            break;
        default:
            script += `Keep being the wonderful person you are, and remember to spread kindness and joy wherever you go! `;
    }

    // Custom special message
    if (data.specialMessage) {
        script += `${data.specialMessage} `;
    }

    script += `Well, I better get back to preparing for Christmas! The elves are waiting for me in the workshop. `;
    script += `Remember, ${data.childName}, I'm always watching, and I know you're on the nice list! `;
    script += `Merry Christmas! Ho ho ho! See you soon!`;

    return script;
}

export async function createVideo(script: string): Promise<{ video_id: string }> {
    const response = await fetch(`${HEYGEN_API_URL}/v2/video/generate`, {
        method: 'POST',
        headers: {
            'X-Api-Key': HEYGEN_API_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            video_inputs: [
                {
                    character: {
                        type: 'avatar',
                        avatar_id: SANTA_AVATAR_ID,
                        avatar_style: 'normal',
                    },
                    voice: {
                        type: 'text',
                        input_text: script,
                        voice_id: SANTA_VOICE_ID,
                        speed: 0.95, // Slightly slower for Santa's jolly voice
                    },
                    background: {
                        type: 'color',
                        value: '#1a472a', // Christmas green background
                    },
                },
            ],
            dimension: {
                width: 1920,
                height: 1080,
            },
            aspect_ratio: '16:9',
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`HeyGen API error: ${error}`);
    }

    const data = await response.json();
    return { video_id: data.data.video_id };
}

export async function getVideoStatus(videoId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    video_url?: string;
    error?: string;
}> {
    const response = await fetch(`${HEYGEN_API_URL}/v1/video_status.get?video_id=${videoId}`, {
        method: 'GET',
        headers: {
            'X-Api-Key': HEYGEN_API_KEY,
        },
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`HeyGen API error: ${error}`);
    }

    const data = await response.json();

    return {
        status: data.data.status,
        video_url: data.data.video_url,
        error: data.data.error,
    };
}
