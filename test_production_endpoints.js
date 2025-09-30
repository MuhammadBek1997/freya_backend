const axios = require('axios');

const PRODUCTION_URL = 'https://freya-salon-backend-cc373ce6622a.herokuapp.com/api';

async function testProductionEndpoints() {
    try {
        console.log('🔍 Testing production endpoints...');
        
        // First login to get token
        console.log('\n🔐 Logging in as admin1...');
        const loginResponse = await axios.post(`${PRODUCTION_URL}/auth/admin/login`, {
            username: 'admin1',
            password: 'admin1123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful! Token received.');

        // Test different admin profile endpoints
        const profileEndpoints = [
            '/auth/admin/profile',
            '/admin/profile',
            '/profile',
            '/auth/profile',
            '/admin/me',
            '/me'
        ];

        console.log('\n🔍 Testing admin profile endpoints...');
        for (const endpoint of profileEndpoints) {
            try {
                console.log(`\n📍 Testing: ${endpoint}`);
                const response = await axios.get(`${PRODUCTION_URL}${endpoint}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                console.log(`✅ SUCCESS! ${endpoint} works!`);
                console.log('Status:', response.status);
                console.log('Data:', JSON.stringify(response.data, null, 2));
                break; // Exit on first success
                
            } catch (error) {
                console.log(`❌ ${endpoint} failed:`, error.response?.status, error.response?.data?.message || error.message);
            }
        }

        // Test different salon endpoints
        const salonEndpoints = [
            '/admin/salons/',
            '/admin/salons',
            '/salons',
            '/admin/salon',
            '/salon',
            '/admin/salon/data',
            '/admin/salon/info'
        ];

        console.log('\n🔍 Testing salon endpoints...');
        for (const endpoint of salonEndpoints) {
            try {
                console.log(`\n📍 Testing: ${endpoint}`);
                const response = await axios.get(`${PRODUCTION_URL}${endpoint}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                console.log(`✅ SUCCESS! ${endpoint} works!`);
                console.log('Status:', response.status);
                console.log('Data:', JSON.stringify(response.data, null, 2));
                break; // Exit on first success
                
            } catch (error) {
                console.log(`❌ ${endpoint} failed:`, error.response?.status, error.response?.data?.message || error.message);
            }
        }

    } catch (error) {
        console.error('❌ Error occurred:', error.message);
    }
}

testProductionEndpoints();