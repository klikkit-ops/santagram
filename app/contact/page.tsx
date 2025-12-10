import Link from 'next/link';

export default function ContactPage() {
    return (
        <div className="min-h-screen pt-24 pb-12">
            <div className="max-w-3xl mx-auto px-4">
                <h1 className="heading-display text-4xl sm:text-5xl mb-8 text-center">
                    Contact Us 📧
                </h1>

                <div className="glass-card mb-8">
                    <p className="text-white/80 mb-6">
                        We&apos;re here to help make your Christmas magical! If you have any questions,
                        concerns, or just want to say hello, we&apos;d love to hear from you.
                    </p>

                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                                <span>📩</span> Email Support
                            </h2>
                            <p className="text-white/70 mb-2">
                                For all inquiries, please email us at:
                            </p>
                            <a
                                href="mailto:support@santagram.app"
                                className="text-[var(--gold)] hover:underline text-lg"
                            >
                                support@santagram.app
                            </a>
                            <p className="text-white/50 text-sm mt-2">
                                We typically respond within 24 hours.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                                <span>⏰</span> Support Hours
                            </h2>
                            <p className="text-white/70">
                                Monday - Friday: 9:00 AM - 6:00 PM (EST)<br />
                                Saturday - Sunday: 10:00 AM - 4:00 PM (EST)
                            </p>
                            <p className="text-white/50 text-sm mt-2">
                                Extended hours during the Christmas season (Dec 1-25)
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                                <span>❓</span> Common Questions
                            </h2>
                            <p className="text-white/70">
                                Before reaching out, you might find your answer in our{' '}
                                <Link href="/#faq" className="text-[var(--gold)] hover:underline">
                                    FAQ section
                                </Link>.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                                <span>🔄</span> Refunds
                            </h2>
                            <p className="text-white/70">
                                If you&apos;re not satisfied with your video for any reason, please contact us
                                within 7 days of purchase for a full refund. We want every family to have
                                a magical experience!
                            </p>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <Link href="/" className="btn-secondary">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
