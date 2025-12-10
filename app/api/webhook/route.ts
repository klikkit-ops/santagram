import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { generateSantaScript, createVideo } from '@/lib/heygen';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('stripe-signature') || '';

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err) {
            console.error('Webhook signature verification failed:', err);
            return NextResponse.json(
                { error: 'Webhook signature verification failed' },
                { status: 400 }
            );
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;

            // Update order status to paid
            await supabase
                .from('orders')
                .update({ status: 'paid' })
                .eq('stripe_session_id', session.id);

            // Get metadata for video generation
            const metadata = session.metadata;
            if (!metadata) {
                console.error('No metadata found in session');
                return NextResponse.json({ received: true });
            }

            // Generate the Santa script
            const script = generateSantaScript({
                childName: metadata.childName,
                childAge: metadata.childAge ? parseInt(metadata.childAge) : undefined,
                childGender: metadata.childGender,
                achievements: metadata.achievements,
                interests: metadata.interests,
                specialMessage: metadata.specialMessage,
                messageType: metadata.messageType,
            });

            try {
                // Create video with HeyGen
                const { video_id } = await createVideo(script);

                // Update order with video ID and status
                await supabase
                    .from('orders')
                    .update({
                        status: 'generating',
                        heygen_video_id: video_id,
                    })
                    .eq('stripe_session_id', session.id);

            } catch (videoError) {
                console.error('Video creation failed:', videoError);
                await supabase
                    .from('orders')
                    .update({ status: 'failed' })
                    .eq('stripe_session_id', session.id);
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}
