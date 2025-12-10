'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface VideoStatus {
    status: 'pending' | 'paid' | 'generating' | 'processing' | 'completed' | 'failed';
    video_url?: string;
    child_name?: string;
    error?: string;
}

function SuccessContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [videoStatus, setVideoStatus] = useState<VideoStatus>({ status: 'pending' });
    const [pollCount, setPollCount] = useState(0);

    useEffect(() => {
        if (!sessionId) return;

        const pollStatus = async () => {
            try {
                const response = await fetch(`/api/video-status?session_id=${sessionId}`);
                const data = await response.json();
                setVideoStatus(data);

                // Continue polling if not completed or failed
                if (data.status !== 'completed' && data.status !== 'failed') {
                    setPollCount(prev => prev + 1);
                }
            } catch (error) {
                console.error('Error fetching status:', error);
            }
        };

        // Initial poll
        pollStatus();

        // Poll every 5 seconds
        const interval = setInterval(() => {
            if (videoStatus.status !== 'completed' && videoStatus.status !== 'failed') {
                pollStatus();
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [sessionId, pollCount]);

    const getStatusMessage = () => {
        switch (videoStatus.status) {
            case 'pending':
                return { emoji: '⏳', title: 'Processing Payment...', message: 'Please wait while we confirm your payment.' };
            case 'paid':
                return { emoji: '✅', title: 'Payment Received!', message: 'Starting to create your magical video...' };
            case 'generating':
                return { emoji: '🎬', title: 'Creating Your Video...', message: 'Santa is recording a special message!' };
            case 'processing':
                return { emoji: '⚡', title: 'Almost Ready!', message: 'Putting the final magical touches on your video...' };
            case 'completed':
                return { emoji: '🎉', title: 'Your Video is Ready!', message: `Santa has a special message for ${videoStatus.child_name}!` };
            case 'failed':
                return { emoji: '😔', title: 'Something Went Wrong', message: 'Please contact support for assistance.' };
            default:
                return { emoji: '⏳', title: 'Processing...', message: 'Please wait...' };
        }
    };

    const status = getStatusMessage();

    return (
        <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
            <div className="max-w-2xl mx-auto px-4 text-center">
                {/* Status Card */}
                <div className="glass-card glow-gold mb-8">
                    <div className="text-6xl mb-6">{status.emoji}</div>

                    <h1 className="heading-display text-3xl sm:text-4xl mb-4">
                        {status.title}
                    </h1>

                    <p className="text-white/70 text-lg mb-8">
                        {status.message}
                    </p>

                    {/* Progress Indicator */}
                    {videoStatus.status !== 'completed' && videoStatus.status !== 'failed' && (
                        <div className="mb-8">
                            <div className="flex justify-center gap-2 mb-4">
                                {['pending', 'paid', 'generating', 'completed'].map((step, index) => {
                                    const steps = ['pending', 'paid', 'generating', 'completed'];
                                    const currentIndex = steps.indexOf(videoStatus.status === 'processing' ? 'generating' : videoStatus.status);
                                    const isActive = index <= currentIndex;
                                    const isCurrent = index === currentIndex;

                                    return (
                                        <div key={step} className="flex items-center">
                                            <div
                                                className={`w-3 h-3 rounded-full transition-all ${isActive ? 'bg-[var(--gold)]' : 'bg-white/20'
                                                    } ${isCurrent ? 'animate-pulse scale-125' : ''}`}
                                            />
                                            {index < 3 && (
                                                <div className={`w-8 h-0.5 ${isActive ? 'bg-[var(--gold)]' : 'bg-white/20'}`} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <span>This usually takes 2-5 minutes</span>
                            </div>
                        </div>
                    )}

                    {/* Video Player */}
                    {videoStatus.status === 'completed' && videoStatus.video_url && (
                        <div className="mb-8">
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-black mb-4">
                                <video
                                    src={videoStatus.video_url}
                                    controls
                                    className="w-full h-full"
                                    poster="/santa.png"
                                >
                                    Your browser does not support the video tag.
                                </video>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <a
                                    href={videoStatus.video_url}
                                    download={`santa-message-${videoStatus.child_name}.mp4`}
                                    className="btn-primary"
                                >
                                    Download Video 📥
                                </a>
                                <button
                                    onClick={() => {
                                        navigator.share?.({
                                            title: 'Personalized Santa Message',
                                            text: `Check out this magical message from Santa for ${videoStatus.child_name}!`,
                                            url: window.location.href,
                                        }).catch(() => {
                                            navigator.clipboard.writeText(window.location.href);
                                            alert('Link copied to clipboard!');
                                        });
                                    }}
                                    className="btn-secondary"
                                >
                                    Share Video 📤
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Failed State */}
                    {videoStatus.status === 'failed' && (
                        <div className="space-y-4">
                            <p className="text-white/60">
                                We apologize for the inconvenience. Please contact our support team and we&apos;ll make it right.
                            </p>
                            <a href="mailto:support@santagram.app" className="btn-primary inline-flex">
                                Contact Support 📧
                            </a>
                        </div>
                    )}

                    {/* Create Another */}
                    {videoStatus.status === 'completed' && (
                        <div className="mt-8 pt-6 border-t border-white/10">
                            <p className="text-white/60 mb-4">
                                Want to create videos for more children?
                            </p>
                            <Link href="/create" className="btn-secondary inline-flex">
                                Create Another Video 🎁
                            </Link>
                        </div>
                    )}
                </div>

                {/* Santa Character */}
                <div className="relative w-40 h-40 mx-auto animate-float">
                    <Image src="/santa.png" alt="Santa" fill className="object-contain" />
                </div>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">⏳</div>
                    <p className="text-white/70">Loading...</p>
                </div>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
