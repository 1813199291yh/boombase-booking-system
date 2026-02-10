
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAvailability() {
    console.log("--- DEBUGGING DATA INTEGRITY ---");

    const { data: bookings, error } = await supabase.from('bookings').select('*');
    if (error) {
        console.error("Error fetching bookings:", error);
        return;
    }

    console.log(`Fetched ${bookings.length} bookings total.`);

    let issuesFound = 0;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    // Time regex: AdminSchedule saves "09:00 AM", LandingPage expects "9:00 AM" (normalized).
    // Database can store whatever.
    // Let's check for leading/trailing spaces.

    bookings.forEach(b => {
        // 1. Check Date Format
        if (!dateRegex.test(b.date)) {
            console.warn(`[DATE FORMAT ISSUE] ID=${b.id.slice(0, 8)} Date="${b.date}"`);
            issuesFound++;
        }

        // 2. Check Time Strings for whitespace
        if (b.time.trim() !== b.time) {
            console.warn(`[TIME WHITESPACE] ID=${b.id.slice(0, 8)} Time="${b.time}" (has surrounding whitespace)`);
            issuesFound++;
        }

        // 3. Check for specific problematic times (admin blocks)
        if (b.status === 'Declined') {
            const hasLeadingZero = b.time.match(/^0\d:/);
            if (!hasLeadingZero && parseInt(b.time) < 10) {
                // "8:00 AM" instead of "08:00 AM". This is fine if LandingPage handles it.
                // But mixing formats is messy.
            }
        }
    });

    console.log(`Scan complete. Issues found: ${issuesFound}`);

    // Check specific recent blocks
    const declined = bookings.filter(b => b.status === 'Declined');
    console.log(`Found ${declined.length} 'Declined' bookings.`);
    if (declined.length > 0) {
        const sample = declined[0];
        console.log(`Sample Declined: Date=${sample.date}, Time="${sample.time}"`);
    }
}

checkAvailability();
