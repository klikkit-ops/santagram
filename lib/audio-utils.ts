import { downloadFromR2, uploadToR2, getPublicUrl } from './r2-storage';

/**
 * Get the duration of an audio file in seconds
 * @param audioUrl - URL of the audio file (can be R2 URL or any accessible URL)
 * @returns Duration in seconds
 */
export async function getAudioDuration(audioUrl: string): Promise<number> {
    try {
        // Download the audio file
        let audioBuffer: Buffer;
        
        if (audioUrl.includes('r2.dev') || audioUrl.includes('r2.cloudflarestorage.com')) {
            // Extract key from R2 URL
            const url = new URL(audioUrl);
            const key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
            audioBuffer = await downloadFromR2(key);
        } else {
            // Download from external URL
            const response = await fetch(audioUrl);
            if (!response.ok) {
                throw new Error(`Failed to download audio: ${response.status} ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            audioBuffer = Buffer.from(arrayBuffer);
        }

        // Use a simple approach: try to get duration from audio metadata
        // For MP3 files, we can use a library or estimate based on file size
        // For now, we'll use a basic estimation or fetch metadata
        
        // Try to get duration using Web Audio API approach (server-side compatible)
        // Since we're in Node.js, we'll need to use a library or estimate
        
        // For MP3 files, approximate duration = file size / bitrate
        // Average bitrate for ElevenLabs is around 128kbps = 16KB/s
        // This is a rough estimate - for accurate duration, we'd need ffmpeg or a library
        
        // Better approach: use ffprobe or a Node.js audio library
        // For now, let's use a simple estimation based on file size
        // This will be improved when we integrate with RunPod for actual processing
        
        const fileSizeKB = audioBuffer.length / 1024;
        // Estimate: ~16KB per second for 128kbps MP3
        const estimatedDuration = fileSizeKB / 16;
        
        console.log(`Estimated audio duration: ${estimatedDuration.toFixed(2)} seconds (file size: ${fileSizeKB.toFixed(2)} KB)`);
        
        return Math.ceil(estimatedDuration);
    } catch (error) {
        console.error('Error getting audio duration:', error);
        throw new Error(`Failed to get audio duration: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Split an audio file into chunks using RunPod
 * The Replicate kling-lip-sync model has a 2-10 second limit, so we must split longer audio.
 * 
 * @param audioUrl - URL of the audio file
 * @param chunkDuration - Duration of each chunk in seconds (default: 10, max: 10 for Replicate)
 * @returns Array of R2 URLs for each chunk
 */
export async function splitAudioIntoChunks(
    audioUrl: string,
    chunkDuration: number = 10
): Promise<string[]> {
    try {
        // Get full audio duration
        const fullDuration = await getAudioDuration(audioUrl);
        
        // If audio is shorter than chunk duration, return original
        if (fullDuration <= chunkDuration) {
            console.log(`Audio is ${fullDuration}s, shorter than chunk duration ${chunkDuration}s. Returning original.`);
            return [audioUrl];
        }

        // Audio is longer than chunk duration - need to split using RunPod
        console.log(`Audio is ${fullDuration}s (longer than ${chunkDuration}s). Splitting using RunPod...`);
        
        // Import RunPod audio splitting function
        const { splitAudioWithRunPod } = await import('./runpod-stitcher');
        const chunkUrls = await splitAudioWithRunPod(audioUrl, chunkDuration);
        
        console.log(`Audio split into ${chunkUrls.length} chunks`);
        return chunkUrls;
    } catch (error) {
        console.error('Error splitting audio into chunks:', error);
        throw new Error(`Failed to split audio: ${error instanceof Error ? error.message : String(error)}`);
    }
}

