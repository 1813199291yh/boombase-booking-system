
// Node 18+ has native fetch
// const fetch = require('node-fetch'); 

// Configuration
const API_URL = 'http://localhost:3000/api';

// Simulation of handleConfirmSelection logic
async function run() {
    console.log("Starting Multi-Select Recurrence Replication...");

    // Mock User Selection
    const selectedSlots = [
        "2026-03-01|10:00 AM",
        "2026-03-01|11:00 AM"
    ];
    const recurrence = 'Weekly';
    const repeats = 5; // Reduced for testing
    const groupId = "test-multi-" + Math.random().toString(36).substring(7);

    console.log(`Creating blocks for slots: ${selectedSlots.join(', ')} with ${recurrence} recurrence...`);

    const bookingsBatch = [];

    for (const slotKey of selectedSlots) {
        const [slotDate, slotTime] = slotKey.split('|');
        const baseDate = new Date(slotDate + 'T00:00:00');

        console.log(`Processing slot: ${slotDate} ${slotTime}`);

        // Replicating the logic from AdminSchedule.tsx
        let currentDate = new Date(baseDate);
        let count = 0;

        while (count < repeats) {
            let isValid = true;
            // Weekly always valid if base date is valid

            if (isValid) {
                const y = currentDate.getFullYear();
                const m = String(currentDate.getMonth() + 1).padStart(2, '0');
                const d = String(currentDate.getDate()).padStart(2, '0');
                const dateStr = `${y}-${m}-${d}`;

                console.log(`   -> Generating block: ${dateStr} at ${slotTime}`);

                bookingsBatch.push({
                    customerName: "Multi-Select Test",
                    email: 'admin@internal',
                    courtType: "Full Court",
                    date: dateStr,
                    time: slotTime,
                    status: 'Declined',
                    price: 0,
                    waiverSigned: true,
                    recurringGroupId: groupId,
                    color: "#f59e0b"
                });
                count++;
            }

            // Advance Date
            if (recurrence === 'Weekly') {
                currentDate.setDate(currentDate.getDate() + 7);
                // The fix I added: currentDate = new Date(currentDate); 
                // Let's see if it works WITHOUT the fix first (simulating the bug?) 
                // Actually I'll test the logic AS IS in the file before my fix to confirm if that WAS the bug.
                // In the file, before my fix, it was just setDate.
            }
        }
    }

    // Send to API
    try {
        console.log(`Sending ${bookingsBatch.length} bookings to API...`);
        const res = await fetch(`${API_URL}/bookings/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookings: bookingsBatch })
        });

        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        console.log("API Response:", data);

        // Verification
        console.log("Verifying creation...");
        const query = new URLSearchParams({ start: "2026-03-01", end: "2026-04-01" });
        const getRes = await fetch(`${API_URL}/bookings?${query.toString()}`);
        const allBookings = await getRes.json();
        const created = allBookings.filter(b => b.recurringGroupId === groupId || b.recurring_group_id === groupId);

        console.log(`Found ${created.length} bookings for this group.`);
        if (created.length === selectedSlots.length * repeats) {
            console.log("SUCCESS: All blocks created.");
        } else {
            console.error(`FAILURE: Expected ${selectedSlots.length * repeats}, found ${created.length}`);
        }

        // Cleanup
        await fetch(`${API_URL}/bookings/delete-series`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId })
        });

    } catch (e) {
        console.error(e);
    }
}

run();
