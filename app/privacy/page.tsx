import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen pt-24 pb-12">
            <div className="max-w-3xl mx-auto px-4">
                <h1 className="heading-display text-4xl sm:text-5xl mb-4 text-center">
                    Privacy Policy 🔒
                </h1>
                <p className="text-white/50 text-center mb-8">
                    Last updated: December 2024
                </p>

                <div className="glass-card prose prose-invert max-w-none">
                    <div className="space-y-6 text-white/80">
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
                            <p>
                                SantaGram (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy.
                                This Privacy Policy explains how we collect, use, disclose, and safeguard your
                                information when you use our website and services at santagram.app.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
                            <p className="mb-2">We collect information you provide directly to us, including:</p>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li>Email address (for video delivery and order confirmation)</li>
                                <li>Child&apos;s first name, age, and gender (for video personalization)</li>
                                <li>Personalization details (achievements, interests, special messages)</li>
                                <li>Payment information (processed securely by Stripe)</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
                            <p className="mb-2">We use the information we collect to:</p>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li>Create and deliver your personalized Santa video</li>
                                <li>Process your payment</li>
                                <li>Send you order confirmations and video delivery emails</li>
                                <li>Respond to your customer service requests</li>
                                <li>Improve our services and user experience</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">4. Information Sharing</h2>
                            <p>
                                We do not sell, trade, or rent your personal information to third parties.
                                We may share information with:
                            </p>
                            <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                                <li><strong>Payment Processors:</strong> Stripe processes payments securely</li>
                                <li><strong>Video Generation:</strong> HeyGen for creating personalized videos</li>
                                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">5. Data Security</h2>
                            <p>
                                We implement appropriate security measures to protect your personal information.
                                All payment information is encrypted and processed through Stripe&apos;s secure
                                payment infrastructure. We do not store your credit card details.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">6. Data Retention</h2>
                            <p>
                                We retain your personal information for as long as necessary to provide our services
                                and fulfill the purposes outlined in this policy. Video files and personalization
                                data are automatically deleted 30 days after creation.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">7. Children&apos;s Privacy</h2>
                            <p>
                                Our service involves creating videos for children, but all purchases and account
                                interactions are conducted by parents or guardians. We do not knowingly collect
                                personal information directly from children under 13.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">8. Your Rights</h2>
                            <p className="mb-2">You have the right to:</p>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li>Access the personal information we hold about you</li>
                                <li>Request correction of inaccurate information</li>
                                <li>Request deletion of your information</li>
                                <li>Opt out of marketing communications</li>
                            </ul>
                            <p className="mt-2">
                                To exercise these rights, please contact us at{' '}
                                <a href="mailto:support@santagram.app" className="text-[var(--gold)] hover:underline">
                                    support@santagram.app
                                </a>.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">9. Cookies</h2>
                            <p>
                                We use essential cookies to ensure our website functions properly. We do not use
                                tracking or advertising cookies.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">10. Changes to This Policy</h2>
                            <p>
                                We may update this Privacy Policy from time to time. We will notify you of any
                                changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">11. Contact Us</h2>
                            <p>
                                If you have any questions about this Privacy Policy, please contact us at:{' '}
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
