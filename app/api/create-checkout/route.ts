import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { getCurrencyByCode, currencies, DEFAULT_CURRENCY } from '@/lib/currency';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            childName,
            childAge,
            childGender,
            achievements,
            interests,
            specialMessage,
            messageType,
            email,
            currency: currencyCode,
        } = body;

        // Validate required fields
        if (!childName || !messageType) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate email format if provided (email is optional)
        if (email && (!email.includes('@') || email.length < 3)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Get currency config (default to GBP)
        const currencyConfig = currencyCode
            ? getCurrencyByCode(currencyCode)
            : currencies[DEFAULT_CURRENCY];

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            ...(email && { customer_email: email }), // Only include email if provided
            line_items: [
                {
                    price_data: {
                        currency: currencyConfig.code.toLowerCase(),
                        product_data: {
                            name: 'Personalized Santa Video Message',
                            description: `A magical video message from Santa for ${childName}`,
                            images: ['https://santagram.app/santa.png'],
                        },
                        unit_amount: currencyConfig.price,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/cancel`,
            metadata: {
                childName,
                childAge: childAge || '',
                childGender,
                achievements: achievements || '',
                interests: interests || '',
                specialMessage: specialMessage || '',
                messageType,
                currency: currencyConfig.code,
            },
        });

        // Store order in Supabase with pending status
        const { error: dbError } = await supabase.from('orders').insert({
            stripe_session_id: session.id,
            email: email || null,
            customer_email: email || null, // Also set customer_email for email delivery (optional)
            child_name: childName,
            child_age: childAge ? parseInt(childAge) : null,
            child_gender: childGender,
            personalization: {
                achievements,
                interests,
                special_message: specialMessage,
            },
            message_type: messageType,
            status: 'pending',
        });

        if (dbError) {
            console.error('Database error:', dbError);
            // Continue anyway - we can create the order from webhook if needed
        }

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
