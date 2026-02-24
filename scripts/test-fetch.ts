import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBookings() {
    console.log('Fetching bookings...');
    const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*');

    if (error) {
        console.error('Error fetching bookings:', error);
        return;
    }

    console.log(`Total bookings in DB: ${bookings.length}`);

    const blockedSlots = bookings.filter(b => b.status === 'Declined' || b.stripe_payment_id === 'manual-bulk-block');
    console.log(`Total blocked slots: ${blockedSlots.length}`);

    if (blockedSlots.length > 0) {
        console.log('Sample blocked slot:', blockedSlots[0]);
    }
}

checkBookings();
