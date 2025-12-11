import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Handle GET requests (webhook verification or health checks)
export async function GET() {
    return NextResponse.json({ message: 'Resend webhook endpoint is active' }, { status: 200 });
}

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
        // Parse the request body
        let event;
        try {
            event = await request.json();
        } catch (parseError) {
            console.error('Failed to parse webhook request:', parseError);
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }
        
        console.log('Resend webhook event received:', JSON.stringify(event, null, 2));
        
        // Check if this is an email.received event
        if (event.type === 'email.received') {
            const emailData = event.data;
            
            if (!emailData) {
                console.error('No email data in webhook event');
                return NextResponse.json({ error: 'Missing email data' }, { status: 400 });
            }

            // Extract email content - Resend webhook structure may vary
            const from = emailData.from || emailData.from_email || 'Santa <santa@santagram.app>';
            const subject = emailData.subject || 'No Subject';
            const html = emailData.html || emailData.body?.html || emailData.text || '';
            const text = emailData.text || emailData.body?.text || '';

            // Forward the email using the webhook event data
            try {
                await resend.emails.send({
                    from: 'Santa <santa@santagram.app>',
                    to: 'jake005588@gmail.com',
                    subject: `[Forwarded] ${subject}`,
                    html: html || text || 'No content available',
                    text: text || 'No content available',
                    replyTo: from,
                });

                console.log(`Email forwarded to jake005588@gmail.com from webhook event`);
                return NextResponse.json({ message: 'Email forwarded successfully' }, { status: 200 });
            } catch (sendError) {
                console.error('Error sending forwarded email:', sendError);
                return NextResponse.json(
                    { error: 'Failed to send forwarded email', details: sendError instanceof Error ? sendError.message : String(sendError) },
                    { status: 500 }
                );
            }
        }

        // If it's not an email.received event, just acknowledge it
        console.log('Received non-email.received event:', event.type);
        return NextResponse.json({ message: 'Event received' }, { status: 200 });
    } catch (error) {
        console.error('Error processing webhook:', error);
        return NextResponse.json(
            { error: 'Failed to process webhook', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

