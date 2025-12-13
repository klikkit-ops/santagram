'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/components/CurrencyProvider';

export default function Hero() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { currency } = useCurrency();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [formData, setFormData] = useState({
        childName: '',
        childAge: '',
        childGender: '',
    });

    const togglePlayPause = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const video = videoRef.current;
        if (!video) {
            console.log('Video ref not available');
            return;
        }

        // Mark that user has interacted
        setHasInteracted(true);

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
            
            // On mobile, auto-hide pause button after 3 seconds
            if (window.innerWidth < 1024) { // lg breakpoint
                setTimeout(() => {
                    setIsHovered(false);
                }, 3000);
            }
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
            // Auto-hide pause button after 3 seconds on mobile when playing
            if (isPlaying) {
                setTimeout(() => {
                    setIsHovered(false);
                }, 3000);
            }
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
                {/* Two Column Layout */}
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left Column - Text and CTAs */}
                    <div className="text-center lg:text-left order-1 lg:order-1">
                        {/* Main Heading */}
                        <h1 className="heading-display text-4xl sm:text-5xl md:text-6xl lg:text-6xl mb-6 leading-tight text-center lg:text-center">
                            <span className="lg:hidden">
                                Create a Magical<br />
                                <span className="text-white">Video Message from Santa!</span>
                            </span>
                            <span className="hidden lg:inline">
                                Create a Magical<br />
                                <span className="text-white">Video Message</span>
                                <br />
                                <span className="text-white">from Santa!</span>
                            </span>
                        </h1>

                        {/* Subheadline - Hidden on mobile, shown on desktop */}
                        <p className="hidden lg:block text-xl sm:text-2xl text-white/80 max-w-3xl lg:max-w-none mx-auto lg:mx-0 mb-10 leading-relaxed">
                            Personalized videos where Santa knows your child&apos;s name,
                            achievements, and special message. Make this Christmas truly magical! ✨
                        </p>

                        {/* CTAs - Hidden on mobile, shown on desktop */}
                        <div className="hidden lg:flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                            <Link href="/create" className="btn-primary text-lg py-4 px-8 animate-pulse-glow">
                                Create Your Video Now 🎁
                            </Link>
                            <a href="#how-it-works" className="btn-secondary text-lg py-4 px-8">
                                See How It Works
                            </a>
                        </div>

                        {/* Stats - Hidden on mobile, shown on desktop */}
                        <div className="hidden lg:grid grid-cols-3 gap-8 max-w-2xl lg:max-w-none mx-auto lg:mx-0">
                            <div className="text-center lg:text-left">
                                <div className="text-3xl sm:text-4xl font-bold text-[var(--gold)]">10K+</div>
                                <div className="text-white/60 text-sm">Happy Kids</div>
                            </div>
                            <div className="text-center lg:text-left">
                                <div className="text-3xl sm:text-4xl font-bold text-[var(--gold)]">4.9★</div>
                                <div className="text-white/60 text-sm">Parent Rating</div>
                            </div>
                            <div className="text-center lg:text-left">
                                <div className="text-3xl sm:text-4xl font-bold text-[var(--gold)]">10 min</div>
                                <div className="text-white/60 text-sm">Delivery Time</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Video Preview (moved up on mobile) */}
                    <div className="relative max-w-2xl lg:max-w-none mx-auto lg:mx-0 pb-20 sm:pb-24 lg:pb-0 order-2 lg:order-2">
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
                                    preload="metadata"
                                    poster="https://blob.santagram.app/hero/hero-poster.jpg"
                                    webkit-playsinline="true"
                                    x5-playsinline="true"
                                    onLoadedMetadata={(e) => {
                                        // Set video to first frame (still preview)
                                        const video = e.currentTarget;
                                        if (!hasInteracted) {
                                            video.currentTime = 0;
                                        }
                                    }}
                                >
                                    <source src="https://blob.santagram.app/hero/hero.mp4" type="video/mp4" />
                                </video>

                                {/* Circular Play/Pause Button - Centered */}
                                {/* Play button always visible when paused, pause button only on hover/tap when playing */}
                                {/* On mobile, pause button auto-hides after 3 seconds */}
                                {(!isPlaying || isHovered) && (
                                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                        <button
                                            type="button"
                                            onClick={togglePlayPause}
                                            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full backdrop-blur-sm flex items-center justify-center transition-all shadow-2xl touch-manipulation pointer-events-auto cursor-pointer ${
                                                isPlaying 
                                                    ? 'bg-black/60' 
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
                                )}
                            </div>
                        </div>
                        {/* Santa Image */}
                        <div className="absolute bottom-0 sm:-bottom-10 -right-10 w-32 h-32 sm:w-40 sm:h-40 animate-float z-50" style={{ left: '-16px' }}>
                            <Image src="/santa.png" alt="Santa Claus" fill className="object-contain drop-shadow-2xl" />
                        </div>
                    </div>

                    {/* Mobile-only content (after video) */}
                    <div className="lg:hidden order-3 w-full">
                        {/* CTAs - Shown on mobile after video, above subheading */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
                            <Link href="/create" className="btn-primary text-lg py-4 px-8 animate-pulse-glow">
                                Create Your Video Now 🎁
                            </Link>
                            <a href="#how-it-works" className="btn-secondary text-lg py-4 px-8">
                                See How It Works
                            </a>
                        </div>

                        {/* Subheadline - Shown on mobile after video and CTAs */}
                        <p className="text-xl sm:text-2xl text-white/80 max-w-3xl mx-auto mb-10 leading-relaxed text-center">
                            Personalized videos where Santa knows your child&apos;s name,
                            achievements, and special message. Make this Christmas truly magical! ✨
                        </p>

                        {/* Stats - Shown on mobile after video */}
                        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-10">
                            <div className="text-center">
                                <div className="text-3xl sm:text-4xl font-bold text-[var(--gold)]">10K+</div>
                                <div className="text-white/60 text-sm">Happy Kids</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl sm:text-4xl font-bold text-[var(--gold)]">4.9★</div>
                                <div className="text-white/60 text-sm">Parent Rating</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl sm:text-4xl font-bold text-[var(--gold)]">10 min</div>
                                <div className="text-white/60 text-sm">Delivery Time</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* First Step of Create Flow */}
                <div className="mt-12 max-w-2xl mx-auto">
                    <div className="glass-card">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
                            <span className="text-2xl">👶</span> Child&apos;s Details
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-white/80 mb-2">Child&apos;s First Name *</label>
                                <input
                                    type="text"
                                    value={formData.childName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, childName: e.target.value }))}
                                    placeholder="e.g., Emma"
                                    className="input-festive w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-white/80 mb-2">Age (optional)</label>
                                <input
                                    type="number"
                                    value={formData.childAge}
                                    onChange={(e) => setFormData(prev => ({ ...prev, childAge: e.target.value }))}
                                    placeholder="e.g., 7"
                                    min="1"
                                    max="18"
                                    className="input-festive w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-white/80 mb-2">Gender *</label>
                                <div className="flex gap-4">
                                    {['boy', 'girl', 'prefer not to say'].map((gender) => (
                                        <button
                                            key={gender}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, childGender: gender }))}
                                            className={`flex-1 p-3 rounded-xl border transition-all ${
                                                formData.childGender === gender
                                                    ? 'border-[var(--gold)] bg-[var(--gold)]/10 text-white'
                                                    : 'border-white/20 bg-white/5 text-white/60 hover:bg-white/10'
                                            }`}
                                        >
                                            {gender === 'boy' ? '👦' : gender === 'girl' ? '👧' : '🧒'} {gender.charAt(0).toUpperCase() + gender.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Link
                                href={{
                                    pathname: '/create',
                                    query: {
                                        childName: formData.childName,
                                        childAge: formData.childAge,
                                        childGender: formData.childGender,
                                    },
                                }}
                                className={`btn-primary w-full text-center block ${
                                    !formData.childName || !formData.childGender
                                        ? 'opacity-50 cursor-not-allowed pointer-events-none'
                                        : ''
                                }`}
                            >
                                Continue to Personalization →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
