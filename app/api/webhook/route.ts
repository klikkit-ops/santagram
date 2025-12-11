import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { generateSantaScript } from '@/lib/script-generator';
import { generateSpeech } from '@/lib/elevenlabs';
import { getAudioDuration } from '@/lib/audio-utils';
import { createLipsyncVideoPrediction } from '@/lib/replicate';
import { generateAndStitchVideo } from '@/lib/runpod-stitcher';
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
                        const orderId = session.metadata?.orderId || `order_${Date.now()}`;
                        const outputKey = `videos/${orderId}-santa-message.mp4`;
                        
                        console.log('[webhook] Starting RunPod orchestration (split + generate + stitch)...');
                        
                        // Update order status to indicate processing
                        await supabase
                            .from('orders')
                            .update({
                                status: 'generating',
                                audio_url: audioUrl,
                                customer_email: session.customer_details?.email,
                                stitching_status: 'processing', // RunPod handles everything
                            })
                            .eq('stripe_session_id', session.id);

                        // Start RunPod job (this will handle splitting, Replicate calls, and stitching)
                        // Note: This is async - RunPod will process in background
                        // We'll poll for completion via video-status endpoint
                        generateAndStitchVideo(audioUrl, outputKey, undefined, MAX_CHUNK_DURATION)
                            .then(async (finalVideoUrl) => {
                                console.log(`[webhook] RunPod orchestration completed: ${finalVideoUrl}`);
                                
                                // Get order to send email
                                const { data: order } = await supabase
                                    .from('orders')
                                    .select('*')
                                    .eq('stripe_session_id', session.id)
                                    .single();
                                
                                if (order) {
                                    const recipientEmail = order.customer_email || order.email;
                                    if (recipientEmail) {
                                        try {
                                            const { sendVideoEmail } = await import('@/lib/video-storage');
                                            await sendVideoEmail(
                                                recipientEmail,
                                                finalVideoUrl,
                                                order.child_name,
                                                order.id
                                            );
                                            console.log(`[webhook] Video email sent to ${recipientEmail}`);
                                        } catch (emailError) {
                                            console.error('[webhook] Failed to send video email:', emailError);
                                        }
                                    }
                                    
                                    // Update order with final video
                                    await supabase
                                        .from('orders')
                                        .update({
                                            status: 'completed',
                                            video_url: finalVideoUrl,
                                            stitching_status: 'completed',
                                        })
                                        .eq('id', order.id);
                                }
                            })
                            .catch(async (error) => {
                                console.error('[webhook] RunPod orchestration failed:', error);
                                await supabase
                                    .from('orders')
                                    .update({
                                        status: 'failed',
                                        stitching_status: 'failed',
                                    })
                                    .eq('stripe_session_id', session.id);
                            });

                        console.log('[webhook] RunPod orchestration started (processing in background)');
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
