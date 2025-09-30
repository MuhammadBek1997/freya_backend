const axios = require('axios');

const PRODUCTION_URL = 'https://freya-salon-backend-cc373ce6622a.herokuapp.com/api';

async function testAdmin2Salon() {
    try {
        console.log('🔍 Testing admin2 salon access...');
        
        // Login as admin2
        console.log('\n🔐 Logging in as admin2...');
        const loginResponse = await axios.post(`${PRODUCTION_URL}/auth/admin/login`, {
            username: 'admin2',
            password: 'admin2123'
        });

        const token = loginResponse.data.token;
        const user = loginResponse.data.user;
        console.log('✅ Login successful!');
        console.log('Admin2 info:', JSON.stringify(user, null, 2));

        // Get all salons to find admin2's salon
        console.log('\n🔍 Getting all salons...');
        const salonsResponse = await axios.get(`${PRODUCTION_URL}/salons`);
        
        console.log('✅ Salons fetched successfully!');
        console.log('Total salons:', salonsResponse.data.data.length);
        
        // Show all salons
        salonsResponse.data.data.forEach((salon, index) => {
            console.log(`\n${index + 1}. Salon ID: ${salon.id}`);
            console.log(`   Name: ${salon.name}`);
            console.log(`   Description: ${salon.description}`);
            console.log(`   Address: ${salon.address}`);
        });
        
        // Admin2 should have access to the second salon (based on our previous data)
        const admin2SalonId = salonsResponse.data.data[1]?.id; // Second salon
        
        if (admin2SalonId) {
            console.log(`\n🎯 Admin2's salon ID: ${admin2SalonId}`);
            const admin2Salon = salonsResponse.data.data.find(salon => salon.id === admin2SalonId);
            console.log('Admin2 salon data:', JSON.stringify(admin2Salon, null, 2));
        } else {
            console.log('\n❌ Could not determine admin2 salon');
        }

    } catch (error) {
        console.error('❌ Error occurred:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testAdmin2Salon();