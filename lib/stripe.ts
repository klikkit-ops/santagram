import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Only create the client if we have the key (allows build without env vars)
export const stripe = stripeSecretKey
    ? new Stripe(stripeSecretKey, {
        apiVersion: '2025-11-17.clover',
        typescript: true,
    })
    : null as unknown as Stripe;

export const PRICE_AMOUNT = 299; // $2.99 in cents
export const CURRENCY = 'usd';
