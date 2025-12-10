import Link from 'next/link';
import Image from 'next/image';

export default function CancelPage() {
    return (
        <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
            <div className="max-w-lg mx-auto px-4 text-center">
                <div className="glass-card">
                    <div className="text-6xl mb-6">😔</div>

                    <h1 className="heading-display text-3xl sm:text-4xl mb-4">
                        Payment Cancelled
                    </h1>

                    <p className="text-white/70 text-lg mb-8">
                        No worries! Your payment was not processed. If you changed your mind, you can always come back and create your magical Santa video.
                    </p>

                    <div className="space-y-4">
                        <Link href="/create" className="btn-primary w-full">
                            Try Again 🎅
                        </Link>

                        <Link href="/" className="block text-white/60 hover:text-white transition-colors">
                            ← Back to Home
                        </Link>
                    </div>

                    {/* Help Section */}
                    <div className="mt-8 pt-6 border-t border-white/10">
                        <p className="text-white/50 text-sm mb-2">
                            Having trouble with payment?
                        </p>
                        <a
                            href="mailto:support@santagram.app"
                            className="text-[var(--gold)] hover:underline text-sm"
                        >
                            Contact our support team →
                        </a>
                    </div>
                </div>

                {/* Sad Santa */}
                <div className="relative w-32 h-32 mx-auto mt-8 opacity-50">
                    <Image src="/santa.png" alt="Santa" fill className="object-contain" />
                </div>
            </div>
        </div>
    );
}
