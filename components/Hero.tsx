'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState, useCallback } from 'react';

export default function Hero() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hasTriggered, setHasTriggered] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [showControls, setShowControls] = useState(false);

    const togglePlay = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
    }, []);

    const toggleMute = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        video.muted = !video.muted;
        setIsMuted(video.muted);
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        const container = containerRef.current;
        if (!video || !container || hasTriggered) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !hasTriggered) {
                        // Try to play with audio first (unmuted)
                        video.muted = false;
                        setIsMuted(false);
                        
                        video.play().then(() => {
                            setIsPlaying(true);
                            // If successful, keep unmuted
                        }).catch((error) => {
                            // If unmuted autoplay fails, try muted autoplay
                            console.log('Unmuted autoplay failed, trying muted:', error);
                            video.muted = true;
                            setIsMuted(true);
                            video.play().then(() => {
                                setIsPlaying(true);
                            }).catch((mutedError) => {
                                console.log('Muted autoplay also failed:', mutedError);
                            });
                        });
                        
                        setHasTriggered(true);
                        observer.disconnect();
                    }
                });
            },
            {
                threshold: [0.5],
                rootMargin: '0px',
            }
        );

        observer.observe(container);

        // Sync play state with video events
        const handlePlay = () => {
            setIsPlaying(true);
            // Sync mute state with video element
            setIsMuted(video.muted);
        };
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => {
            setIsPlaying(false);
            // Loop the video
            if (video) {
                video.currentTime = 0;
                video.play().then(() => {
                    setIsPlaying(true);
                });
            }
        };
        const handleVolumeChange = () => {
            setIsMuted(video.muted);
        };

        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('volumechange', handleVolumeChange);

        return () => {
            observer.disconnect();
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('volumechange', handleVolumeChange);
        };
    }, [hasTriggered]);

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
            {/* Background Decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-20 h-20 opacity-20 animate-float">
                    <Image src="/rudolph.png" alt="" fill className="object-contain" />
                </div>
                <div className="absolute top-40 right-20 w-24 h-24 opacity-20 animate-float" style={{ animationDelay: '2s' }}>
                    <Image src="/snowman.png" alt="" fill className="object-contain" />
                </div>
                <div className="absolute bottom-40 left-20 w-20 h-20 opacity-20 animate-float" style={{ animationDelay: '4s' }}>
                    <Image src="/elf.png" alt="" fill className="object-contain" />
                </div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                {/* Trust Badge */}
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8 border border-white/20">
                    <span className="text-xl">🎅</span>
                    <span className="text-white/80 text-sm">Trusted by 10,000+ happy families</span>
                    <span className="text-xl">⭐</span>
                </div>

                {/* Main Heading */}
                <h1 className="heading-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-6 leading-tight">
                    Create a Magical<br />
                    <span className="text-white">Video Message</span><br />
                    from Santa! 🎄
                </h1>

                {/* Subheadline */}
                <p className="text-xl sm:text-2xl text-white/80 max-w-3xl mx-auto mb-10 leading-relaxed">
                    Personalized videos where Santa knows your child&apos;s name,
                    achievements, and special message. Make this Christmas truly magical! ✨
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                    <Link href="/create" className="btn-primary text-lg py-4 px-8 animate-pulse-glow">
                        Create Your Video Now 🎁
                    </Link>
                    <a href="#how-it-works" className="btn-secondary text-lg py-4 px-8">
                        See How It Works
                    </a>
                </div>

                {/* Preview Card */}
                <div className="relative max-w-xl mx-auto">
                    <div className="glass-card p-1 glow-gold">
                        <div
                            ref={containerRef}
                            className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-red-900/50 to-green-900/50"
                            onMouseEnter={() => setShowControls(true)}
                            onMouseLeave={() => setShowControls(false)}
                        >
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover"
                                playsInline
                                loop
                                autoPlay
                            >
                                <source src="https://z9igvokaxzvbcuwi.public.blob.vercel-storage.com/hero.mp4" type="video/mp4" />
                            </video>

                            {/* Mute/Unmute Button - Always Visible */}
                            <div className="absolute bottom-3 left-3">
                                <button
                                    onClick={toggleMute}
                                    className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors shadow-lg"
                                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                                >
                                    {isMuted ? (
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            {/* Play/Pause Button - Shown on Hover */}
                            <div
                                className={`absolute bottom-0 left-0 flex items-center gap-3 p-4 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
                            >
                                <button
                                    onClick={togglePlay}
                                    className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                                    aria-label={isPlaying ? 'Pause' : 'Play'}
                                >
                                    {isPlaying ? (
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Santa Image */}
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 sm:w-40 sm:h-40 animate-float">
                        <Image src="/santa.png" alt="Santa Claus" fill className="object-contain drop-shadow-2xl" />
                    </div>
                </div>

                {/* Stats */}
                <div className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                    <div className="text-center">
                        <div className="text-3xl sm:text-4xl font-bold text-[var(--gold)]">10K+</div>
                        <div className="text-white/60 text-sm">Happy Kids</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl sm:text-4xl font-bold text-[var(--gold)]">4.9★</div>
                        <div className="text-white/60 text-sm">Parent Rating</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl sm:text-4xl font-bold text-[var(--gold)]">2min</div>
                        <div className="text-white/60 text-sm">Delivery Time</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
