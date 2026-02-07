
// Node 18+ has native fetch
// const fetch = require('node-fetch'); 

// Configuration
const API_URL = 'http://localhost:3000/api';

// Helper to create a date string
const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
};

async function run() {
    console.log("Starting Recurring Update Verification...");

    const groupId = Math.random().toString(36).substring(7);
    const baseDate = new Date().toISOString().split('T')[0];

    // Create dates for today, tomorrow, day after
    const d1 = baseDate;
    const d2 = addDays(baseDate, 1);
    const d3 = addDays(baseDate, 2);

    const dates = [d1, d2, d3];
    console.log(`Using dates: ${dates.join(', ')}`);

    console.log(`1. Creating a recurring series of 3 blocks (GroupId: ${groupId})...`);

    // Create 3 blocks manually linked by groupId
    // We utilize the bulk creation endpoint
    const bookings = dates.map(date => ({
        customerName: "Original Series",
        email: "admin@test.com",
        courtType: "Full Court",
        date: date,
        time: "10:00 AM",
        status: "Declined",
        price: 0,
        waiverSigned: true,
        recurringGroupId: groupId,
        color: "#3f3f46" // Gray
    }));

    try {
        const createRes = await fetch(`${API_URL}/bookings/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookings })
        });

        if (!createRes.ok) throw new Error(`Failed to create bookings: ${createRes.statusText}`);
        console.log("   Series created successfully.");

        // update the 2nd block onwards (Future Events)
        console.log("2. Updating 'Future Events' starting from the 2nd block...");
        const updateDate = d2;

        const updateRes = await fetch(`${API_URL}/bookings/update-series`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                groupId: groupId,
                updates: {
                    customerName: "Updated Series",
                    color: "#ef4444" // Red
                },
                mode: 'future',
                currentDate: updateDate
            })
        });

        if (!updateRes.ok) {
            const errText = await updateRes.text();
            throw new Error(`Failed to update series: ${updateRes.statusText} - ${errText}`);
        }
        const updateData = await updateRes.json();
        console.log(`   Update result:`, updateData);

        // Verify results
        console.log("3. Verifying the state of all 3 blocks...");

        // Filter by date range to avoid pagination limits
        const query = new URLSearchParams({ start: dates[0], end: dates[2] });
        const getRes = await fetch(`${API_URL}/bookings?${query.toString()}`);
        const allBookings = await getRes.json();

        // Filter by our group ID
        const seriesBookings = allBookings.filter(b => b.recurring_group_id === groupId || b.recurringGroupId === groupId);

        // Sort by date
        seriesBookings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        console.log(`   Found ${seriesBookings.length} bookings in series.`);
        if (seriesBookings.length !== 3) {
            console.log("   WARNING: Count mismatch!");
        }

        if (seriesBookings.length >= 3) {
            const b1 = seriesBookings[0];
            const b2 = seriesBookings[1];
            const b3 = seriesBookings[2];

            // Block 1 (Date 1): Should be UNCHANGED
            if (b1.customer_name === "Original Series" || b1.customerName === "Original Series") {
                console.log("   ✅ Block 1 (Past): Correctly unchanged.");
            } else {
                console.error("   ❌ Block 1 (Past): Unexpectedly changed!", b1);
            }

            // Block 2 (Date 2 - Update Start): Should be UPDATED
            if (b2.customer_name === "Updated Series" || b2.customerName === "Updated Series") {
                console.log("   ✅ Block 2 (Current): Correctly updated.");
            } else {
                console.error("   ❌ Block 2 (Current): Failed to update!", b2);
            }

            // Block 3 (Date 3 - Future): Should be UPDATED
            if (b3.customer_name === "Updated Series" || b3.customerName === "Updated Series") {
                console.log("   ✅ Block 3 (Future): Correctly updated.");
            } else {
                console.error("   ❌ Block 3 (Future): Failed to update!", b3);
            }
        }

        // Clean up
        console.log("4. Cleaning up test data...");
        // Assuming delete-series works
        await fetch(`${API_URL}/bookings/delete-series`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId })
        });
        console.log("   Cleanup complete.");

    } catch (e) {
        console.error("FAILED:", e);
    }
}

run();
