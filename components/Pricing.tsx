'use client';

import Link from 'next/link';
import { useCurrency } from './CurrencyProvider';

const features = [
    '🎬 Personalized HD Video Message',
    '🎅 Santa knows your child\'s name',
    '⭐ Mentions achievements & interests',
    '⚡ Ready in just minutes',
    '📱 Download & share instantly',
    '🔒 100% satisfaction guarantee',
];

export default function Pricing() {
    const { currency, isLoading } = useCurrency();

    return (
        <section id="pricing" className="section-padding relative">
            <div className="max-w-4xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="heading-display text-4xl sm:text-5xl md:text-6xl mb-4">
                        Simple, Magical Pricing ✨
                    </h2>
                    <p className="text-white/70 text-lg max-w-2xl mx-auto">
                        One video. One price. Endless Christmas joy.
                    </p>
                </div>

                {/* Pricing Card */}
                <div className="glass-card glow-gold relative overflow-hidden">

                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        {/* Left Side - Pricing */}
                        <div className="text-center md:text-left">
                            <div className="text-white/60 text-lg mb-2">Personalized Santa Video</div>
                            <div className="flex items-baseline justify-center md:justify-start gap-2 mb-4">
                                <span className="text-6xl font-bold text-white">
                                    {isLoading ? '...' : currency.displayPrice}
                                </span>
                                <span className="text-white/60">one-time</span>
                            </div>
                            <p className="text-white/70 mb-6">
                                No subscriptions. No hidden fees. Just pure Christmas magic delivered straight to your inbox.
                            </p>
                            <Link href="/create" className="btn-primary w-full md:w-auto text-lg py-4 px-8">
                                Create Your Video Now 🎁
                            </Link>
                            <div className="mt-4 flex items-center justify-center md:justify-start gap-2 text-sm text-white/60">
                                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Money-back guarantee</span>
                            </div>
                        </div>

                        {/* Right Side - Features */}
                        <div className="bg-white/5 rounded-2xl p-6">
                            <h4 className="text-white font-semibold mb-4 text-center md:text-left">What&apos;s Included:</h4>
                            <ul className="space-y-3">
                                {features.map((feature, index) => (
                                    <li key={index} className="flex items-center gap-3 text-white/80">
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap justify-center gap-6">
                        <div className="flex items-center gap-2 text-white/60">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm">Secure Payment</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-sm">4.9/5 Rating</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm">Minutes Delivery</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
