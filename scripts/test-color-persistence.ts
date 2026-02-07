
import { api } from '../src/api';
import { Booking } from '../types';

// Mock fetch for node environment since api.ts uses fetch
// We need to polyfill it if not available, OR we can just use the server routes directly?
// Creating a client-side script that hits the server is better to test the full loop.
// Assuming server is running on localhost:3000. 

// Note: checking api.ts, it uses `import.meta.env` which might fail in ts-node.
// We should check how `api.ts` is constructed. 
// It uses `import.meta.env.VITE_API_URL`. This will be undefined in ts-node.
// It falls back to 'http://localhost:3000/api'.

const run = async () => {
    try {
        console.log("1. Creating a test booking...");
        const bookingData = {
            customerName: "Color Test Block",
            email: "test@color.com",
            courtType: "Full Court",
            date: "2025-01-01",
            time: "10:00 AM",
            status: "Declined", // Block status
            price: 0,
            waiverSigned: true,
            color: "#ef4444" // Initial color Red
        };

        const created = await api.createBooking(bookingData as any);
        console.log("Created Booking:", created);

        if (!created.booking) {
            console.error("Failed to create booking - no object returned");
            return;
        }

        const id = created.booking.id;

        console.log("2. Verifying color persistence (read back)...");
        // We use getBookings with specific date
        const bookings = await api.getBookings("2025-01-01", "2025-01-01");
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
        const updated = await api.updateBookingDetails(id, {
            customerName: "Color Test Block Updated",
            color: "#3b82f6"
        });
        console.log("Update response:", updated);

        console.log("4. Verifying update (read back)...");
        const bookings2 = await api.getBookings("2025-01-01", "2025-01-01");
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
};

run();
