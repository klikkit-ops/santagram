import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getVideoStatus } from '@/lib/heygen';

export async function GET(request: NextRequest) {
    try {
        const sessionId = request.nextUrl.searchParams.get('session_id');

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID is required' },
                { status: 400 }
            );
        }

        // Get order by stripe session ID
        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('*')
            .eq('stripe_session_id', sessionId)
            .single();

        if (fetchError || !order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // If we already have the video URL, return it
        if (order.video_url && order.status === 'completed') {
            return NextResponse.json({
                status: 'completed',
                video_url: order.video_url,
                child_name: order.child_name,
            });
        }

        // If no HeyGen video ID yet, video hasn't started generating
        if (!order.heygen_video_id) {
            return NextResponse.json({
                status: order.status || 'pending',
                child_name: order.child_name,
            });
        }

        // Check HeyGen status
        const videoStatus = await getVideoStatus(order.heygen_video_id);

        // Update order if video is complete
        if (videoStatus.status === 'completed' && videoStatus.video_url) {
            await supabase
                .from('orders')
                .update({
                    status: 'completed',
                    video_url: videoStatus.video_url,
                })
                .eq('id', order.id);

            return NextResponse.json({
                status: 'completed',
                video_url: videoStatus.video_url,
                child_name: order.child_name,
            });
        }

        if (videoStatus.status === 'failed') {
            await supabase
                .from('orders')
                .update({ status: 'failed' })
                .eq('id', order.id);

            return NextResponse.json({
                status: 'failed',
                error: videoStatus.error,
                child_name: order.child_name,
            });
        }

        return NextResponse.json({
            status: videoStatus.status,
            child_name: order.child_name,
        });
    } catch (error) {
        console.error('Video status error:', error);
        return NextResponse.json(
            { error: 'Failed to get video status' },
            { status: 500 }
        );
    }
}
