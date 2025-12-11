import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateSantaScript } from '@/lib/script-generator';
import { generateSpeech } from '@/lib/elevenlabs';
import { createLipsyncVideoPrediction } from '@/lib/replicate';

// TEMPORARY TEST ENDPOINT - Remove before production!
export async function POST(request: NextRequest) {
    // Log environment variable status (not the actual values)
    console.log('🔧 ENV CHECK:', {
        hasElevenLabsKey: !!process.env.ELEVENLABS_API_KEY,
        hasReplicateToken: !!process.env.REPLICATE_API_TOKEN,
        hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    });

    try {
        const body = await request.json();

        const {
            childName = 'Test Child',
            childAge = 7,
            childGender = 'boy',
            achievements = 'being kind to friends',
            interests = 'dinosaurs and space',
            specialMessage = '',
            messageType = 'christmas-morning',
            email = 'test@example.com',
        } = body;

        console.log('🧪 TEST: Starting video generation for', childName);

        // Generate the Santa script
        const script = generateSantaScript({
            childName,
            childAge,
            childGender,
            achievements,
            interests,
            specialMessage,
            messageType,
        });

        console.log('📝 Script generated:', script.substring(0, 100) + '...');

        // Create a test order in the database
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                child_name: childName,
                child_age: childAge,
                child_gender: childGender,
                message_type: messageType,
                personalization: { achievements, interests, special_message: specialMessage },
                customer_email: email,
                status: 'paid', // Bypass payment
                stripe_session_id: `test_${Date.now()}`,
            })
            .select()
            .single();

        if (orderError) {
            console.error('Failed to create test order:', orderError);
            return NextResponse.json(
                { error: 'Failed to create test order', details: orderError.message },
                { status: 500 }
            );
        }

        console.log('📦 Test order created:', order.id);

        // Step 1: Generate audio with ElevenLabs
        console.log('🎙️ Generating speech with ElevenLabs...');
        const audioUrl = await generateSpeech(script);
        console.log('✅ Audio generated:', audioUrl);

        // Step 2: Start lipsync video generation
        console.log('🎬 Starting Pixverse lipsync generation...');
        const predictionId = await createLipsyncVideoPrediction(audioUrl);
        console.log('✅ Lipsync started, prediction ID:', predictionId);

        // Update order with prediction ID
        await supabase
            .from('orders')
            .update({
                status: 'generating',
                replicate_prediction_id: predictionId,
                audio_url: audioUrl,
            })
            .eq('id', order.id);

        return NextResponse.json({
            success: true,
            orderId: order.id,
            predictionId,
            audioUrl,
            script,
            message: 'Video generation started! Use /api/video-status?orderId=' + order.id + ' to check status.',
        });

    } catch (error) {
        console.error('Test video generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate test video', details: String(error) },
            { status: 500 }
        );
    }
}
