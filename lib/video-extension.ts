// This file is deprecated - video extension is now handled by chunking and stitching
// Keeping for reference but not actively used
// import { uploadToR2 } from './r2-storage';

const HERO_VIDEO_URL = 'https://blob.santagram.app/hero/hero.mp4';

/**
 * Get audio duration in seconds from an audio file URL
 * Uses a simple estimation based on file size and typical MP3 bitrate
 */
async function getAudioDuration(audioUrl: string): Promise<number> {
    try {
        // Fetch audio file to get size
        const response = await fetch(audioUrl, { method: 'HEAD' });
        const contentLength = response.headers.get('content-length');
        
        if (contentLength) {
            const fileSizeBytes = parseInt(contentLength, 10);
            // Estimate duration: MP3 at ~128kbps = ~16KB per second
            // With speed 0.75, audio is longer, so we use a lower bitrate estimate
            // Typical MP3 at 128kbps: ~1KB per second of audio
            // But with ElevenLabs, it's usually higher quality, so ~2KB per second
            const estimatedDuration = fileSizeBytes / 2000; // bytes / bytes per second
            console.log(`Estimated audio duration: ${estimatedDuration.toFixed(2)} seconds (file size: ${fileSizeBytes} bytes)`);
            return estimatedDuration;
        }
        
        // Fallback: download a small portion to get actual duration
        const audioResponse = await fetch(audioUrl, { 
            headers: { Range: 'bytes=0-8192' } // Get first 8KB
        });
        const buffer = await audioResponse.arrayBuffer();
        
        // Try to parse MP3 header for duration (simplified)
        // MP3 files have metadata that can be parsed, but for simplicity,
        // we'll use a more accurate estimation
        const fileSizeBytes = parseInt(audioResponse.headers.get('content-length') || '0', 10);
        if (fileSizeBytes === 0) {
            // If we can't get size, estimate based on typical speech rate
            // At 0.75 speed, audio is ~33% longer than normal
            // We'll need to get this from the actual audio generation
            return 30; // Default fallback
        }
        
        // Better estimation: MP3 at 128kbps = file size / (bitrate / 8)
        const bitrate = 128000; // 128 kbps
        const estimatedDuration = (fileSizeBytes * 8) / bitrate;
        console.log(`Calculated audio duration: ${estimatedDuration.toFixed(2)} seconds`);
        return estimatedDuration;
    } catch (error) {
        console.error('Error getting audio duration:', error);
        // Fallback duration
        return 30;
    }
}

/**
 * Get video duration in seconds from a video file URL
 */
async function getVideoDuration(videoUrl: string): Promise<number> {
    try {
        // For MP4 files, we can try to get duration from metadata
        // This is a simplified approach - in production you might want to use a library
        const response = await fetch(videoUrl, { method: 'HEAD' });
        
        // Try to get duration from Content-Length and estimate
        // Or we can download a small portion and parse MP4 metadata
        // For now, we'll use a known duration or estimate
        
        // If we know the hero video duration, use it
        // Otherwise, estimate based on file size
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
            const fileSizeBytes = parseInt(contentLength, 10);
            // MP4 at typical bitrate: estimate ~1MB per 10 seconds for 1080p
            const estimatedDuration = (fileSizeBytes / 100000) * 10;
            console.log(`Estimated video duration: ${estimatedDuration.toFixed(2)} seconds`);
            return estimatedDuration;
        }
        
        // Default fallback - you should set this to your actual hero video duration
        return 10; // Default to 10 seconds if we can't determine
    } catch (error) {
        console.error('Error getting video duration:', error);
        return 10; // Fallback
    }
}

/**
 * Extend video by looping it to match audio duration
 * Returns the extended video URL in Vercel Blob
 */
export async function extendVideoToMatchAudio(
    audioUrl: string,
    videoUrl: string = HERO_VIDEO_URL
): Promise<string> {
    console.log('[extendVideo] Starting video extension process');
    
    // Get durations
    const [audioDuration, videoDuration] = await Promise.all([
        getAudioDuration(audioUrl),
        getVideoDuration(videoUrl),
    ]);
    
    console.log(`[extendVideo] Audio duration: ${audioDuration.toFixed(2)}s, Video duration: ${videoDuration.toFixed(2)}s`);
    
    // If audio is shorter or equal, no need to extend
    if (audioDuration <= videoDuration) {
        console.log('[extendVideo] Audio is shorter than video, using original video');
        return videoUrl;
    }
    
    // Calculate how many times we need to loop the video
    const loopsNeeded = Math.ceil(audioDuration / videoDuration);
    console.log(`[extendVideo] Need to loop video ${loopsNeeded} times to match audio`);
    
    // For now, we'll use a service or create a simple solution
    // Since we can't easily do video processing in serverless without ffmpeg,
    // we'll use the Replicate API's ability to handle longer videos
    // OR we can create a looped video using a video processing service
    
    // Actually, the best approach is to let Replicate handle it,
    // but we need to provide a longer video. Let's create a simple solution:
    // We'll download the video, create a looped version, and upload it
    
    // For Vercel serverless, we'll use a different approach:
    // We'll note that Replicate should handle video extension automatically,
    // but if not, we can use a video processing API or service
    
    // For now, let's return the original video URL and add a note
    // The Replicate model should handle longer audio by extending the video
    // If it doesn't, we'll need to pre-process the video
    
    console.log('[extendVideo] Note: Replicate should handle video extension automatically');
    console.log('[extendVideo] If video is cut short, we may need to pre-process the video');
    
    // Return original video - Replicate should handle the extension
    // If it doesn't work, we'll need to implement actual video looping
    return videoUrl;
}

