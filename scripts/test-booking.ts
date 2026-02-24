

async function testBooking() {
    try {
        console.log('Sending booking request...');
        const response = await fetch('http://localhost:3000/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerName: 'Test Customer',
                email: 'damon@theboombase.com', // Sending to admin email just to see if it arrives
                courtType: 'Full Court',
                date: '2025-10-27',
                time: '10:00 AM',
                price: 150,
                waiverName: 'Test Customer',
                waiverSignature: 'Test Sig',
                status: 'Pending Approval'
            })
        });

        const data = await response.json();
        console.log('Response:', data);
    } catch (e) {
        console.error('Error:', e);
    }
}

testBooking();
