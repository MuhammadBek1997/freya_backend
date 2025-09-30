const axios = require('axios');

const PRODUCTION_URL = 'https://freya-salon-backend-cc373ce6622a.herokuapp.com/api';

async function getAdminSalonWorkaround() {
    try {
        console.log('🔍 Getting admin salon data using workaround...');
        
        // First login to get admin info
        console.log('\n🔐 Logging in as admin1...');
        const loginResponse = await axios.post(`${PRODUCTION_URL}/auth/admin/login`, {
            username: 'admin1',
            password: 'admin1123'
        });

        const token = loginResponse.data.token;
        const user = loginResponse.data.user;
        console.log('✅ Login successful!');
        console.log('Admin info:', JSON.stringify(user, null, 2));

        // From database check, we know admin1's salon_id is: 0b62ba7b-2fc3-48c8-b2c7-f1c8b8639cb6
        const adminSalonId = '0b62ba7b-2fc3-48c8-b2c7-f1c8b8639cb6';
        
        // Get all salons from public endpoint
        console.log('\n🔍 Getting all salons from public endpoint...');
        const salonsResponse = await axios.get(`${PRODUCTION_URL}/salons`);
        
        console.log('✅ Salons fetched successfully!');
        console.log('Total salons:', salonsResponse.data.data.length);
        
        // Find admin's salon
        const adminSalon = salonsResponse.data.data.find(salon => salon.id === adminSalonId);
        
        if (adminSalon) {
            console.log('\n🎯 Found admin salon!');
            console.log('Admin salon data:', JSON.stringify(adminSalon, null, 2));
            
            // Test if this data structure matches what frontend expects
            console.log('\n📋 Frontend compatibility check:');
            console.log('- Salon ID:', adminSalon.id);
            console.log('- Salon Name:', adminSalon.name);
            console.log('- Salon Description:', adminSalon.description);
            console.log('- Salon Address:', adminSalon.address);
            console.log('- Salon Phone:', adminSalon.phone);
            console.log('- Salon Email:', adminSalon.email);
            console.log('- Working Hours:', JSON.stringify(adminSalon.working_hours, null, 2));
            console.log('- Salon Types:', JSON.stringify(adminSalon.salon_types, null, 2));
            console.log('- Salon Comfort:', JSON.stringify(adminSalon.salon_comfort, null, 2));
            
        } else {
            console.log('\n❌ Admin salon not found in public salons list!');
            console.log('Available salon IDs:');
            salonsResponse.data.data.forEach((salon, index) => {
                console.log(`${index + 1}. ${salon.id} - ${salon.name}`);
            });
        }

    } catch (error) {
        console.error('❌ Error occurred:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

getAdminSalonWorkaround();