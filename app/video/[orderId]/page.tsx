'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface VideoData {
    video_url: string;
    child_name: string;
    status: string;
    error?: string;
}

function VideoContent() {
    const params = useParams();
    const orderId = params?.orderId as string;
    const [videoData, setVideoData] = useState<VideoData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!orderId) return;

        const fetchVideo = async () => {
            try {
                const response = await fetch(`/api/video-status?orderId=${orderId}`);
                const data = await response.json();

                if (data.error) {
                    setError(data.error);
                } else if (data.status === 'completed' && data.video_url) {
                    setVideoData({
                        video_url: data.video_url,
                        child_name: data.child_name || 'your child',
                        status: data.status,
                    });
                } else if (data.status === 'failed') {
                    setError(data.error || 'Video generation failed');
                } else {
                    setError('Video is not ready yet');
                }
            } catch (err) {
                setError('Failed to load video');
                console.error('Error fetching video:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchVideo();
    }, [orderId]);

    const handleDownload = () => {
        if (!videoData?.video_url) return;

        // For mobile devices, open in new tab and let user save from there
        // For desktop, trigger download
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (isMobile) {
            // On mobile, open the video URL directly - user can long-press to save
            window.open(videoData.video_url, '_blank');
        } else {
            // On desktop, trigger download
            const link = document.createElement('a');
            link.href = videoData.video_url;
            link.download = `santa-message-${videoData.child_name}.mp4`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleShare = async () => {
        if (!videoData) return;

        const shareUrl = window.location.href;
        const shareText = `Check out this magical message from Santa for ${videoData.child_name}!`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Personalized Santa Message',
                    text: shareText,
                    url: shareUrl,
                });
            } catch (err) {
                // User cancelled or error occurred
                console.log('Share cancelled or failed');
            }
        } else {
            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(shareUrl);
                alert('Link copied to clipboard!');
            } catch (err) {
                console.error('Failed to copy link:', err);
            }
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
            <div className="max-w-4xl mx-auto px-4">
                {/* Navbar */}
                <div className="mb-8">
                    <Link href="/" className="flex items-center gap-3 text-white/70 hover:text-white transition-colors">
                        <Image src="/logo.png" alt="SantaGram" width={40} height={40} className="object-contain" />
                        <span className="text-xl font-bold">SantaGram</span>
                    </Link>
                </div>

                {/* Main Content */}
                <div className="glass-card glow-gold">
                    {loading && (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">⏳</div>
                            <p className="text-white/70">Loading your magical video...</p>
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">😔</div>
                            <h1 className="heading-display text-3xl mb-4">Oops!</h1>
                            <p className="text-white/70 mb-6">{error}</p>
                            <Link href="/" className="btn-primary inline-flex">
                                Go Home
                            </Link>
                        </div>
                    )}

                    {videoData && !loading && !error && (
                        <>
                            <div className="text-center mb-8">
                                <h1 className="heading-display text-3xl sm:text-4xl mb-4">
                                    🎅 Santa's Message for {videoData.child_name}! 🎄
                                </h1>
                                <p className="text-white/70 text-lg">
                                    Your personalized video message is ready!
                                </p>
                            </div>

                            {/* Video Player */}
                            <div className="mb-8">
                                <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
                                    <video
                                        src={videoData.video_url}
                                        controls
                                        className="w-full h-full object-contain"
                                        poster="/santa.png"
                                        preload="metadata"
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                                <button
                                    onClick={handleDownload}
                                    className="btn-primary flex items-center justify-center gap-2"
                                >
                                    <span>📥</span>
                                    <span>Download Video</span>
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="btn-secondary flex items-center justify-center gap-2"
                                >
                                    <span>📤</span>
                                    <span>Share Video</span>
                                </button>
                            </div>

                            {/* Info */}
                            <div className="text-center pt-6 border-t border-white/10">
                                <p className="text-white/60 text-sm mb-4">
                                    This magical message was created especially for {videoData.child_name}.
                                </p>
                                <Link href="/create" className="text-[var(--gold)] hover:text-[var(--gold)]/80 text-sm font-medium">
                                    Create Another Video 🎁
                                </Link>
                            </div>
                        </>
                    )}
                </div>

                {/* Santa Character */}
                <div className="relative w-40 h-40 mx-auto mt-8 animate-float">
                    <Image src="/santa.png" alt="Santa" fill className="object-contain" />
                </div>
            </div>
        </div>
    );
}

export default function VideoPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">⏳</div>
                    <p className="text-white/70">Loading...</p>
                </div>
            </div>
        }>
            <VideoContent />
        </Suspense>
    );
}

