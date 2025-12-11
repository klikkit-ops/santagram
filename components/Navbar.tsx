'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 sm:h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 sm:gap-3">
                        <Image
                            src="/logo.png"
                            alt="SantaGram"
                            width={40}
                            height={40}
                            className="rounded-full sm:w-[50px] sm:h-[50px]"
                        />
                        <span className="heading-display text-lg sm:text-xl md:text-2xl">
                            SantaGram
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/#how-it-works" className="text-white/80 hover:text-white transition-colors">
                            How it Works
                        </Link>
                        <Link href="/#pricing" className="text-white/80 hover:text-white transition-colors">
                            Pricing
                        </Link>
                        <Link href="/#faq" className="text-white/80 hover:text-white transition-colors">
                            FAQ
                        </Link>
                        <Link href="/create" className="btn-primary text-sm py-2 px-5">
                            Create Video ✨
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden text-white p-2"
                        aria-label="Toggle menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 border-t border-white/10">
                        <div className="flex flex-col gap-4">
                            <Link
                                href="/#how-it-works"
                                className="text-white/80 hover:text-white transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                How it Works
                            </Link>
                            <Link
                                href="/#pricing"
                                className="text-white/80 hover:text-white transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Pricing
                            </Link>
                            <Link
                                href="/#faq"
                                className="text-white/80 hover:text-white transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                FAQ
                            </Link>
                            <Link
                                href="/create"
                                className="btn-primary text-sm py-2 px-5 text-center"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Create Video ✨
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
