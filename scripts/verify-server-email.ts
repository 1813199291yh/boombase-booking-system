
import dotenv from 'dotenv';
import path from 'path';

// IMPORTANT: We do NOT import ./server/email.js yet.
// We configure dotenv first to simulate the fix (or to ensure envs are present).
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('Environment loaded from .env');

// Now import the email module.
// In the original bug, if we imported this *before* loading envs, it would fail.
// But here we are testing that the FUNCTIONS inside work even if imported early (if we simulated that).
// Actually, to test the lazy loading, we should simulate the environment where envs are loaded LATER.

// But we can't easily simulate "env loaded later" in a simple script because we need envs to actually send.
// The point is: `getTransporter()` should be called when we call `sendAdminNotification`.
// So we will just verify that `sendAdminNotification` works when envs are present.

import { sendAdminNotification } from '../server/email.ts'; // Adjust path if needed


async function run() {
    console.log('Testing sendAdminNotification...');
    const mockBooking = {
        customer_name: 'Test Admin',
        email: process.env.EMAIL_USER, // Send to self
        date: '2025-10-27',
        time: '10:00 AM',
        court_type: 'Full Court',
        price: 0,
        waiver_signed: true
    };

    await sendAdminNotification(mockBooking);
    console.log('Test function executed.');
}

run();
