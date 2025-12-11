const testimonials = [
    {
        name: 'Sarah M.',
        location: 'Texas, USA',
        rating: 5,
        text: "My daughter's face when Santa said her name was PRICELESS! She couldn't believe it. Best money I've ever spent. Already ordered one for my nephew!",
        child: 'Emma, 6',
    },
    {
        name: 'Michael R.',
        location: 'London, UK',
        rating: 5,
        text: 'The personalization blew me away. Santa mentioned my son\'s soccer achievements and his pet hamster. He was convinced it was the real Santa!',
        child: 'James, 8',
    },
    {
        name: 'Jennifer L.',
        location: 'Toronto, Canada',
        rating: 5,
        text: "We've watched the video at least 50 times! My twins ask to see 'their Santa video' every night before bed. Truly magical experience.",
        child: 'Olivia & Ethan, 5',
    },
    {
        name: 'David K.',
        location: 'Sydney, Australia',
        rating: 5,
        text: 'Super easy to create and delivered in minutes. The quality is amazing and Santa\'s message was perfect. Made our Christmas morning extra special!',
        child: 'Lily, 4',
    },
    {
        name: 'Amanda T.',
        location: 'Florida, USA',
        rating: 5,
        text: 'I was skeptical at first but WOW. The video looks so real and personal. My son is still talking about how Santa knew about his loose tooth!',
        child: 'Noah, 7',
    },
    {
        name: 'Chris B.',
        location: 'Dublin, Ireland',
        rating: 5,
        text: 'Grandparents loved sending this to the grandkids overseas. Brought tears to everyone\'s eyes. The Christmas magic is REAL with this service!',
        child: 'Multiple grandchildren',
    },
];

export default function Testimonials() {
    return (
        <section className="section-padding bg-black/20">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="heading-display text-4xl sm:text-5xl md:text-6xl mb-4">
                        Magical Moments 💫
                    </h2>
                    <p className="text-white/70 text-lg max-w-2xl mx-auto">
                        Join thousands of families who&apos;ve created unforgettable Christmas memories
                    </p>
                </div>

                {/* Testimonials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.map((testimonial, index) => (
                        <div key={index} className="glass-card">
                            {/* Rating */}
                            <div className="flex gap-1 mb-3">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <span key={i} className="text-[var(--gold)]">⭐</span>
                                ))}
                            </div>

                            {/* Quote */}
                            <p className="text-white/80 mb-4 italic">&ldquo;{testimonial.text}&rdquo;</p>

                            {/* Author */}
                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                <div>
                                    <div className="font-semibold text-white">{testimonial.name}</div>
                                    <div className="text-white/50 text-sm">{testimonial.location}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[var(--gold)] text-sm font-medium">Child</div>
                                    <div className="text-white/70 text-sm">{testimonial.child}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom Stats */}
                <div className="mt-12 text-center">
                    <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-6 glass-card py-4 px-6 sm:px-8">
                        <div className="flex items-center gap-2">
                            <span className="text-3xl">😊</span>
                            <div className="text-left">
                                <div className="text-xl font-bold text-white">10,000+</div>
                                <div className="text-white/60 text-sm">Happy Families</div>
                            </div>
                        </div>
                        <div className="hidden sm:block w-px h-12 bg-white/20" />
                        <div className="sm:hidden w-24 h-px bg-white/20" />
                        <div className="flex items-center gap-2">
                            <span className="text-3xl">⭐</span>
                            <div className="text-left">
                                <div className="text-xl font-bold text-white">4.9/5</div>
                                <div className="text-white/60 text-sm">Average Rating</div>
                            </div>
                        </div>
                        <div className="hidden sm:block w-px h-12 bg-white/20" />
                        <div className="sm:hidden w-24 h-px bg-white/20" />
                        <div className="flex items-center gap-2">
                            <span className="text-3xl">🎬</span>
                            <div className="text-left">
                                <div className="text-xl font-bold text-white">50,000+</div>
                                <div className="text-white/60 text-sm">Videos Created</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
