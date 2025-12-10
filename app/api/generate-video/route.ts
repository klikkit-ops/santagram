import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateSantaScript, createVideo } from '@/lib/heygen';

export async function POST(request: NextRequest) {
    try {
        const { orderId } = await request.json();

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

        if (order.heygen_video_id) {
            return NextResponse.json(
                { error: 'Video already being generated', video_id: order.heygen_video_id },
                { status: 400 }
            );
        }

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

        // Create video
        const { video_id } = await createVideo(script);

        // Update order
        await supabase
            .from('orders')
            .update({
                status: 'generating',
                heygen_video_id: video_id,
            })
            .eq('id', orderId);

        return NextResponse.json({ success: true, video_id });
    } catch (error) {
        console.error('Generate video error:', error);
        return NextResponse.json(
            { error: 'Failed to generate video' },
            { status: 500 }
        );
    }
}
