import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { api } from '../src/api';
import { Booking } from '../types';

// Load Stripe key from env
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentModalProps {
    bookingData: Partial<Booking>;
    onSuccess: (booking: Booking) => void;
    onCancel: () => void;
}

const CheckoutForm: React.FC<{ onSuccess: (booking: Booking) => void, bookingData: Partial<Booking>, tempBooking: Booking | null }> = ({ onSuccess, bookingData, tempBooking }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            // 1. Create Booking & Intent on Server - This is now done in the parent component (PaymentModal)
            // We do this NOW so we get the clientSecret
            // const { clientSecret, booking } = await api.createBooking(bookingData);

            // 2. Confirm Payment with Stripe
            const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    // Return URL not strict needed for single page app flow if we handle redirect manually, 
                    // but Stripe requires it for some payment methods.
                    return_url: window.location.origin,
                },
                redirect: 'if_required', // Important: keep user on page if possible
            });

            if (stripeError) {
                setError(stripeError.message || 'Payment Failed');
                setProcessing(false);
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                // 3. Success!
                // Update status to Confirmed manually (since no webhooks in this demo)
                if (tempBooking?.id) {
                    await api.updateBookingStatus(tempBooking.id, 'Confirmed');
                    // Pass the updated booking info back
                    onSuccess({ ...tempBooking, status: 'Confirmed' });
                } else {
                    // Fallback
                    onSuccess(bookingData as Booking);
                }
            } else {
                setError('Unexpected payment status.');
                setProcessing(false);
            }

        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Server Error');
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement options={{ theme: 'night', labels: 'floating' }} />

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-xs font-bold">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || processing}
                className="w-full bg-primary hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed h-14 rounded-xl text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-primary/20 transition-all"
            >
                {processing ? (
                    <span className="flex items-center gap-2">
                        <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Processing...
                    </span>
                ) : (
                    `Pay $${bookingData.price?.toFixed(2)} & Book`
                )}
            </button>
        </form>
    );
};

const PaymentModal: React.FC<PaymentModalProps> = ({ bookingData, onSuccess, onCancel }) => {
    // We don't fetch clientSecret here anymore because we want to create the booking 
    // ONLY when the user clicks PAY inside the form to avoid creating spam bookings.
    // HOWEVER, PaymentElement REQUIRES a clientSecret (or mode='payment' setup) to render.
    // Actually, standard flow is:
    // 1. Create PaymentIntent on server -> return clientSecret
    // 2. Render Elements with clientSecret
    // 3. User pays.

    // So we MUST create the payment intent first.
    // Issue: If they close the modal, we have a loose booking/intent?
    // Alternative: Use "SetupIntent" mode? or Creates booking as "Draft"?
    // Let's stick to standard: Create Intent on mount.

    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [tempBooking, setTempBooking] = useState<Booking | null>(null);

    useEffect(() => {
        // Create a temporary "Pending Payment" booking to get the secret?
        // Or separate "createPaymentIntent" endpoint?
        // Existing api.createBooking does BOTH.
        // Let's use that. It creates a booking with "Pending Approval" (should essentially be "Pending Payment").

        const init = async () => {
            try {
                const res = await api.createBooking(bookingData);
                setClientSecret(res.clientSecret);
                setTempBooking(res.booking);
            } catch (e) {
                console.error("Failed to init payment", e);
            }
        };
        init();
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onCancel}></div>
            <div className="relative bg-[#111] border border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Secure Payment</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase mt-1">Powered by Stripe</p>
                    </div>
                    <button onClick={onCancel} className="size-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors">
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>

                <div className="p-6">
                    {clientSecret ? (
                        <Elements stripe={stripePromise} options={{
                            clientSecret,
                            appearance: {
                                theme: 'night',
                                variables: { colorPrimary: '#FF8A00' }
                            }
                        }}>
                            <CheckoutForm onSuccess={onSuccess} bookingData={bookingData} tempBooking={tempBooking} />
                        </Elements>
                    ) : (
                        <div className="h-40 flex items-center justify-center text-slate-500">
                            <span className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
