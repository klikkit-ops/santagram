import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendVideoEmail } from '@/lib/video-storage';

/**
 * Webhook endpoint for RunPod to notify us when a job completes
 * This eliminates the need for constant polling from Vercel
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        console.log('[runpod-webhook] Received webhook:', {
            id: body.id,
            status: body.status,
            hasOutput: !!body.output,
        });

        const jobId = body.id;
        const status = body.status;
        const output = body.output;
        const error = body.error;

        // Find the order with this RunPod job ID
        const { data: orders, error: fetchError } = await supabase
            .from('orders')
            .select('*')
            .like('replicate_prediction_id', `runpod:${jobId}%`)
            .limit(1);

        if (fetchError || !orders || orders.length === 0) {
            console.error('[runpod-webhook] Order not found for job:', jobId);
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        const order = orders[0];

        if (status === 'COMPLETED') {
            const videoUrl = output?.video_url;
            
            if (!videoUrl) {
                console.error('[runpod-webhook] Job completed but no video_url in output:', output);
                await supabase
                    .from('orders')
                    .update({
                        status: 'failed',
                        stitching_status: 'failed',
                    })
                    .eq('id', order.id);
                
                return NextResponse.json(
                    { error: 'No video URL in output' },
                    { status: 400 }
                );
            }

            console.log(`[runpod-webhook] Job ${jobId} completed successfully, video URL: ${videoUrl}`);

            // Update order with final video
            const recipientEmail = order.customer_email || order.email;
            if (recipientEmail) {
                try {
                    await sendVideoEmail(
                        recipientEmail,
                        videoUrl,
                        order.child_name,
                        order.id
                    );
                    console.log(`[runpod-webhook] Video email sent to ${recipientEmail}`);
                } catch (emailError) {
                    console.error('[runpod-webhook] Failed to send video email:', emailError);
                }
            }

            await supabase
                .from('orders')
                .update({
                    status: 'completed',
                    video_url: videoUrl,
                    stitching_status: 'completed',
                })
                .eq('id', order.id);

            return NextResponse.json({ success: true, message: 'Order updated' });
        } else if (status === 'FAILED' || status === 'CANCELED') {
            console.error(`[runpod-webhook] Job ${jobId} failed:`, error);
            
            await supabase
                .from('orders')
                .update({
                    status: 'failed',
                    stitching_status: 'failed',
                })
                .eq('id', order.id);

            return NextResponse.json({ success: true, message: 'Order marked as failed' });
        } else {
            // Job still in progress, just acknowledge
            console.log(`[runpod-webhook] Job ${jobId} status: ${status}`);
            return NextResponse.json({ success: true, message: 'Status update received' });
        }
    } catch (error) {
        console.error('[runpod-webhook] Error processing webhook:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}





