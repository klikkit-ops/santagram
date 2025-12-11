import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getLipsyncPredictionStatus } from '@/lib/replicate';
import { storeVideo, sendVideoEmail } from '@/lib/video-storage';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            );
        }

        // Get order details
        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

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
            });
        }

        // If no prediction ID, video hasn't started generating
        if (!order.replicate_prediction_id) {
            return NextResponse.json({
                status: order.status || 'pending',
            });
        }

        // Check Replicate prediction status
        const prediction = await getLipsyncPredictionStatus(order.replicate_prediction_id);

        if (prediction.status === 'succeeded' && prediction.output) {
            // Video is ready - store it and send email
            try {
                const finalVideoUrl = await storeVideo(prediction.output, orderId);

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
                    .eq('id', orderId);

                return NextResponse.json({
                    status: 'completed',
                    video_url: finalVideoUrl,
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
                .eq('id', orderId);

            return NextResponse.json({
                status: 'failed',
                error: prediction.error || 'Video generation failed',
            });
        }

        // Still processing
        return NextResponse.json({
            status: prediction.status === 'starting' ? 'starting' : 'processing',
        });

    } catch (error) {
        console.error('Video status error:', error);
        return NextResponse.json(
            { error: 'Failed to check video status' },
            { status: 500 }
        );
    }
}
