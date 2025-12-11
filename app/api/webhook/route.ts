import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { generateSantaScript } from '@/lib/script-generator';
import { generateSpeech } from '@/lib/elevenlabs';
import { createLipsyncVideoPrediction } from '@/lib/replicate';
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
                // Step 1: Generate audio with ElevenLabs
                console.log('Generating speech with ElevenLabs...');
                const audioUrl = await generateSpeech(script);

                // Step 2: Start lipsync video generation with Replicate (async)
                console.log('Starting Pixverse lipsync generation...');
                const predictionId = await createLipsyncVideoPrediction(audioUrl, script);

                // Update order with prediction ID and status
                await supabase
                    .from('orders')
                    .update({
                        status: 'generating',
                        replicate_prediction_id: predictionId,
                        audio_url: audioUrl,
                        customer_email: session.customer_details?.email,
                    })
                    .eq('stripe_session_id', session.id);

                console.log('Video generation started, prediction ID:', predictionId);

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
