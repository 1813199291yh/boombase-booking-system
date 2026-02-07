
// Standalone reproduction script
// Run with: npx ts-node scripts/reproduce_issue.ts

const API_URL = 'http://localhost:3000/api';

async function run() {
    try {
        console.log("1. Creating a test booking...");
        const bookingData = {
            customerName: "Color Test Block",
            email: "test@color.com",
            courtType: "Full Court",
            date: "2025-01-01",
            time: "10:00 AM",
            status: "Declined",
            price: 0,
            waiverSigned: true,
            color: "#ef4444" // Red
        };

        const createRes = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });

        if (!createRes.ok) {
            console.error("Create failed:", await createRes.text());
            return;
        }

        const created = await createRes.json();
        console.log("Created Booking:", created);
        const id = created.booking.id;

        console.log("2. Verifying color persistence (read back)...");
        const fetchRes = await fetch(`${API_URL}/bookings?start=2025-01-01&end=2025-01-01`);
        const bookings = await fetchRes.json();
        const found = bookings.find((b: any) => b.id === id);

        if (!found) {
            console.error("Booking NOT FOUND after creation!");
        } else {
            console.log("Found booking. Color:", found.color);
            if (found.color !== "#ef4444") {
                console.error("Color MISMATCH on create! Expected #ef4444, got", found.color);
            }
        }

        console.log("3. Updating color to Blue (#3b82f6)...");
        const updateRes = await fetch(`${API_URL}/bookings/${id}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerName: "Color Test Block Updated",
                color: "#3b82f6"
            })
        });

        if (!updateRes.ok) {
            console.error("Update failed:", await updateRes.text());
            return;
        }

        const updated = await updateRes.json();
        console.log("Update response:", updated);

        console.log("4. Verifying update (read back)...");
        const fetchRes2 = await fetch(`${API_URL}/bookings?start=2025-01-01&end=2025-01-01`);
        const bookings2 = await fetchRes2.json();
        const found2 = bookings2.find((b: any) => b.id === id);

        if (!found2) {
            console.error("Booking DISAPPEARED after update!");
        } else {
            console.log("Found booking. Color:", found2.color);
            if (found2.color !== "#3b82f6") {
                console.error("Color MISMATCH on update! Expected #3b82f6, got", found2.color);
            } else {
                console.log("SUCCESS: Color updated and persisted.");
            }
        }

    } catch (e) {
        console.error("Test Failed:", e);
    }
}

run();
