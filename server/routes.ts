
import { Router } from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sendAdminNotification, sendClientConfirmation, sendClientCancellation } from './email.js';

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
        const { customerName, email, courtType, date, time, price, waiverName, waiverSignature, status, recurringGroupId } = req.body;

        let stripePaymentId = 'manual-block';
        let bookingStatus = 'Pending Approval';
        let clientSecret: string | null = null;

        // 1. Create a PaymentIntent with Stripe (ONLY if price > 0)
        if (price > 0) {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(price * 100), // cents
                currency: 'usd',
                metadata: { customerName, email, courtType, date, time },
                automatic_payment_methods: { enabled: true },
            });
            stripePaymentId = paymentIntent.id;
            clientSecret = paymentIntent.client_secret as string | null;
        } else {
            // Allow status override for Admin Blocks (price 0)
            if (status) bookingStatus = status;
        }

        // 2. Save booking to Supabase
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
                    status: bookingStatus,
                    stripe_payment_id: stripePaymentId,
                    waiver_signed: true,
                    waiver_name: waiverName,
                    waiver_signature: waiverSignature,
                    recurring_group_id: recurringGroupId
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: error.message });
        }

        // Send Email to Admin (only if it's a real customer booking, i.e. price > 0 or not blocked)
        if (price > 0) {
            await sendAdminNotification(data);
        }

        res.json({ clientSecret, booking: data });
    } catch (error: any) {
        console.error('Error creating booking:', error);
        res.status(500).json({ error: error.message });
    }
});

// Bulk Create Bookings
router.post('/bookings/bulk', async (req, res) => {
    try {
        const { bookings } = req.body;
        if (!bookings || !Array.isArray(bookings) || bookings.length === 0) {
            return res.status(400).json({ error: 'Invalid bookings array' });
        }

        // Prepare data for insertion (map fields to snake_case)
        const dbBookings = bookings.map((b: any) => ({
            customer_name: b.customerName,
            email: b.email,
            court_type: b.courtType,
            date: b.date,
            time: b.time,
            price: b.price,
            status: b.status || 'Pending Approval',
            stripe_payment_id: 'manual-bulk-block',
            waiver_signed: b.waiverSigned,
            waiver_name: b.waiverName,
            recurring_group_id: b.recurringGroupId
        }));

        // Insert in batches if necessary (Supabase handles batch insert well, but 3000 might need chunking)
        // For simplicity, let's try direct insert first. Supabase limit is usually high.
        const { data, error } = await supabase
            .from('bookings')
            .insert(dbBookings)
            .select();

        if (error) throw error;

        res.json({ success: true, count: data.length });
    } catch (error: any) {
        console.error('Error bulk creating bookings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Helper to map DB to Frontend
const mapBooking = (b: any) => ({
    ...b,
    customerName: b.customer_name,
    courtType: b.court_type,
    stripePaymentId: b.stripe_payment_id,
    waiverSigned: b.waiver_signed,
    waiverName: b.waiver_name,
    waiverSignature: b.waiver_signature
});

// Get Bookings
router.get('/bookings', async (req, res) => {
    try {
        const { start, end } = req.query;

        let query = supabase.from('bookings').select('*');

        if (start) {
            query = query.gte('date', start);
        }
        if (end) {
            query = query.lte('date', end);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Map to frontend structure
        const bookings = data.map(mapBooking);
        res.json(bookings);
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

        // If status changed to Confirmed, send email to client
        if (status === 'Confirmed') {
            await sendClientConfirmation(data);
        } else if (status === 'Cancelled') {
            await sendClientCancellation(data);
        }

        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update booking details (e.g. rename)
router.post('/bookings/:id/update', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body; // { customerName, courtType, etc }

        // Map frontend camelCase to snake_case if necessary, or just rely on what's passed
        // For simplicity, let's assume we map 'customerName' to 'customer_name'
        const dbUpdates: any = {};
        if (updates.customerName) dbUpdates.customer_name = updates.customerName;
        // Add other fields if needed

        if (Object.keys(dbUpdates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        const { data, error } = await supabase
            .from('bookings')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json(mapBooking(data));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Booking Series
router.post('/bookings/delete-series', async (req, res) => {
    try {
        const { groupId } = req.body;
        if (!groupId) return res.status(400).json({ error: 'Missing groupId' });

        // Update all bookings in this group to 'Cancelled'
        const { data, error } = await supabase
            .from('bookings')
            .update({ status: 'Cancelled' })
            .eq('recurring_group_id', groupId)
            .select();

        if (error) throw error;
        res.json({ success: true, count: data.length });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Settings Routes
router.get('/settings', async (req, res) => {
    try {
        const { data, error } = await supabase.from('settings').select('*');
        if (error) throw error;

        // Convert array to object { key: value }
        const settings = data.reduce((acc: any, curr: any) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        res.json(settings);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/settings/update', async (req, res) => {
    try {
        const updates = req.body; // Expect { key: value, key2: value2 }

        // Process each update
        const promises = Object.entries(updates).map(([key, value]) => {
            return supabase
                .from('settings')
                .upsert({ key, value: String(value) })
                .select();
        });

        await Promise.all(promises);
        res.json({ success: true });
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


