import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getLipsyncPredictionStatus, getLipsyncPredictionStatuses, waitForAllPredictions } from '@/lib/replicate';
import { storeVideo, sendVideoEmail } from '@/lib/video-storage';
import { stripe } from '@/lib/stripe';
import { generateSantaScript } from '@/lib/script-generator';
import { generateSpeech } from '@/lib/elevenlabs';
import { createLipsyncVideoPrediction } from '@/lib/replicate';
import { getAudioDuration } from '@/lib/audio-utils';
import { stitchVideoChunks, pollRunPodJobStatus, submitGenerateAndStitchVideo } from '@/lib/runpod-stitcher';

const MAX_CHUNK_DURATION = 25; // seconds - Replicate kling-lip-sync model can handle up to ~29 seconds

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

        // Get currency and price from Stripe session if available
        let currency = 'USD';
        let price = 3.99; // Default fallback
        
        if (sessionId && stripe) {
            try {
                const stripeSession = await stripe.checkout.sessions.retrieve(sessionId, {
                    expand: ['line_items'],
                });
                
                // Get currency from session
                if (stripeSession.currency) {
                    currency = stripeSession.currency.toUpperCase();
                }
                
                // Get price from line items
                if (stripeSession.line_items?.data && stripeSession.line_items.data.length > 0) {
                    const lineItem = stripeSession.line_items.data[0];
                    if (lineItem.price) {
                        // Convert from cents to dollars
                        price = lineItem.price.unit_amount ? lineItem.price.unit_amount / 100 : price;
                    }
                } else if (stripeSession.amount_total) {
                    // Fallback to total amount
                    price = stripeSession.amount_total / 100;
                }
            } catch (stripeError) {
                console.error('Error retrieving Stripe session for currency/price:', stripeError);
            }
        }

        // If video is already completed, return the URL
        if (order.status === 'completed' && order.video_url) {
            return NextResponse.json({
                status: 'completed',
                video_url: order.video_url,
                child_name: order.child_name,
                currency,
                price,
            });
        }

        // Check if this is a RunPod orchestration job (stored as "runpod:jobId" in replicate_prediction_id)
        if (order.replicate_prediction_id && order.replicate_prediction_id.startsWith('runpod:')) {
            const runpodJobId = order.replicate_prediction_id.replace('runpod:', '');
            
            // With webhooks, we don't need to poll constantly
            // Only check if order is still in generating status (webhook might not have fired yet)
            // This is a lightweight check, not constant polling
            if (order.status === 'generating' || order.stitching_status === 'processing') {
                try {
                    // Quick status check (only if still processing)
                    const jobStatus = await pollRunPodJobStatus(runpodJobId);
                    
                    if (jobStatus.status === 'COMPLETED' && jobStatus.video_url) {
                        // Job completed - update order and send email
                        const recipientEmail = order.customer_email || order.email;
                        if (recipientEmail) {
                            try {
                                await sendVideoEmail(
                                    recipientEmail,
                                    jobStatus.video_url,
                                    order.child_name,
                                    order.id
                                );
                                console.log(`[video-status] Video email sent to ${recipientEmail}`);
                            } catch (emailError) {
                                console.error('[video-status] Failed to send video email:', emailError);
                            }
                        }
                        
                        await supabase
                            .from('orders')
                            .update({
                                status: 'completed',
                                video_url: jobStatus.video_url,
                                stitching_status: 'completed',
                            })
                            .eq('id', order.id);
                        
                        return NextResponse.json({
                            status: 'completed',
                            video_url: jobStatus.video_url,
                            child_name: order.child_name,
                            currency,
                            price,
                        });
                    } else if (jobStatus.status === 'FAILED') {
                        await supabase
                            .from('orders')
                            .update({
                                status: 'failed',
                                stitching_status: 'failed',
                            })
                            .eq('id', order.id);
                        
                        return NextResponse.json({
                            status: 'failed',
                            error: jobStatus.error || 'RunPod job failed',
                            child_name: order.child_name,
                        });
                    }
                } catch (error) {
                    // If polling fails, just return processing status
                    // Webhook will handle completion
                    console.log('[video-status] Status check failed, relying on webhook:', error);
                }
            }
            
            // Return current status (webhook will update it when ready)
            return NextResponse.json({
                status: order.status === 'completed' ? 'completed' : 'processing',
                message: order.status === 'completed' 
                    ? 'Video generation completed' 
                    : 'Generating video (split, generate, stitch)...',
                child_name: order.child_name,
                video_url: order.video_url || undefined,
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
                                currency,
                                price,
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

                        // Check audio duration
                        const audioDuration = await getAudioDuration(audioUrl);

                        if (audioDuration <= MAX_CHUNK_DURATION) {
                            // Short audio - single video
                            const predictionId = await createLipsyncVideoPrediction(audioUrl, script);

                            await supabase
                                .from('orders')
                                .update({
                                    status: 'generating',
                                    replicate_prediction_id: predictionId,
                                    audio_url: audioUrl,
                                })
                                .eq('id', order.id);
                        } else {
                            // Long audio - use RunPod orchestration
                            const outputKey = `videos/${order.id}-santa-message.mp4`;
                            const runpodJobId = await submitGenerateAndStitchVideo(audioUrl, outputKey, undefined, MAX_CHUNK_DURATION);
                            
                            await supabase
                                .from('orders')
                                .update({
                                    status: 'generating',
                                    audio_url: audioUrl,
                                    stitching_status: 'processing',
                                    replicate_prediction_id: `runpod:${runpodJobId}`,
                                })
                                .eq('id', order.id);
                        }

                        return NextResponse.json({
                            status: 'generating',
                            child_name: order.child_name,
                            currency,
                            price,
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

        // Check if this is chunked generation or single video
        const isChunked = order.video_chunks && Array.isArray(order.video_chunks) && order.video_chunks.length > 0;

        if (isChunked) {
            // Handle chunked video generation
            const predictionIds = order.video_chunks as string[];
            console.log(`[video-status] Checking ${predictionIds.length} chunk predictions for order ${order.id}`);
            const statuses = await getLipsyncPredictionStatuses(predictionIds);

            // Log status of each prediction
            console.log(`[video-status] Prediction statuses:`, statuses.map(s => ({
                id: s.id.substring(0, 8) + '...',
                status: s.status,
                hasOutput: !!s.output,
                outputPreview: s.output ? s.output.substring(0, 50) + '...' : 'none'
            })));

            // Check if any failed
            const failed = statuses.find(s => s.status === 'failed');
            if (failed) {
                console.error(`[video-status] Prediction failed:`, failed);
                await supabase
                    .from('orders')
                    .update({ status: 'failed' })
                    .eq('id', order.id);
                return NextResponse.json({
                    status: 'failed',
                    error: failed.error || 'Video generation failed',
                });
            }

            // Check if all succeeded
            const allSucceeded = statuses.every(s => s.status === 'succeeded' && s.output);
            console.log(`[video-status] All succeeded: ${allSucceeded}, stitching_status: ${order.stitching_status}`);
            
            if (allSucceeded) {
                const videoChunkUrls = statuses.map(s => s.output!).filter(Boolean);

                // Check stitching status
                if (order.stitching_status === 'completed' && order.video_url) {
                    // Already stitched and stored
                    return NextResponse.json({
                        status: 'completed',
                        video_url: order.video_url,
                        child_name: order.child_name,
                    });
                }

                // Start stitching if not already started
                if (order.stitching_status !== 'processing' && order.stitching_status !== 'completed') {
                    console.log(`[video-status] Starting stitching for order ${order.id} with ${videoChunkUrls.length} chunks`);
                    try {
                        await supabase
                            .from('orders')
                            .update({ stitching_status: 'processing' })
                            .eq('id', order.id);

                        // Stitch videos together
                        const outputKey = `videos/${order.id}-santa-message.mp4`;
                        console.log(`[video-status] Calling stitchVideoChunks with:`, {
                            chunkCount: videoChunkUrls.length,
                            audioUrl: order.audio_url,
                            outputKey
                        });
                        const finalVideoUrl = await stitchVideoChunks(videoChunkUrls, order.audio_url, outputKey);
                        console.log(`[video-status] Stitching completed, final video URL: ${finalVideoUrl}`);

                        // Store video URL and send email
                        const recipientEmail = order.customer_email || order.email;
                        if (recipientEmail) {
                            try {
                                await sendVideoEmail(
                                    recipientEmail,
                                    finalVideoUrl,
                                    order.child_name,
                                    order.id
                                );
                                console.log(`Video email sent to ${recipientEmail}`);
                            } catch (emailError) {
                                console.error('Failed to send video email:', emailError);
                            }
                        }

                        await supabase
                            .from('orders')
                            .update({
                                status: 'completed',
                                video_url: finalVideoUrl,
                                stitching_status: 'completed',
                            })
                            .eq('id', order.id);

                        return NextResponse.json({
                            status: 'completed',
                            video_url: finalVideoUrl,
                            child_name: order.child_name,
                        });
                    } catch (stitchError) {
                        console.error('Stitching failed:', stitchError);
                        await supabase
                            .from('orders')
                            .update({ stitching_status: 'failed', status: 'failed' })
                            .eq('id', order.id);
                        return NextResponse.json({
                            status: 'failed',
                            error: 'Video stitching failed',
                        });
                    }
                } else if (order.stitching_status === 'processing') {
                    // Stitching in progress
                    return NextResponse.json({
                        status: 'processing',
                        message: 'Stitching video chunks together...',
                        child_name: order.child_name,
                    });
                }
            }

            // Still processing chunks
            const processingCount = statuses.filter(s => s.status === 'processing' || s.status === 'starting').length;
            return NextResponse.json({
                status: 'processing',
                message: `Processing ${processingCount} of ${predictionIds.length} video chunks...`,
                child_name: order.child_name,
            });
        }

        // Single video generation (existing flow)
        if (!order.replicate_prediction_id) {
            return NextResponse.json({
                status: order.status || 'pending',
                child_name: order.child_name,
            });
        }

        const prediction = await getLipsyncPredictionStatus(order.replicate_prediction_id);

        if (prediction.status === 'succeeded' && prediction.output) {
            // Video is ready - store it and send email
            console.log(`Video generation succeeded for order ${order.id}, output URL: ${prediction.output}`);
            try {
                console.log(`Starting to store video from Replicate output: ${prediction.output}`);
                const finalVideoUrl = await storeVideo(prediction.output, order.id);
                console.log(`Video stored successfully at: ${finalVideoUrl}`);

                // Send email if we have customer email (use customer_email or fallback to email)
                const recipientEmail = order.customer_email || order.email;
                if (recipientEmail) {
                    try {
                        await sendVideoEmail(
                            recipientEmail,
                            finalVideoUrl,
                            order.child_name,
                            order.id
                        );
                        console.log(`Video email sent to ${recipientEmail}`);
                    } catch (emailError) {
                        console.error('Failed to send video email:', emailError);
                        // Don't fail the whole request if email fails
                    }
                } else {
                    console.warn('No email address found for order:', order.id);
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
                console.error('Store error details:', {
                    error: storeError instanceof Error ? storeError.message : String(storeError),
                    stack: storeError instanceof Error ? storeError.stack : undefined,
                    output: prediction.output,
                    orderId: order.id,
                });
                return NextResponse.json({
                    status: 'processing',
                    message: 'Video ready, finalizing storage...',
                    error: storeError instanceof Error ? storeError.message : 'Unknown error',
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
