
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_ANON_KEY as string
);

async function run() {
    console.log('Attempting to create a block (booking)...');

    // Simulate what the frontend sends
    const payload = {
        customer_name: 'Facility Block',
        email: 'admin@internal',
        court_type: 'Full Court',
        date: '2024-10-21', // Arbitrary date
        time: '08:00 AM',
        price: 0,
        status: 'Declined',
        stripe_payment_id: 'manual-block',
        waiver_signed: true,
        waiver_name: undefined, // Simulating missing field
        waiver_signature: undefined
    };

    console.log('Payload:', payload);

    const { data, error } = await supabase
        .from('bookings')
        .insert([payload])
        .select()
        .single();

    if (error) {
        console.error('❌ Failed to insert block:', error);
    } else {
        console.log('✅ Block inserted successfully:', data);

        // Cleanup
        console.log('Cleaning up...');
        await supabase.from('bookings').delete().eq('id', data.id);
    }
}

run();
