'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCurrency } from '@/components/CurrencyProvider';

const messageTypes = [
    { id: 'christmas-morning', label: 'Christmas Morning', emoji: '🎄', description: 'Perfect for watching on Christmas Day!' },
    { id: 'bedtime', label: 'Bedtime Message', emoji: '🌙', description: 'Help them sleep while waiting for Santa' },
    { id: 'encouragement', label: 'Encouragement', emoji: '⭐', description: 'Boost their confidence and motivation' },
];

export default function CreatePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { currency, isLoading: currencyLoading } = useCurrency();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        childName: '',
        childAge: '',
        childGender: '',
        achievements: '',
        interests: '',
        specialMessage: '',
        messageType: 'christmas-morning',
        email: '',
    });

    // Pre-fill form data from URL query params (when coming from hero page)
    useEffect(() => {
        const childName = searchParams.get('childName');
        const childAge = searchParams.get('childAge');
        const childGender = searchParams.get('childGender');
        
        if (childName || childAge || childGender) {
            setFormData(prev => ({
                ...prev,
                childName: childName || prev.childName,
                childAge: childAge || prev.childAge,
                childGender: childGender || prev.childGender,
            }));
        }
    }, [searchParams]);

    const updateFormData = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    currency: currency.code,
                }),
            });

            const data = await response.json();

            if (data.url) {
                router.push(data.url);
            } else {
                alert('Something went wrong. Please try again.');
                setIsLoading(false);
            }
        } catch {
            alert('Something went wrong. Please try again.');
            setIsLoading(false);
        }
    };

    const canProceedStep1 = formData.childName && formData.childGender;
    const canProceedStep2 = true; // Optional fields
    const canProceedStep3 = formData.messageType;
    const canSubmit = formData.email && formData.email.includes('@');

    return (
        <>
            {/* SEO Metadata via next/head equivalent - Next.js handles this automatically via layout */}
            <div className="min-h-screen pt-24 pb-12">
                <div className="max-w-2xl mx-auto px-4">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="heading-display text-4xl sm:text-5xl mb-4">
                            Create Your Video 🎅
                        </h1>
                        <p className="text-white/70">
                            Tell us about your child so Santa can create the perfect personalized message!
                        </p>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-center gap-4 mb-8">
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="flex items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${step >= s
                                        ? 'bg-[var(--santa-red)] text-white'
                                        : 'bg-white/10 text-white/40'
                                        }`}
                                >
                                    {s}
                                </div>
                                {s < 4 && (
                                    <div
                                        className={`w-8 h-0.5 ${step > s ? 'bg-[var(--santa-red)]' : 'bg-white/20'}`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Form Card */}
                    <div className="glass-card">
                        {/* Step 1: Child Details */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                    <span className="text-2xl">👶</span> Child&apos;s Details
                                </h2>

                                <div>
                                    <label className="block text-white/80 mb-2">Child&apos;s First Name *</label>
                                    <input
                                        type="text"
                                        value={formData.childName}
                                        onChange={(e) => updateFormData('childName', e.target.value)}
                                        placeholder="e.g., Emma"
                                        className="input-festive"
                                    />
                                </div>

                                <div>
                                    <label className="block text-white/80 mb-2">Age (optional)</label>
                                    <input
                                        type="number"
                                        value={formData.childAge}
                                        onChange={(e) => updateFormData('childAge', e.target.value)}
                                        placeholder="e.g., 7"
                                        min="1"
                                        max="18"
                                        className="input-festive"
                                    />
                                </div>

                                <div>
                                    <label className="block text-white/80 mb-2">Gender *</label>
                                    <div className="flex gap-4">
                                        {['boy', 'girl', 'prefer not to say'].map((gender) => (
                                            <button
                                                key={gender}
                                                type="button"
                                                onClick={() => updateFormData('childGender', gender)}
                                                className={`flex-1 p-3 rounded-xl border transition-all ${formData.childGender === gender
                                                    ? 'border-[var(--gold)] bg-[var(--gold)]/10 text-white'
                                                    : 'border-white/20 bg-white/5 text-white/60 hover:bg-white/10'
                                                    }`}
                                            >
                                                {gender === 'boy' ? '👦' : gender === 'girl' ? '👧' : '🧒'} {gender.charAt(0).toUpperCase() + gender.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!canProceedStep1}
                                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Continue →
                                </button>
                            </div>
                        )}

                        {/* Step 2: Personalization */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                    <span className="text-2xl">✨</span> Personalization
                                </h2>

                                <div>
                                    <label className="block text-white/80 mb-2">
                                        Achievements or Good Behaviors (optional)
                                    </label>
                                    <textarea
                                        value={formData.achievements}
                                        onChange={(e) => updateFormData('achievements', e.target.value)}
                                        placeholder="e.g., Got great grades, helped with chores, was kind to siblings..."
                                        rows={3}
                                        className="input-festive resize-none"
                                    />
                                    <p className="text-white/50 text-sm mt-1">Santa will mention these in the video!</p>
                                </div>

                                <div>
                                    <label className="block text-white/80 mb-2">
                                        Interests & Hobbies (optional)
                                    </label>
                                    <textarea
                                        value={formData.interests}
                                        onChange={(e) => updateFormData('interests', e.target.value)}
                                        placeholder="e.g., dinosaurs, soccer, drawing, video games..."
                                        rows={2}
                                        className="input-festive resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-white/80 mb-2">
                                        Additional Message for Santa to Say (optional)
                                    </label>
                                    <textarea
                                        value={formData.specialMessage}
                                        onChange={(e) => updateFormData('specialMessage', e.target.value)}
                                        placeholder="e.g., Santa will say: 'I heard you're leaving cookies by the fireplace!' or 'Give Fluffy the dog a pat from me!'"
                                        rows={2}
                                        className="input-festive resize-none"
                                    />
                                    <p className="text-white/50 text-sm mt-1">This will be included in Santa's video message!</p>
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={() => setStep(1)} className="btn-secondary flex-1">
                                        ← Back
                                    </button>
                                    <button onClick={() => setStep(3)} className="btn-primary flex-1">
                                        Continue →
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Message Type */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                    <span className="text-2xl">🎬</span> Message Type
                                </h2>

                                <div className="space-y-3">
                                    {messageTypes.map((type) => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => updateFormData('messageType', type.id)}
                                            className={`w-full p-4 rounded-xl border text-left transition-all ${formData.messageType === type.id
                                                ? 'border-[var(--gold)] bg-[var(--gold)]/10'
                                                : 'border-white/20 bg-white/5 hover:bg-white/10'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-3xl">{type.emoji}</span>
                                                <div>
                                                    <div className="font-semibold text-white">{type.label}</div>
                                                    <div className="text-white/60 text-sm">{type.description}</div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={() => setStep(2)} className="btn-secondary flex-1">
                                        ← Back
                                    </button>
                                    <button
                                        onClick={() => setStep(4)}
                                        disabled={!canProceedStep3}
                                        className="btn-primary flex-1"
                                    >
                                        Continue →
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Review & Checkout */}
                        {step === 4 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                    <span className="text-2xl">📋</span> Review & Checkout
                                </h2>

                                {/* Preview Summary */}
                                <div className="bg-white/5 rounded-xl p-4 space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-white/60">Child&apos;s Name:</span>
                                        <span className="text-white font-medium">{formData.childName}</span>
                                    </div>
                                    {formData.childAge && (
                                        <div className="flex justify-between">
                                            <span className="text-white/60">Age:</span>
                                            <span className="text-white">{formData.childAge} years old</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-white/60">Message Type:</span>
                                        <span className="text-white">
                                            {messageTypes.find(t => t.id === formData.messageType)?.label}
                                        </span>
                                    </div>
                                    {formData.achievements && (
                                        <div className="flex justify-between">
                                            <span className="text-white/60">Achievements:</span>
                                            <span className="text-white text-right max-w-[200px] truncate">{formData.achievements}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Email Input */}
                                <div>
                                    <label className="block text-white/80 mb-2">Email Address *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => updateFormData('email', e.target.value)}
                                        placeholder="your@email.com"
                                        className="input-festive"
                                    />
                                    <p className="text-white/50 text-sm mt-1">We&apos;ll send the video to this email</p>
                                </div>

                                {/* Price */}
                                <div className="glass-card !bg-[var(--santa-red)]/10 border-[var(--santa-red)]/30 flex items-center justify-between">
                                    <div>
                                        <div className="text-white font-semibold">Personalized Santa Video</div>
                                        <div className="text-white/60 text-sm">HD quality, ready in minutes</div>
                                    </div>
                                    <div className="text-3xl font-bold text-[var(--gold)]">
                                        {currencyLoading ? '...' : currency.displayPrice}
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={() => setStep(3)} className="btn-secondary flex-1">
                                        ← Back
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!canSubmit || isLoading}
                                        className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Processing...
                                            </span>
                                        ) : (
                                            'Pay Now 🎁'
                                        )}
                                    </button>
                                </div>

                                {/* Trust Badges */}
                                <div className="flex items-center justify-center gap-4 pt-4 border-t border-white/10 text-white/50 text-sm">
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                        Secure Payment
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Money-back Guarantee
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Santa Character */}
                    <div className="relative mt-8 flex justify-center">
                        <div className="relative w-32 h-32 animate-float">
                            <Image src="/santa.png" alt="Santa" fill className="object-contain" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

interface FormData {
    childName: string;
    childAge: string;
    childGender: string;
    achievements: string;
    interests: string;
    specialMessage: string;
    messageType: string;
    email: string;
}
