import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Webhook endpoint to forward incoming emails received by Resend to jake005588@gmail.com
 * 
 * Note: Resend's email receiving feature may not be available in all plans.
 * For now, all outgoing emails are automatically BCC'd to jake005588@gmail.com
 * (see lib/video-storage.ts).
 * 
 * To set this up (if Resend supports receiving emails):
 * 1. Go to Resend Dashboard > Settings > Webhooks
 * 2. Add a webhook URL: https://your-domain.com/api/resend-webhook
 * 3. Select the event: email.received
 */
export async function POST(request: NextRequest) {
    try {
        const event = await request.json();
        
        // Check if this is an email.received event
        if (event.type === 'email.received') {
            const emailData = event.data;
            
            if (!emailData) {
                console.error('No email data in webhook event');
                return NextResponse.json({ error: 'Missing email data' }, { status: 400 });
            }

            // Forward the email using the webhook event data
            await resend.emails.send({
                from: emailData.from || 'Santa <santa@santagram.app>',
                to: 'jake005588@gmail.com',
                subject: `[Forwarded] ${emailData.subject || 'No Subject'}`,
                html: emailData.html || emailData.text || emailData.body?.html || '',
                text: emailData.text || emailData.body?.text || '',
                replyTo: emailData.from,
            });

            console.log(`Email forwarded to jake005588@gmail.com from webhook event`);
            return NextResponse.json({ message: 'Email forwarded successfully' });
        }

        // If it's not an email.received event, just acknowledge it
        return NextResponse.json({ message: 'Event received' });
    } catch (error) {
        console.error('Error forwarding email:', error);
        return NextResponse.json(
            { error: 'Failed to forward email', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

