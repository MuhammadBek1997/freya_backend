const axios = require('axios');

const PRODUCTION_URL = 'https://freya-salon-backend-cc373ce6622a.herokuapp.com/api';

async function testAdminEndpointsProduction() {
    try {
        console.log('🔍 Testing admin endpoints in production...');
        
        // First login to get token
        console.log('\n🔐 Logging in as admin1...');
        const loginResponse = await axios.post(`${PRODUCTION_URL}/auth/admin/login`, {
            username: 'admin1',
            password: 'admin1123'
        });

        const token = loginResponse.data.token;
        const user = loginResponse.data.user;
        console.log('✅ Login successful!');
        console.log('User info:', JSON.stringify(user, null, 2));

        // Test various admin endpoints that might return salon data
        const adminEndpoints = [
            '/admin/my-salon',
            '/admin/salon',
            '/admin/salon/data',
            '/admin/salon/info',
            '/admin/profile',
            '/admin/me',
            '/admin/salon/profile',
            '/admin/salon/details',
            '/admin/current-salon',
            '/admin/salon/current',
            '/auth/admin/salon',
            '/auth/admin/my-salon',
            '/auth/admin/profile',
            '/profile/admin',
            '/profile/salon',
            '/salon/admin',
            '/salon/profile'
        ];

        console.log('\n🔍 Testing admin salon endpoints...');
        for (const endpoint of adminEndpoints) {
            try {
                console.log(`\n📍 Testing: ${endpoint}`);
                const response = await axios.get(`${PRODUCTION_URL}${endpoint}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    timeout: 5000
                });
                
                console.log(`✅ SUCCESS! ${endpoint} works!`);
                console.log('Status:', response.status);
                console.log('Data:', JSON.stringify(response.data, null, 2));
                
                // If we found a working endpoint, test it more thoroughly
                if (response.data && (response.data.data || response.data.salon || response.data.user)) {
                    console.log('\n🎯 This endpoint seems to return salon/admin data!');
                    break;
                }
                
            } catch (error) {
                const status = error.response?.status;
                const message = error.response?.data?.message || error.message;
                console.log(`❌ ${endpoint} failed: ${status} - ${message}`);
            }
        }

        // Also test some general endpoints that might work
        console.log('\n🔍 Testing general endpoints...');
        const generalEndpoints = [
            '/salons',
            '/salons/admin',
            '/salons/my',
            '/user/salon',
            '/user/profile'
        ];

        for (const endpoint of generalEndpoints) {
            try {
                console.log(`\n📍 Testing: ${endpoint}`);
                const response = await axios.get(`${PRODUCTION_URL}${endpoint}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    timeout: 5000
                });
                
                console.log(`✅ SUCCESS! ${endpoint} works!`);
                console.log('Status:', response.status);
                console.log('Data preview:', JSON.stringify(response.data, null, 2).substring(0, 500) + '...');
                
            } catch (error) {
                const status = error.response?.status;
                const message = error.response?.data?.message || error.message;
                console.log(`❌ ${endpoint} failed: ${status} - ${message}`);
            }
        }

    } catch (error) {
        console.error('❌ Error occurred:', error.message);
    }
}

testAdminEndpointsProduction();