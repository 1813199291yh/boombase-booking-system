
import { Booking } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = {
    // Auth
    login: async (email: string, pass: string) => {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass }),
        });
        if (!response.ok) throw new Error('Invalid credentials');
        return response.json();
    },

    // Bookings
    createBooking: async (bookingData: Partial<Booking>) => {
        const response = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData),
        });
        if (!response.ok) throw new Error('Failed to create booking');
        return response.json();
    },

    getBookings: async () => {
        const response = await fetch(`${API_URL}/bookings`);
        if (!response.ok) throw new Error('Failed to fetch bookings');
        return response.json();
    },

    updateBookingStatus: async (id: string, status: string) => {
        const response = await fetch(`${API_URL}/bookings/${id}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        if (!response.ok) throw new Error('Failed to update status');
        return response.json();
    },

    updateBookingDetails: async (id: string, updates: any) => {
        const response = await fetch(`${API_URL}/bookings/${id}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        if (!response.ok) throw new Error('Failed to update booking details');
        return response.json();
    },

    deleteBookingSeries: async (groupId: string) => {
        const response = await fetch(`${API_URL}/bookings/delete-series`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId }),
        });
        if (!response.ok) throw new Error('Failed to delete series');
        return response.json();
    },

    // Payouts
    getPayouts: async () => {
        const response = await fetch(`${API_URL}/payouts`);
        if (!response.ok) throw new Error('Failed to fetch payouts');
        return response.json();
    },

    requestPayout: async (amount: number) => {
        const response = await fetch(`${API_URL}/payouts/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount }),
        });
        if (!response.ok) throw new Error('Failed to request payout');
        return response.json();
    },

    // Settings
    getSettings: async () => {
        const response = await fetch(`${API_URL}/settings`);
        if (response.ok) return response.json();
        // Fallback if table doesn't exist yet
        return {};
    },

    updateSettings: async (updates: any) => {
        const response = await fetch(`${API_URL}/settings/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        if (!response.ok) throw new Error('Failed to update settings');
        return response.json();
    },
};
