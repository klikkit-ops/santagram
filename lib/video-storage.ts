import { put } from '@vercel/blob';
import { Resend } from 'resend';

const EMAIL_FROM = process.env.EMAIL_FROM || 'Santa <santa@santagram.app>';

function getResendClient() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        throw new Error('Missing RESEND_API_KEY environment variable');
    }
    return new Resend(apiKey);
}

export async function storeVideo(videoUrl: string, orderId: string): Promise<string> {
    if (!videoUrl || typeof videoUrl !== 'string') {
        throw new Error(`Invalid video URL provided: ${videoUrl}`);
    }
    
    console.log(`[storeVideo] Starting video storage process for order ${orderId}`);
    console.log(`[storeVideo] Video URL from Replicate: ${videoUrl}`);
    
    // Verify the URL is accessible before downloading
    try {
        const headResponse = await fetch(videoUrl, { method: 'HEAD' });
        if (!headResponse.ok) {
            throw new Error(`Video URL not accessible: ${headResponse.status} ${headResponse.statusText}`);
        }
        const contentType = headResponse.headers.get('content-type');
        console.log(`[storeVideo] Video URL verified, content-type: ${contentType}`);
    } catch (error) {
        console.error(`[storeVideo] Error verifying video URL:`, error);
        throw new Error(`Video URL verification failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Download video from Replicate output URL
    console.log(`[storeVideo] Downloading video from Replicate...`);
    const response = await fetch(videoUrl);
    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
    }

    const videoBuffer = await response.arrayBuffer();
    if (videoBuffer.byteLength === 0) {
        throw new Error('Downloaded video is empty');
    }
    console.log(`[storeVideo] Video downloaded successfully, size: ${videoBuffer.byteLength} bytes`);

    // Upload to Vercel Blob for permanent storage
    const blobName = `videos/${orderId}-santa-message.mp4`;
    console.log(`[storeVideo] Uploading video to Vercel Blob: ${blobName}`);
    
    try {
        const blob = await put(blobName, Buffer.from(videoBuffer), {
            access: 'public',
            contentType: 'video/mp4',
        });

        console.log(`[storeVideo] Video stored successfully at: ${blob.url}`);
        return blob.url;
    } catch (blobError) {
        console.error(`[storeVideo] Error uploading to Vercel Blob:`, blobError);
        throw new Error(`Failed to upload video to Vercel Blob: ${blobError instanceof Error ? blobError.message : String(blobError)}`);
    }
}

export async function sendVideoEmail(
    email: string,
    videoUrl: string,
    childName: string
): Promise<void> {
    console.log(`Sending video email to: ${email}`);
    
    const resend = getResendClient();
    const result = await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: `🎅 Santa's Special Message for ${childName} is Ready!`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #1a472a; font-family: Arial, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #0d2818; border-radius: 16px; overflow: hidden;">
                    <tr>
                        <td style="padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffd700; font-size: 32px; margin: 0 0 20px 0;">
                                🎅 Ho Ho Ho! 🎄
                            </h1>
                            <p style="color: #ffffff; font-size: 18px; line-height: 1.6; margin: 0 0 30px 0;">
                                Santa has prepared a magical personalized video message just for <strong style="color: #ffd700;">${childName}</strong>!
                            </p>
                            
                            <a href="${videoUrl}" 
                               style="display: inline-block; background: linear-gradient(135deg, #c41e3a 0%, #8b0000 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 15px rgba(196, 30, 58, 0.4);">
                                🎁 Download Your Video
                            </a>
                            
                            <p style="color: #a0a0a0; font-size: 14px; margin: 30px 0 0 0;">
                                This magical message was created especially for ${childName}.<br>
                                Merry Christmas from Santa and all the elves! ✨
                            </p>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `,
    });
    
    if (result.error) {
        console.error('Resend API error:', result.error);
        throw new Error(`Failed to send email: ${result.error.message || 'Unknown error'}`);
    }
    
    console.log(`Email sent successfully. Email ID: ${result.data?.id || 'unknown'}`);
}
