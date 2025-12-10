import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
    return (
        <footer className="bg-black/30 border-t border-white/10 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="flex items-center gap-3 mb-4">
                            <Image
                                src="/logo.png"
                                alt="SantaGram"
                                width={40}
                                height={40}
                                className="rounded-full"
                            />
                            <span className="heading-display text-xl">SantaGram</span>
                        </Link>
                        <p className="text-white/60 max-w-sm">
                            Create magical, personalized video messages from Santa Claus that will make your child&apos;s Christmas unforgettable.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Quick Links</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/#how-it-works" className="text-white/60 hover:text-white transition-colors">
                                    How it Works
                                </Link>
                            </li>
                            <li>
                                <Link href="/#pricing" className="text-white/60 hover:text-white transition-colors">
                                    Pricing
                                </Link>
                            </li>
                            <li>
                                <Link href="/#faq" className="text-white/60 hover:text-white transition-colors">
                                    FAQ
                                </Link>
                            </li>
                            <li>
                                <Link href="/create" className="text-white/60 hover:text-white transition-colors">
                                    Create Video
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Support</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/contact" className="text-white/60 hover:text-white transition-colors">
                                    Contact Us
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="text-white/60 hover:text-white transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-white/60 hover:text-white transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-white/40 text-sm">
                        © {new Date().getFullYear()} SantaGram. All rights reserved.
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-white/40 text-sm">Made with</span>
                        <span className="text-red-500">❤️</span>
                        <span className="text-white/40 text-sm">for magical Christmases</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
