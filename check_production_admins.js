const axios = require('axios');

// Production backend URL
const PRODUCTION_URL = 'https://freya-salon-backend-cc373ce6622a.herokuapp.com/api';

async function checkProductionAdmins() {
    try {
        console.log('🔄 Checking production backend admin endpoints...');
        
        // Test different admin credentials that might exist
        const testCredentials = [
            { username: 'admin1', password: 'admin123' },
            { username: 'admin1', password: 'admin1' },
            { username: 'admin', password: 'admin' },
            { username: 'admin', password: 'admin123' },
            { username: 'superadmin', password: 'admin123' },
            { username: 'test_admin', password: 'admin123' }
        ];

        for (const cred of testCredentials) {
            try {
                console.log(`\n🔄 Testing: ${cred.username}/${cred.password}`);
                
                const loginResponse = await axios.post(`${PRODUCTION_URL}/auth/admin/login`, {
                    username: cred.username,
                    password: cred.password
                });

                console.log(`✅ SUCCESS! ${cred.username}/${cred.password} works!`);
                console.log('Status:', loginResponse.status);
                console.log('Response:', loginResponse.data);
                
                // Test profile with this token
                const token = loginResponse.data.token;
                if (token) {
                    const profileResponse = await axios.get(`${PRODUCTION_URL}/auth/admin/profile`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    console.log('Profile data:', profileResponse.data);
                }
                
                break; // Stop after first successful login
                
            } catch (error) {
                console.log(`❌ Failed: ${cred.username}/${cred.password} - ${error.response?.data?.message || error.message}`);
            }
        }

        // Also test if we can access any public endpoints
        console.log('\n🔄 Testing public endpoints...');
        
        try {
            const publicResponse = await axios.get(`${PRODUCTION_URL}/salons/`);
            console.log('✅ Public salons endpoint works:', publicResponse.status);
            console.log('Salon count:', publicResponse.data?.length || 'No data');
        } catch (error) {
            console.log('❌ Public salons endpoint failed:', error.response?.status, error.response?.data?.message);
        }

    } catch (error) {
        console.log('❌ General error:', error.message);
    }
}

checkProductionAdmins();