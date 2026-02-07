
const API_URL = 'http://localhost:3000/api';

async function run() {
    try {
        const res = await fetch(`${API_URL}/bookings`);
        const data = await res.json();
        console.log(`Total bookings: ${data.length}`);
        if (data.length > 0) {
            console.log("First booking sample:", data[0]);

            // Check for any recurringGroupId
            const recurring = data.filter(b => b.recurringGroupId || b.recurring_group_id);
            console.log(`Bookings with recurrence: ${recurring.length}`);
            if (recurring.length > 0) {
                console.log("Sample recurring booking:", recurring[0]);
            }
        }
    } catch (e) {
        console.error(e);
    }
}

run();
