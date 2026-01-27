
import { Router } from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const router = Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
    apiVersion: '2024-12-18.acacia' as any, // Use latest or what types support
});

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'mock-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Auth ---

router.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Simple check against env variables
    const validEmail = process.env.ADMIN_EMAIL;
    const validPass = process.env.ADMIN_PASSWORD;

    if (email === validEmail && password === validPass) {
        return res.json({ success: true, token: 'mock-admin-token' });
    } else {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
});

// --- Bookings ---

// Create a booking & Payment Intent
router.post('/bookings', async (req, res) => {
    try {
        const { customerName, email, courtType, date, time, price, waiverName, waiverSignature } = req.body;

        // 1. Create a PaymentIntent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(price * 100), // cents
            currency: 'usd',
            metadata: { customerName, email, courtType, date, time },
            automatic_payment_methods: { enabled: true },
        });

        // 2. Save booking to Supabase (Initial status: Pending Payment)
        const { data, error } = await supabase
            .from('bookings')
            .insert([
                {
                    customer_name: customerName,
                    email,
                    court_type: courtType,
                    date,
                    time,
                    price,
                    status: 'Pending Payment',
                    stripe_payment_id: paymentIntent.id,
                    waiver_signed: true,
                    waiver_name: waiverName,
                    waiver_signature: waiverSignature
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            // Ensure we don't leave a hanging payment intent if DB fails? 
            // For MVP, just return error
            return res.status(500).json({ error: error.message });
        }

        res.json({ clientSecret: paymentIntent.client_secret, booking: data });
    } catch (error: any) {
        console.error('Error creating booking:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all bookings (for Admin)
router.get('/bookings', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update booking status
router.post('/bookings/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const { data, error } = await supabase
            .from('bookings')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- Payouts ---

// Get payout history
router.get('/payouts', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('payouts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Request Payout
router.post('/payouts/request', async (req, res) => {
    try {
        const { amount } = req.body; // Amount to payout

        // 1. Create a Connect Payout (Transfer) in Stripe
        // NOTE: This requires a connected account ID. 
        // For this demo, we'll assume a fixed connected account or just simulate it.
        // In production, you'd store the connected_account_id in the user's profile.

        // Simulating call:
        // const transfer = await stripe.transfers.create({
        //   amount: Math.round(amount * 100),
        //   currency: 'usd',
        //   destination: 'acct_123456789', // Target connected account
        // });

        // For demo purposes, we will mock the Stripe response since we don't have a real connected account set up
        const mockTransferId = `tr_${Math.random().toString(36).substring(7)}`;

        // 2. Record in Supabase
        const { data, error } = await supabase
            .from('payouts')
            .insert([
                {
                    amount,
                    status: 'Processing',
                    stripe_payout_id: mockTransferId,
                    created_at: new Date().toISOString() // Explicitly setting if DB default not set
                }
            ])
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, payout: data });
    } catch (error: any) {
        console.error('Error requesting payout:', error);
        res.status(500).json({ error: error.message });
    }
});
