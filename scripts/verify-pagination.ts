import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'mock-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyFetch() {
    console.log('Testing fetching with duplicate created_at and new id sorting...');
    // Just test pagination logic if possible.

    let allBookings: any[] = [];
    let offset = 0;
    const limit = 50; // Use small limit to force multiple pages
    let fetchMore = true;

    while (fetchMore) {
        let query = supabase.from('bookings').select('*');
        query = query.order('created_at', { ascending: false }).order('id', { ascending: true });
        query = query.range(offset, offset + limit - 1);

        const { data, error } = await query;

        if (error) {
            console.error(`[API] Supabase Fetch Error at offset ${offset}:`, error);
            throw error;
        }

        if (data && data.length > 0) {
            allBookings = allBookings.concat(data);
            offset += limit;

            if (data.length < limit) {
                fetchMore = false;
            }
        } else {
            fetchMore = false;
        }
    }

    console.log(`[API] Returned ${allBookings.length} total bookings.`);

    const uniqueIds = new Set(allBookings.map(b => b.id));
    console.log(`[API] Unique IDs: ${uniqueIds.size}. All bookings count: ${allBookings.length}`);
    if (uniqueIds.size !== allBookings.length) {
        console.error('ERROR: Duplicate rows fetched! Pagination is still unstable.');
    } else {
        console.log('SUCCESS: All fetched rows are unique. Pagination is stable.');
    }
}

verifyFetch().catch(console.error);
