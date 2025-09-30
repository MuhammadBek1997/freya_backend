const axios = require('axios');

async function testAdminProfile() {
    try {
        console.log('🔍 Testing admin profile access...\n');

        // 1. Admin login
        console.log('1. Admin login...');
        const loginResponse = await axios.post('http://localhost:5009/api/auth/admin/login', {
            username: 'admin1',
            password: 'admin123'
        });

        const { token, user } = loginResponse.data;
        console.log(`✅ Login successful! Admin: ${user.username}`);
        console.log(`Token (first 50 chars): ${token.substring(0, 50)}...`);

        // 2. Test admin profile endpoint
        console.log('\n2. Testing admin profile endpoint...');
        const profileResponse = await axios.get('http://localhost:5009/api/auth/admin/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log(`✅ Profile endpoint works! Status: ${profileResponse.status}`);
        console.log('📋 Profile data:', JSON.stringify(profileResponse.data, null, 2));

    } catch (error) {
        console.error('❌ Test failed:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
        } else {
            console.error(`Error: ${error.message}`);
        }
    }
}

testAdminProfile();