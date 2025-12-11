import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getLipsyncPredictionStatus } from '@/lib/replicate';
import { storeVideo, sendVideoEmail } from '@/lib/video-storage';
import { stripe } from '@/lib/stripe';
import { generateSantaScript } from '@/lib/script-generator';
import { generateSpeech } from '@/lib/elevenlabs';
import { createLipsyncVideoPrediction } from '@/lib/replicate';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('session_id');
        const orderId = searchParams.get('orderId');

        if (!sessionId && !orderId) {
            return NextResponse.json(
                { error: 'Session ID or Order ID is required' },
                { status: 400 }
            );
        }

        // Get order details by session_id or orderId
        let order;
        let fetchError;
        
        if (sessionId) {
            const result = await supabase
                .from('orders')
                .select('*')
                .eq('stripe_session_id', sessionId)
                .single();
            order = result.data;
            fetchError = result.error;
        } else {
            const result = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();
            order = result.data;
            fetchError = result.error;
        }

        if (fetchError || !order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // If video is already completed, return the URL
        if (order.status === 'completed' && order.video_url) {
            return NextResponse.json({
                status: 'completed',
                video_url: order.video_url,
                child_name: order.child_name,
            });
        }

        // If no prediction ID, video hasn't started generating
        if (!order.replicate_prediction_id) {
            // Fallback: If order is paid but video generation hasn't started, trigger it
            // This handles cases where webhook fired but video generation failed, or webhook hasn't fired yet
            if (order.status === 'paid' || (order.status === 'pending' && sessionId)) {
                // If we have sessionId and order is pending, check Stripe session status
                if (order.status === 'pending' && sessionId && stripe) {
                    try {
                        const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
                        if (stripeSession.payment_status === 'paid') {
                            // Payment succeeded but webhook hasn't fired - trigger video generation
                            await supabase
                                .from('orders')
                                .update({ status: 'paid' })
                                .eq('id', order.id);
                            order.status = 'paid';
                        } else {
                            return NextResponse.json({
                                status: 'pending',
                                child_name: order.child_name,
                            });
                        }
                    } catch (stripeError) {
                        console.error('Error checking Stripe session:', stripeError);
                    }
                }

                // If order is paid but no video generation started, trigger it
                if (order.status === 'paid') {
                    try {
                        // Generate script
                        const script = generateSantaScript({
                            childName: order.child_name,
                            childAge: order.child_age,
                            childGender: order.child_gender,
                            achievements: order.personalization?.achievements,
                            interests: order.personalization?.interests,
                            specialMessage: order.personalization?.special_message,
                            messageType: order.message_type,
                        });

                        // Generate audio
                        const audioUrl = await generateSpeech(script);

                        // Start video generation
                        const predictionId = await createLipsyncVideoPrediction(audioUrl);

                        // Update order
                        await supabase
                            .from('orders')
                            .update({
                                status: 'generating',
                                replicate_prediction_id: predictionId,
                                audio_url: audioUrl,
                            })
                            .eq('id', order.id);

                        return NextResponse.json({
                            status: 'generating',
                            child_name: order.child_name,
                        });
                    } catch (genError) {
                        console.error('Failed to trigger video generation:', genError);
                        await supabase
                            .from('orders')
                            .update({ status: 'failed' })
                            .eq('id', order.id);
                        return NextResponse.json({
                            status: 'failed',
                            error: 'Failed to start video generation',
                            child_name: order.child_name,
                        });
                    }
                }
            }

            return NextResponse.json({
                status: order.status || 'pending',
                child_name: order.child_name,
            });
        }

        // Check Replicate prediction status
        const prediction = await getLipsyncPredictionStatus(order.replicate_prediction_id);

        if (prediction.status === 'succeeded' && prediction.output) {
            // Video is ready - store it and send email
            try {
                const finalVideoUrl = await storeVideo(prediction.output, order.id);

                // Send email if we have customer email
                if (order.customer_email) {
                    await sendVideoEmail(
                        order.customer_email,
                        finalVideoUrl,
                        order.child_name
                    );
                }

                // Update order with final video URL
                await supabase
                    .from('orders')
                    .update({
                        status: 'completed',
                        video_url: finalVideoUrl,
                    })
                    .eq('id', order.id);

                return NextResponse.json({
                    status: 'completed',
                    video_url: finalVideoUrl,
                    child_name: order.child_name,
                });
            } catch (storeError) {
                console.error('Failed to store video:', storeError);
                return NextResponse.json({
                    status: 'processing',
                    message: 'Video ready, finalizing storage...',
                });
            }
        }

        if (prediction.status === 'failed') {
            await supabase
                .from('orders')
                .update({ status: 'failed' })
                .eq('id', order.id);

            return NextResponse.json({
                status: 'failed',
                error: prediction.error || 'Video generation failed',
            });
        }

        // Still processing
        return NextResponse.json({
            status: prediction.status === 'starting' ? 'starting' : 'processing',
            child_name: order.child_name,
        });

    } catch (error) {
        console.error('Video status error:', error);
        return NextResponse.json(
            { error: 'Failed to check video status' },
            { status: 500 }
        );
    }
}
