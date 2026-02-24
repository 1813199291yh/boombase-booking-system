
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_ANON_KEY as string
);

async function checkRecent() {
    const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error(error);
    } else {
        console.log('Recent Bookings:');
        data.forEach(b => {
            console.log(`- ${b.created_at}: ${b.customer_name} (${b.status}) [${b.email}]`);
        });
    }
}

checkRecent();
