import Link from 'next/link';

export default function TermsPage() {
    return (
        <div className="min-h-screen pt-24 pb-12">
            <div className="max-w-3xl mx-auto px-4">
                <h1 className="heading-display text-4xl sm:text-5xl mb-4 text-center">
                    Terms of Service 📜
                </h1>
                <p className="text-white/50 text-center mb-8">
                    Last updated: December 2024
                </p>

                <div className="glass-card prose prose-invert max-w-none">
                    <div className="space-y-6 text-white/80">
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
                            <p>
                                By accessing or using SantaGram (&quot;santagram.app&quot;), you agree to be bound by these
                                Terms of Service. If you do not agree to these terms, please do not use our service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">2. Service Description</h2>
                            <p>
                                SantaGram provides personalized video messages from a Santa Claus character.
                                Videos are generated using artificial intelligence technology and are intended
                                for entertainment purposes only.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">3. User Responsibilities</h2>
                            <p className="mb-2">When using our service, you agree to:</p>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li>Provide accurate information for video personalization</li>
                                <li>Use the service only for lawful purposes</li>
                                <li>Not submit inappropriate, offensive, or harmful content</li>
                                <li>Be at least 18 years old or have parental consent</li>
                                <li>Not resell or commercially distribute videos without permission</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">4. Payment and Pricing</h2>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li>All prices are displayed in USD</li>
                                <li>Payment is required before video generation</li>
                                <li>Payments are processed securely through Stripe</li>
                                <li>Prices may change without prior notice for future purchases</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">5. Refund Policy</h2>
                            <p>
                                We offer a 7-day money-back guarantee. If you are unsatisfied with your video
                                for any reason, contact us at{' '}
                                <a href="mailto:support@santagram.app" className="text-[var(--gold)] hover:underline">
                                    support@santagram.app
                                </a>{' '}
                                within 7 days of purchase for a full refund.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">6. Intellectual Property</h2>
                            <p>
                                Upon purchase, you receive a personal, non-exclusive license to use, download,
                                and share your personalized video for personal, non-commercial purposes.
                                SantaGram retains all rights to the underlying technology, templates, and
                                brand assets.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">7. Content Guidelines</h2>
                            <p className="mb-2">
                                We reserve the right to refuse service or refund payment if submitted content:
                            </p>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li>Contains inappropriate or offensive language</li>
                                <li>Promotes illegal activities</li>
                                <li>Infringes on third-party rights</li>
                                <li>Is intended to harass or harm</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">8. Disclaimer of Warranties</h2>
                            <p>
                                Our service is provided &quot;as is&quot; without warranties of any kind. While we strive
                                for high-quality videos, we cannot guarantee that videos will meet all expectations
                                or be error-free. Video generation times are estimates and may vary.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">9. Limitation of Liability</h2>
                            <p>
                                SantaGram shall not be liable for any indirect, incidental, special, or
                                consequential damages arising from your use of our service. Our total liability
                                shall not exceed the amount you paid for the service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">10. Service Availability</h2>
                            <p>
                                We strive to maintain service availability but do not guarantee uninterrupted
                                access. We reserve the right to modify, suspend, or discontinue the service
                                at any time with or without notice.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">11. Modifications to Terms</h2>
                            <p>
                                We may update these Terms of Service at any time. Continued use of the service
                                after changes constitutes acceptance of the modified terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">12. Governing Law</h2>
                            <p>
                                These terms shall be governed by and construed in accordance with applicable laws,
                                without regard to conflict of law principles.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">13. Contact Information</h2>
                            <p>
                                For questions about these Terms of Service, please contact us at:{' '}
                                <a href="mailto:support@santagram.app" className="text-[var(--gold)] hover:underline">
                                    support@santagram.app
                                </a>
                            </p>
                        </section>
                    </div>
                </div>

                <div className="text-center mt-8">
                    <Link href="/" className="btn-secondary">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
