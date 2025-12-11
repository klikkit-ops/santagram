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
 * SETUP INSTRUCTIONS:
 * 1. Go to Resend Dashboard > Domains > Add Domain (if not already added)
 * 2. Configure DNS records (MX, SPF, DKIM, DMARC) as shown in Resend dashboard
 * 3. Go to Resend Dashboard > Receiving > Add Inbound Domain
 * 4. Set up webhook: Go to Resend Dashboard > Webhooks > Add Webhook
 * 5. Webhook URL: https://santagram.app/api/resend-webhook
 * 6. Select event: email.received
 * 
 * The webhook will forward all emails sent to *@santagram.app to jake005588@gmail.com
 */
export async function POST(request: NextRequest) {
    try {
        // Parse the request body
        let event;
        try {
            event = await request.json();
        } catch (parseError) {
            console.error('[resend-webhook] Failed to parse webhook request:', parseError);
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }
        
        console.log('[resend-webhook] Event received:', JSON.stringify(event, null, 2));
        
        // Resend receiving webhook format can vary, handle multiple possible structures
        let emailData = null;
        let eventType = null;
        
        // Check different possible event structures
        if (event.type === 'email.received' || event.event === 'email.received') {
            eventType = 'email.received';
            emailData = event.data || event.payload || event;
        } else if (event.data && (event.data.type === 'email.received' || event.data.event === 'email.received')) {
            eventType = 'email.received';
            emailData = event.data.data || event.data.payload || event.data;
        } else if (event.record_type === 'inbound') {
            // Alternative format for Resend receiving
            eventType = 'email.received';
            emailData = event;
        }
        
        if (eventType === 'email.received' && emailData) {
            // Extract email content - handle various possible field names
            const from = emailData.from || emailData.from_email || emailData.from_address || 
                        (emailData.headers && emailData.headers.from) || 
                        emailData.envelope?.from || 'Unknown <unknown@santagram.app>';
            
            const to = emailData.to || emailData.to_email || emailData.to_address || 
                      (emailData.headers && emailData.headers.to) || 
                      emailData.envelope?.to || 'Unknown';
            
            const subject = emailData.subject || 
                           (emailData.headers && emailData.headers.subject) || 
                           'No Subject';
            
            // Extract body content
            const html = emailData.html || 
                       emailData.body?.html || 
                       emailData.body_html || 
                       emailData['body-html'] || 
                       '';
            
            const text = emailData.text || 
                        emailData.body?.text || 
                        emailData.body_text || 
                        emailData['body-plain'] || 
                        emailData.plain || 
                        '';

            console.log(`[resend-webhook] Forwarding email from ${from} to ${to}, subject: ${subject}`);

            // Forward the email
            try {
                await resend.emails.send({
                    from: 'Santa <santa@santagram.app>',
                    to: 'jake005588@gmail.com',
                    subject: `[Forwarded from ${to}] ${subject}`,
                    html: html || (text ? `<pre>${text}</pre>` : 'No content available'),
                    text: text || 'No content available',
                    replyTo: from,
                    headers: {
                        'X-Original-From': from,
                        'X-Original-To': Array.isArray(to) ? to.join(', ') : to,
                    },
                });

                console.log(`[resend-webhook] Email forwarded successfully to jake005588@gmail.com`);
                return NextResponse.json({ message: 'Email forwarded successfully' }, { status: 200 });
            } catch (sendError) {
                console.error('[resend-webhook] Error sending forwarded email:', sendError);
                return NextResponse.json(
                    { error: 'Failed to send forwarded email', details: sendError instanceof Error ? sendError.message : String(sendError) },
                    { status: 500 }
                );
            }
        }

        // If it's not an email.received event, log it and acknowledge
        console.log('[resend-webhook] Received non-email.received event:', event.type || event.event || 'unknown');
        return NextResponse.json({ message: 'Event received (not an email.received event)' }, { status: 200 });
    } catch (error) {
        console.error('[resend-webhook] Error processing webhook:', error);
        return NextResponse.json(
            { error: 'Failed to process webhook', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
