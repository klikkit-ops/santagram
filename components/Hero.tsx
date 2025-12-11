'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState, useCallback } from 'react';

export default function Hero() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hasTriggered, setHasTriggered] = useState(false);
    const [isMuted, setIsMuted] = useState(true);

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
                            // If successful, keep unmuted
                        }).catch((error) => {
                            // If unmuted autoplay fails, try muted autoplay
                            console.log('Unmuted autoplay failed, trying muted:', error);
                            video.muted = true;
                            setIsMuted(true);
                            video.play().catch((mutedError) => {
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

        // Sync mute state with video events
        const handleVolumeChange = () => {
            setIsMuted(video.muted);
        };
        const handleEnded = () => {
            // Loop the video
            if (video) {
                video.currentTime = 0;
                video.play();
            }
        };

        video.addEventListener('ended', handleEnded);
        video.addEventListener('volumechange', handleVolumeChange);

        return () => {
            observer.disconnect();
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

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Trust Badge - Mobile Only (above content) */}
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8 border border-white/20 mx-auto block text-center lg:hidden">
                    <span className="text-xl">🎅</span>
                    <span className="text-white/80 text-sm">Trusted by 10,000+ happy families</span>
                    <span className="text-xl">⭐</span>
                </div>

                {/* Two Column Layout */}
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left Column - Text and CTAs */}
                    <div className="text-center lg:text-left">
                        {/* Main Heading */}
                        <h1 className="heading-display text-4xl sm:text-5xl md:text-6xl lg:text-6xl mb-6 leading-tight text-center lg:text-center">
                            Create a Magical<br />
                            <span className="text-white">Video Message</span><br className="hidden lg:block" />
                            <span className="text-white">from Santa!</span> 🎄
                        </h1>

                        {/* Subheadline */}
                        <p className="text-xl sm:text-2xl text-white/80 max-w-3xl lg:max-w-none mx-auto lg:mx-0 mb-10 leading-relaxed">
                            Personalized videos where Santa knows your child&apos;s name,
                            achievements, and special message. Make this Christmas truly magical! ✨
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                            <Link href="/create" className="btn-primary text-lg py-4 px-8 animate-pulse-glow">
                                Create Your Video Now 🎁
                            </Link>
                            <a href="#how-it-works" className="btn-secondary text-lg py-4 px-8">
                                See How It Works
                            </a>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-8 max-w-2xl lg:max-w-none mx-auto lg:mx-0">
                            <div className="text-center lg:text-left">
                                <div className="text-3xl sm:text-4xl font-bold text-[var(--gold)]">10K+</div>
                                <div className="text-white/60 text-sm">Happy Kids</div>
                            </div>
                            <div className="text-center lg:text-left">
                                <div className="text-3xl sm:text-4xl font-bold text-[var(--gold)]">4.9★</div>
                                <div className="text-white/60 text-sm">Parent Rating</div>
                            </div>
                            <div className="text-center lg:text-left">
                                <div className="text-3xl sm:text-4xl font-bold text-[var(--gold)]">8min</div>
                                <div className="text-white/60 text-sm">Delivery Time</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Video Preview */}
                    <div className="relative max-w-2xl lg:max-w-none mx-auto lg:mx-0">
                        <div className="glass-card glow-gold" style={{ padding: '0.6rem' }}>
                            <div
                                ref={containerRef}
                                className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-red-900/50 to-green-900/50"
                            >
                                <video
                                    ref={videoRef}
                                    className="w-full h-full object-cover"
                                    playsInline
                                    loop
                                    autoPlay
                                    webkit-playsinline="true"
                                    x5-playsinline="true"
                                >
                                    <source src="https://z9igvokaxzvbcuwi.public.blob.vercel-storage.com/hero.mp4" type="video/mp4" />
                                </video>

                                {/* Mute/Unmute Button - Always Visible in Top Left */}
                                <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-10">
                                    <button
                                        onClick={toggleMute}
                                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center hover:bg-black/90 active:bg-black/90 transition-colors shadow-lg touch-manipulation"
                                        aria-label={isMuted ? 'Unmute' : 'Mute'}
                                    >
                                        {isMuted ? (
                                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* Santa Image */}
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 sm:w-40 sm:h-40 animate-float z-50" style={{ left: '-16px' }}>
                            <Image src="/santa.png" alt="Santa Claus" fill className="object-contain drop-shadow-2xl" />
                        </div>
                        
                        {/* Trust Badge - Desktop Only (below video) */}
                        <div className="hidden lg:flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mt-6 border border-white/20 w-full">
                            <span className="text-xl">🎅</span>
                            <span className="text-white/80 text-sm">Trusted by 10,000+ happy families</span>
                            <span className="text-xl">⭐</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
