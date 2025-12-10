import { NextRequest, NextResponse } from 'next/server';
import { stripe, PRICE_AMOUNT, CURRENCY } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

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
        } = body;

        // Validate required fields
        if (!childName || !email || !messageType) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: email,
            line_items: [
                {
                    price_data: {
                        currency: CURRENCY,
                        product_data: {
                            name: 'Personalized Santa Video Message',
                            description: `A magical video message from Santa for ${childName}`,
                            images: ['https://santagram.app/santa.png'],
                        },
                        unit_amount: PRICE_AMOUNT,
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
            },
        });

        // Store order in Supabase with pending status
        const { error: dbError } = await supabase.from('orders').insert({
            stripe_session_id: session.id,
            email,
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
