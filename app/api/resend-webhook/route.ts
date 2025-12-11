import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Webhook endpoint to forward incoming emails received by Resend to jake005588@gmail.com
 * 
 * To set this up:
 * 1. Go to Resend Dashboard > Settings > Webhooks
 * 2. Add a webhook URL: https://your-domain.com/api/resend-webhook
 * 3. Select the event: email.received
 */
export async function POST(request: NextRequest) {
    try {
        const event = await request.json();
        
        // Check if this is an email.received event
        if (event.type === 'email.received') {
            const emailId = event.data?.email_id;
            
            if (!emailId) {
                console.error('No email_id in webhook event');
                return NextResponse.json({ error: 'Missing email_id' }, { status: 400 });
            }

            // Retrieve the full email content from Resend
            const email = await resend.emails.get(emailId);
            
            if (!email) {
                console.error('Could not retrieve email:', emailId);
                return NextResponse.json({ error: 'Email not found' }, { status: 404 });
            }

            // Forward the email to jake005588@gmail.com
            await resend.emails.send({
                from: email.from || 'Santa <santa@santagram.app>',
                to: 'jake005588@gmail.com',
                subject: `[Forwarded] ${email.subject || 'No Subject'}`,
                html: email.html || email.text || '',
                text: email.text || '',
                reply_to: email.from,
            });

            console.log(`Email ${emailId} forwarded to jake005588@gmail.com`);
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

