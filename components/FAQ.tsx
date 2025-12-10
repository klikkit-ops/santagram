'use client';

import { useState } from 'react';

const faqs = [
    {
        question: 'How long does it take to receive my video?',
        answer: 'Most videos are ready within 2-5 minutes! You\'ll receive an email with a link to view and download your personalized Santa video as soon as it\'s ready.',
    },
    {
        question: 'How personalized is the video?',
        answer: 'Very personalized! Santa will mention your child by name, reference their specific achievements, interests, and even special details you provide. Each video is uniquely generated just for your child.',
    },
    {
        question: 'Can I preview the video before paying?',
        answer: 'We show you a preview of how the video structure looks, but the fully personalized video is generated after payment. Don\'t worry - we offer a 100% money-back guarantee if you\'re not completely satisfied!',
    },
    {
        question: 'What if I\'m not happy with the video?',
        answer: 'We offer a 100% money-back guarantee, no questions asked. If the video doesn\'t bring a smile to your child\'s face, just contact us within 7 days and we\'ll refund your purchase.',
    },
    {
        question: 'Can I download and save the video?',
        answer: 'Absolutely! You can download the video in HD quality and save it forever. Share it on social media, show it on Christmas morning, or keep it as a treasured memory.',
    },
    {
        question: 'Is this suitable for children of all ages?',
        answer: 'Yes! Our videos work great for children of all ages who believe in the magic of Santa. Whether your child is 3 or 10, they\'ll be amazed when Santa knows their name and accomplishments.',
    },
    {
        question: 'Can I order for multiple children?',
        answer: 'Yes! You can create a separate personalized video for each child. Each video is individually customized, so every child gets their own special message from Santa.',
    },
    {
        question: 'Is my payment secure?',
        answer: 'Absolutely. We use Stripe for payment processing, which is the same secure payment system used by companies like Amazon and Google. Your payment information is never stored on our servers.',
    },
];

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section id="faq" className="section-padding">
            <div className="max-w-3xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="heading-display text-4xl sm:text-5xl md:text-6xl mb-4">
                        Questions? We&apos;ve Got Answers! 🎁
                    </h2>
                    <p className="text-white/70 text-lg">
                        Everything you need to know about your magical Santa video
                    </p>
                </div>

                {/* FAQ Accordion */}
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div key={index} className="glass-card !p-0 overflow-hidden">
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                            >
                                <span className="font-semibold text-white">{faq.question}</span>
                                <span className={`text-xl text-[var(--gold)] transition-transform duration-300 ${openIndex === index ? 'rotate-45' : ''}`}>
                                    +
                                </span>
                            </button>
                            <div className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96' : 'max-h-0'}`}>
                                <div className="p-5 pt-0 text-white/70">
                                    {faq.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Still Have Questions */}
                <div className="mt-12 text-center glass-card">
                    <h3 className="text-xl font-semibold text-white mb-2">Still have questions?</h3>
                    <p className="text-white/70 mb-4">
                        Our friendly support team is here to help make your Christmas magical!
                    </p>
                    <a href="mailto:support@santagram.app" className="btn-secondary inline-flex">
                        Contact Support 📧
                    </a>
                </div>
            </div>
        </section>
    );
}
