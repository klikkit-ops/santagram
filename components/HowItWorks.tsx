'use client';

import Image from 'next/image';
import { useCurrency } from './CurrencyProvider';

const steps = [
    {
        number: '1',
        emoji: '✏️',
        title: 'Personalize',
        description: "Enter your child's name, age, achievements, and special interests. Santa will know exactly what to say!",
        image: '/elf.png',
    },
    {
        number: '2',
        emoji: '💳',
        title: 'Quick Checkout',
        description: null, // Will be set dynamically
        image: '/rudolph.png',
    },
    {
        number: '3',
        emoji: '🎬',
        title: 'Receive Your Video',
        description: "In just minutes, receive a personalized HD video message from Santa. Download, save, and share the magic!",
        image: '/snowman.png',
    },
];

export default function HowItWorks() {
    const { currency, isLoading } = useCurrency();

    const getStepDescription = (index: number) => {
        if (index === 1) {
            const price = isLoading ? '...' : currency.displayPrice;
            return `Secure payment for just ${price}. No subscriptions, no hidden fees. One magical video, one simple price.`;
        }
        return steps[index].description;
    };

    return (
        <section id="how-it-works" className="section-padding relative">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="heading-display text-4xl sm:text-5xl md:text-6xl mb-4">
                        How It Works 🎄
                    </h2>
                    <p className="text-white/70 text-lg max-w-2xl mx-auto">
                        Creating your magical Santa video is as easy as 1-2-3.
                        Get ready to see your child&apos;s face light up!
                    </p>
                </div>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {steps.map((step, index) => (
                        <div key={step.number} className="relative">
                            {/* Connector Line (hidden on mobile and last item) */}
                            {index < steps.length - 1 && (
                                <div className="hidden md:block absolute top-24 left-[60%] w-[80%] border-t-2 border-dashed border-white/20" />
                            )}

                            <div className="glass-card text-center relative h-full">
                                {/* Step Number */}
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[var(--santa-red)] flex items-center justify-center font-bold text-white shadow-lg">
                                    {step.number}
                                </div>

                                {/* Image */}
                                <div className="relative w-24 h-24 mx-auto mt-6 mb-4">
                                    <Image src={step.image} alt={step.title} fill className="object-contain" />
                                </div>

                                {/* Content */}
                                <div className="text-4xl mb-3">{step.emoji}</div>
                                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                                <p className="text-white/70">{getStepDescription(index)}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="text-center mt-12">
                    <p className="text-white/60 mb-4">Ready to create some Christmas magic?</p>
                    <a href="/create" className="btn-primary inline-flex">
                        Get Started Now 🎅
                    </a>
                </div>
            </div>
        </section>
    );
}
