import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateSantaScript } from '@/lib/script-generator';
import { generateSpeech } from '@/lib/elevenlabs';
import { createLipsyncVideoPrediction } from '@/lib/replicate';

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

        if (order.replicate_prediction_id) {
            return NextResponse.json(
                { error: 'Video already being generated', prediction_id: order.replicate_prediction_id },
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

        // Generate audio with ElevenLabs
        const audioUrl = await generateSpeech(script);

        // Start lipsync video generation with Replicate
        const predictionId = await createLipsyncVideoPrediction(audioUrl, script);

        // Update order
        await supabase
            .from('orders')
            .update({
                status: 'generating',
                replicate_prediction_id: predictionId,
                audio_url: audioUrl,
            })
            .eq('id', orderId);

        return NextResponse.json({ success: true, prediction_id: predictionId });
    } catch (error) {
        console.error('Generate video error:', error);
        return NextResponse.json(
            { error: 'Failed to generate video' },
            { status: 500 }
        );
    }
}
