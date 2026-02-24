import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function fixPagination() {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    // fetch raw to see if limit is 1000
    const res = await fetch(`${supabaseUrl}/rest/v1/bookings?select=*`, {
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
        }
    });

    const data = await res.json();
    console.log('Total bookings returned via REST:', data.length);
}

fixPagination();
