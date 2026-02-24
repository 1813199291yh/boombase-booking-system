
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router } from './routes.js';

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sendAdminNotification, sendClientRequestReceived } from './email.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2025-12-15.clover',
});

const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_ANON_KEY as string
);

app.use(cors());

// Log every request
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Stripe Webhook Route (MUST be before express.json)
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        if (!endpointSecret || !sig) throw new Error('Missing Secret or Signature');
        event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            console.log('PaymentIntent was successful!', paymentIntent.id);

            // Update Booking Status to 'Pending Approval' (Paid)
            const { data: booking, error } = await supabase
                .from('bookings')
                .update({ status: 'Pending Approval' }) // Now it is ready for Admin
                .eq('stripe_payment_id', paymentIntent.id)
                .select()
                .single();

            if (booking) {
                console.log('Booking confirmed as paid, sending out notifications:', booking.id);
                // Trigger real customer notifications
                await sendAdminNotification(booking);
                await sendClientRequestReceived(booking);
            }
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.send();
});

// JSON middleware for other API routes
app.use(express.json());

app.use('/api', router);

app.get('/', (req, res) => {
    res.send('Boombase API is running');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
