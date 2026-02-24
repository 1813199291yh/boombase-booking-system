import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_ANON_KEY as string
);

async function simulateBookingFlow() {
    console.log('1. Mocking a new un-paid booking in Supabase...');
    const testPaymentId = 'pi_test_' + Math.random().toString(36).substring(7);

    // Create a mock booking
    const { data: booking, error } = await supabase
        .from('bookings')
        .insert([
            {
                customer_name: 'Webhook Tester',
                email: process.env.EMAIL_USER,
                court_type: 'Full Court',
                date: '2025-10-31',
                time: '08:00 PM',
                price: 150,
                status: 'Payment Pending', // Initial state
                stripe_payment_id: testPaymentId,
                waiver_signed: true,
                waiver_signature: 'Test Signature'
            }
        ])
        .select()
        .single();

    if (error) {
        console.error('Failed to create mock booking:', error);
        return;
    }
    console.log(`Created mock booking with ID: ${booking.id} and Payment ID: ${testPaymentId}`);

    console.log('\n2. Mocking a Stripe Webhook Event to localhost:3000/webhook ...');

    // Create a dummy Stripe event
    const payload = {
        id: "evt_test",
        object: "event",
        type: "payment_intent.succeeded",
        data: {
            object: {
                id: testPaymentId,
                object: "payment_intent",
                amount: 15000,
                status: "succeeded"
            }
        }
    };

    const payloadString = JSON.stringify(payload);
    const secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_bFaH1OQqkxkfZkCTofFuhXUchFa3yRyI';
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payloadString}`;
    const signature = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
    const stripeSignatureHeader = `t=${timestamp},v1=${signature}`;

    try {
        const res = await fetch('http://localhost:3000/webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Stripe-Signature': stripeSignatureHeader
            },
            body: payloadString
        });

        const text = await res.text();
        console.log(`Status: ${res.status}`);
        console.log(`Response: ${text}`);
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

simulateBookingFlow();
