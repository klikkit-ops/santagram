import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { generateSantaScript } from '@/lib/script-generator';
import { generateSpeech } from '@/lib/elevenlabs';
import { getAudioDuration } from '@/lib/audio-utils';
import { createLipsyncVideoPrediction } from '@/lib/replicate';
import { submitGenerateAndStitchVideo } from '@/lib/runpod-stitcher';
import Stripe from 'stripe';

const MAX_CHUNK_DURATION = 25; // seconds - Replicate kling-lip-sync model can handle up to ~29 seconds

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

                // Step 2: Check audio duration to determine if chunking is needed
                const audioDuration = await getAudioDuration(audioUrl);
                console.log(`Audio duration: ${audioDuration} seconds`);

                if (audioDuration <= MAX_CHUNK_DURATION) {
                    // Short audio - use single video generation
                    console.log('Audio is short, using single video generation');
                    const predictionId = await createLipsyncVideoPrediction(audioUrl, script);

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
                } else {
                    // Long audio - use RunPod orchestration (split, generate, stitch in one call)
                    console.log(`Audio is long (${audioDuration}s), using RunPod orchestration`);
                    
                    try {
                        // Get order ID first
                        const { data: existingOrder } = await supabase
                            .from('orders')
                            .select('id')
                            .eq('stripe_session_id', session.id)
                            .single();
                        
                        const orderId = existingOrder?.id || `order_${Date.now()}`;
                        const outputKey = `videos/${orderId}-santa-message.mp4`;
                        
                        console.log('[webhook] Starting RunPod orchestration (split + generate + stitch)...');
                        
                        // Submit RunPod job and get job ID
                        const runpodJobId = await submitGenerateAndStitchVideo(audioUrl, outputKey, undefined, MAX_CHUNK_DURATION);
                        console.log(`[webhook] RunPod job submitted: ${runpodJobId}`);
                        
                        // Update order with job ID and status
                        await supabase
                            .from('orders')
                            .update({
                                status: 'generating',
                                audio_url: audioUrl,
                                customer_email: session.customer_details?.email,
                                stitching_status: 'processing', // RunPod handles everything
                                // Store RunPod job ID in replicate_prediction_id field (reusing existing field)
                                // Or we could add a new field, but this works for now
                                replicate_prediction_id: `runpod:${runpodJobId}`,
                            })
                            .eq('stripe_session_id', session.id);

                        console.log('[webhook] RunPod orchestration job started, will be polled via video-status endpoint');
                    } catch (orchestrationError) {
                        console.error('[webhook] Error starting RunPod orchestration:', orchestrationError);
                        throw orchestrationError;
                    }
                }

            } catch (videoError) {
                console.error('[webhook] Video creation failed:', videoError);
                console.error('[webhook] Video error details:', {
                    message: videoError instanceof Error ? videoError.message : String(videoError),
                    stack: videoError instanceof Error ? videoError.stack : undefined,
                    sessionId: session.id,
                });
                await supabase
                    .from('orders')
                    .update({ 
                        status: 'failed',
                        // Store error message for debugging
                        // Note: You may need to add an error_message column to your orders table
                    })
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
