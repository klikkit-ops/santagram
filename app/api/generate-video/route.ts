import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateSantaScript } from '@/lib/script-generator';
import { generateSpeech } from '@/lib/elevenlabs';
import { getAudioDuration } from '@/lib/audio-utils';
import { splitAudioIntoChunks } from '@/lib/audio-utils';
import { createLipsyncVideoPrediction, createLipsyncVideoChunks } from '@/lib/replicate';

const MAX_CHUNK_DURATION = 30; // seconds

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
                .eq('id', orderId);

            return NextResponse.json({ success: true, prediction_id: predictionId, type: 'single' });
        } else {
            // Long audio - chunked generation
            const audioChunks = await splitAudioIntoChunks(audioUrl, MAX_CHUNK_DURATION);
            const predictionIds = await createLipsyncVideoChunks(audioChunks);

            await supabase
                .from('orders')
                .update({
                    status: 'generating',
                    video_chunks: predictionIds,
                    audio_url: audioUrl,
                    stitching_status: 'pending',
                })
                .eq('id', orderId);

            return NextResponse.json({ 
                success: true, 
                prediction_ids: predictionIds, 
                type: 'chunked',
                chunk_count: predictionIds.length 
            });
        }
    } catch (error) {
        console.error('Generate video error:', error);
        return NextResponse.json(
            { error: 'Failed to generate video' },
            { status: 500 }
        );
    }
}
