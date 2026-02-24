import fetch from 'node-fetch'; // assuming installed by previous script or native fetch

async function testApiFetch() {
    try {
        console.log('Sending request to local API...');
        const response = await fetch('http://localhost:3000/api/bookings?start=2024-01-01&end=2026-12-31');

        if (!response.ok) {
            console.error('API Error:', response.status);
            return;
        }

        const data = await response.json();
        console.log(`API Returned ${data.length} total bookings.`);
    } catch (e) {
        console.error('Error:', e);
    }
}

testApiFetch();
