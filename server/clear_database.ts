
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearData() {
    console.log('🗑️  Starting cleanup of test data...');

    // 1. Clear Bookings
    console.log('... Deleting all bookings');
    const { error: bookingsError, count: bookingsCount } = await supabase
        .from('bookings')
        .delete({ count: 'exact' })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Clause to match all UUIDs

    if (bookingsError) {
        console.error('❌ Error clearing bookings:', bookingsError.message);
    } else {
        console.log(`✅ Bookings cleared (Count: ${bookingsCount})`);
    }

    // 2. Clear Payouts
    console.log('... Deleting all payouts');
    const { error: payoutsError, count: payoutsCount } = await supabase
        .from('payouts')
        .delete({ count: 'exact' })
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (payoutsError) {
        console.error('❌ Error clearing payouts:', payoutsError.message);
    } else {
        console.log(`✅ Payouts cleared (Count: ${payoutsCount})`);
    }
}

clearData();
