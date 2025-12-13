'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState, useCallback } from 'react';

export default function Hero() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const togglePlayPause = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const video = videoRef.current;
        if (!video) {
            console.log('Video ref not available');
            return;
        }

        // Check actual video state instead of React state
        if (video.paused) {
            // Video is paused, so play it
            video.muted = false;
            video.play().then(() => {
                console.log('Video playing');
                setIsPlaying(true);
            }).catch((error) => {
                console.error('Play failed:', error);
            });
        } else {
            // Video is playing, so pause it
            video.pause();
            console.log('Video paused');
            setIsPlaying(false);
        }
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        const container = containerRef.current;
        if (!video || !container) return;

        // Ensure video is muted and paused by default
        video.muted = true;
        video.pause();
        setIsPlaying(false);

        const handlePlay = () => {
            console.log('Video play event');
            setIsPlaying(true);
        };

        const handlePause = () => {
            console.log('Video pause event');
            setIsPlaying(false);
        };

        const handleEnded = () => {
            // Loop the video
            video.currentTime = 0;
            video.play();
        };

        // Hover handlers
        const handleMouseEnter = () => {
            setIsHovered(true);
        };

        const handleMouseLeave = () => {
            setIsHovered(false);
        };

        // Touch handler for mobile
        const handleTouchStart = () => {
            setIsHovered(true);
            // Hide after 3 seconds on mobile when playing
            setTimeout(() => {
                setIsHovered(false);
            }, 3000);
        };

        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('ended', handleEnded);
        container.addEventListener('mouseenter', handleMouseEnter);
        container.addEventListener('mouseleave', handleMouseLeave);
        container.addEventListener('touchstart', handleTouchStart, { passive: true });

        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('ended', handleEnded);
            container.removeEventListener('mouseenter', handleMouseEnter);
            container.removeEventListener('mouseleave', handleMouseLeave);
            container.removeEventListener('touchstart', handleTouchStart);
        };
    }, []);

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
                <div className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-2 mb-6 border border-white/20 mx-auto lg:hidden w-fit">
                    <span className="text-lg">🎅</span>
                    <span className="text-white/80 text-xs sm:text-sm whitespace-nowrap">Trusted by 10,000+ happy families</span>
                    <span className="text-lg">⭐</span>
                </div>

                {/* Two Column Layout */}
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left Column - Text and CTAs */}
                    <div className="text-center lg:text-left">
                        {/* Main Heading */}
                        <h1 className="heading-display text-4xl sm:text-5xl md:text-6xl lg:text-6xl mb-6 leading-tight text-center lg:text-center">
                            Create a Magical<br />
                            <span className="text-white">Video Message</span>
                            <br />
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
                                <div className="text-3xl sm:text-4xl font-bold text-[var(--gold)]">10-15min</div>
                                <div className="text-white/60 text-sm">Delivery Time</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Video Preview */}
                    <div className="relative max-w-2xl lg:max-w-none mx-auto lg:mx-0 pb-20 sm:pb-24 lg:pb-0">
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
                                    muted
                                    webkit-playsinline="true"
                                    x5-playsinline="true"
                                >
                                    <source src="https://blob.santagram.app/hero/hero.mp4" type="video/mp4" />
                                </video>

                                {/* Circular Play/Pause Button - Centered */}
                                {/* Always visible - shows play when paused, pause when playing */}
                                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                    <button
                                        onClick={togglePlayPause}
                                        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full backdrop-blur-sm flex items-center justify-center transition-all shadow-2xl touch-manipulation pointer-events-auto ${
                                            isPlaying 
                                                ? isHovered 
                                                    ? 'bg-black/60' 
                                                    : 'bg-black/40'
                                                : 'bg-white/40 hover:bg-white/60'
                                        }`}
                                        aria-label={isPlaying ? 'Pause video' : 'Play video'}
                                    >
                                        {isPlaying ? (
                                            <svg 
                                                className="w-10 h-10 sm:w-12 sm:h-12 text-white" 
                                                fill="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                            </svg>
                                        ) : (
                                            <svg 
                                                className="w-10 h-10 sm:w-12 sm:h-12 text-[var(--santa-red)] ml-1" 
                                                fill="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* Santa Image */}
                        <div className="absolute bottom-0 sm:-bottom-10 -right-10 w-32 h-32 sm:w-40 sm:h-40 animate-float z-50" style={{ left: '-16px' }}>
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
