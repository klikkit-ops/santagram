'use client';

import Link from 'next/link';
import { useCurrency } from './CurrencyProvider';

export default function FinalCTA() {
    const { currency, isLoading } = useCurrency();

    return (
        <section className="section-padding relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--santa-red)]/20 to-transparent" />

            <div className="relative max-w-4xl mx-auto text-center">
                <div className="text-6xl mb-6">🎅🎄✨</div>

                <h2 className="heading-display text-4xl sm:text-5xl md:text-6xl mb-6" style={{ height: '135px' }}>
                    Make This Christmas<br />
                    Unforgettable!
                </h2>

                <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
                    Don&apos;t miss the chance to create a magical moment your child will remember forever.
                    Over 10,000 families have already created their Santa videos this season!
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                    <Link href="/create" className="btn-primary text-lg py-4 px-10 animate-pulse-glow">
                        Create Your Santa Video 🎁
                    </Link>
                </div>

                <div className="flex items-center justify-center gap-6 text-white/60">
                    <span className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Only {isLoading ? '...' : currency.displayPrice}
                    </span>
                    <span className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Ready in Minutes
                    </span>
                    <span className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Money-back Guarantee
                    </span>
                </div>
            </div>
        </section>
    );
}
