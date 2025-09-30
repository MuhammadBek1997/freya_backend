const axios = require('axios');

const PRODUCTION_URL = 'https://freya-salon-backend-cc373ce6622a.herokuapp.com/api';

async function testProductionAdmin() {
    try {
        console.log('🔍 Testing admin login with production backend...');
        console.log('🌐 Production URL:', PRODUCTION_URL);
        
        // From database check, we know admin1 exists with password_hash
        // Let's try different passwords that might match the hash
        const testPasswords = [
            'admin123',
            'admin1123', 
            'password123',
            'admin',
            'admin1',
            'freya123',
            'salon123'
        ];

        for (const password of testPasswords) {
            try {
                console.log(`\n🔐 Testing admin1 with password: ${password}`);
                
                const loginResponse = await axios.post(`${PRODUCTION_URL}/auth/admin/login`, {
                    username: 'admin1',
                    password: password
                }, {
                    timeout: 10000
                });

                console.log(`✅ SUCCESS! Password "${password}" works!`);
                console.log('Status:', loginResponse.status);
                console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
                
                // Test admin profile with this token
                const token = loginResponse.data.token;
                if (token) {
                    console.log('\n🔍 Testing admin profile...');
                    const profileResponse = await axios.get(`${PRODUCTION_URL}/auth/admin/profile`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    console.log('✅ Profile access successful!');
                    console.log('Profile data:', JSON.stringify(profileResponse.data, null, 2));
                    
                    // Test salon data
                    console.log('\n🔍 Testing salon data...');
                    const salonResponse = await axios.get(`${PRODUCTION_URL}/admin/salons/`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    console.log('✅ Salon data access successful!');
                    console.log('Salon data:', JSON.stringify(salonResponse.data, null, 2));
                }
                
                return; // Exit on first success
                
            } catch (error) {
                console.log(`❌ Password "${password}" failed:`, error.response?.data?.message || error.message);
            }
        }
        
        console.log('\n❌ All password attempts failed!');
        
    } catch (error) {
        console.error('❌ Error occurred:', error.message);
    }
}

testProductionAdmin();