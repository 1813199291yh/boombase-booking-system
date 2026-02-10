
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

console.log(`Service Role Key Present: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);
console.log(`DATABASE_URL Present: ${!!process.env.DATABASE_URL}`);


const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { count, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error counting:', error.message);
    } else {
        console.log(`Current Booking Count: ${count}`);
    }
}

check();
