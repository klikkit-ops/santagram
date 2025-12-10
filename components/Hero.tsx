import Link from 'next/link';
import Image from 'next/image';

export default function Hero() {
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
                <div className="relative max-w-2xl mx-auto">
                    <div className="glass-card p-2 glow-gold">
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-red-900/50 to-green-900/50 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-8xl mb-4">🎅</div>
                                <p className="text-white/80 text-lg">
                                    &quot;Ho ho ho! Hello there, <span className="text-[var(--gold)] font-semibold">[Child&apos;s Name]</span>!&quot;
                                </p>
                                <p className="text-white/60 text-sm mt-2">Preview of your personalized video</p>
                            </div>
                            {/* Play Button Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                                    <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
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
