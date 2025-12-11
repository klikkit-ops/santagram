import { generateSpeech } from './elevenlabs';
import { getAudioDuration, splitAudioIntoChunks } from './audio-utils';
import { createLipsyncVideoPrediction, createLipsyncVideoChunks, waitForAllPredictions } from './replicate';
import { stitchVideoChunks } from './runpod-stitcher';
import { uploadToR2 } from './r2-storage';

const MAX_CHUNK_DURATION = 10; // seconds - Replicate kling-lip-sync model limit is 2-10 seconds

/**
 * Generate a video from audio, handling both short and long audio
 * @param script - The script to generate audio from
 * @param orderId - The order ID for tracking
 * @returns URL of the final video (stored in R2)
 */
export async function generateLongVideo(
    script: string,
    orderId: string
): Promise<string> {
    console.log(`[generateLongVideo] Starting video generation for order ${orderId}`);

    try {
        // Step 1: Generate audio with ElevenLabs
        console.log('[generateLongVideo] Generating audio with ElevenLabs...');
        const audioUrl = await generateSpeech(script);
        console.log(`[generateLongVideo] Audio generated: ${audioUrl}`);

        // Step 2: Get audio duration
        console.log('[generateLongVideo] Getting audio duration...');
        const audioDuration = await getAudioDuration(audioUrl);
        console.log(`[generateLongVideo] Audio duration: ${audioDuration} seconds`);

        // Step 3: Determine if we need chunking
        if (audioDuration <= MAX_CHUNK_DURATION) {
            // Short audio - use single video generation
            // For short videos, we'll use the existing flow
            // This function is primarily for long videos
            console.log('[generateLongVideo] Audio is short, but this function is for long videos. Use existing flow for short videos.');
            throw new Error('Use generateSingleVideo or existing flow for videos <= 10 seconds');
        } else {
            // Long audio - use chunking
            console.log(`[generateLongVideo] Audio is long (${audioDuration}s), using chunking approach`);
            
            // Step 4: Split audio into chunks
            console.log('[generateLongVideo] Splitting audio into chunks...');
            const audioChunks = await splitAudioIntoChunks(audioUrl, MAX_CHUNK_DURATION);
            console.log(`[generateLongVideo] Split into ${audioChunks.length} chunks`);

            // Step 5: Generate videos for all chunks in parallel
            console.log('[generateLongVideo] Generating videos for chunks in parallel...');
            const predictionIds = await createLipsyncVideoChunks(audioChunks);
            console.log(`[generateLongVideo] Created ${predictionIds.length} predictions`);

            // Step 6: Wait for all chunks to complete
            console.log('[generateLongVideo] Waiting for all chunks to complete...');
            const videoChunkUrls = await waitForAllPredictions(predictionIds);
            console.log(`[generateLongVideo] All chunks completed:`, videoChunkUrls);

            // Step 7: Stitch chunks together using RunPod
            console.log('[generateLongVideo] Stitching video chunks together...');
            const outputKey = `videos/${orderId}-santa-message.mp4`;
            const finalVideoUrl = await stitchVideoChunks(videoChunkUrls, audioUrl, outputKey);
            console.log(`[generateLongVideo] Final video stitched: ${finalVideoUrl}`);

            return finalVideoUrl;
        }
    } catch (error) {
        console.error('[generateLongVideo] Error:', error);
        throw new Error(`Failed to generate video: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Generate a single video (for short audio <= 10 seconds)
 * This is a wrapper around the existing flow
 * @param audioUrl - URL of the audio file
 * @param script - The script (optional, for fallback)
 * @returns Prediction ID for polling
 */
export async function generateSingleVideo(
    audioUrl: string,
    script?: string
): Promise<string> {
    console.log('[generateSingleVideo] Creating single video prediction...');
    return createLipsyncVideoPrediction(audioUrl, script);
}

