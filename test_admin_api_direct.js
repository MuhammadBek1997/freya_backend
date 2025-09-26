const axios = require('axios');

// Production API URL
const BASE_URL = 'https://freya-salon-backend-cc373ce6622a.herokuapp.com/api';

async function testAdminAPIDirectly() {
    try {
        console.log('🔍 Testing admin login API directly...\n');
        console.log(`🌐 API Base URL: ${BASE_URL}\n`);

        // Test admin credentials from our database
        const testCredentials = [
            { username: 'admin1', password: 'admin1123' },
            { username: 'admin2', password: 'admin2123' },
            { username: 'admin3', password: 'admin3123' },
            { username: 'admin4', password: 'admin4123' },
            { username: 'admin5', password: 'admin5123' },
            { username: 'admin6', password: 'admin6123' }
        ];

        for (let i = 0; i < testCredentials.length; i++) {
            const { username, password } = testCredentials[i];
            
            console.log(`👤 Testing Admin ${i + 1}: ${username}`);
            console.log(`   Password: ${password}`);
            
            try {
                // Make login request
                const response = await axios.post(`${BASE_URL}/auth/admin/login`, {
                    username: username,
                    password: password
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000 // 10 second timeout
                });

                console.log(`   ✅ Login successful!`);
                console.log(`   📋 Response status: ${response.status}`);
                console.log(`   🎫 Token received: ${response.data.token ? 'Yes' : 'No'}`);
                console.log(`   👤 User info:`, JSON.stringify(response.data.user, null, 6));
                
            } catch (error) {
                console.log(`   ❌ Login failed!`);
                console.log(`   📋 Status: ${error.response?.status || 'No response'}`);
                console.log(`   💬 Message: ${error.response?.data?.message || error.message}`);
                
                if (error.response?.data) {
                    console.log(`   📄 Full response:`, JSON.stringify(error.response.data, null, 6));
                }
                
                // Log request details for debugging
                console.log(`   🔍 Request details:`);
                console.log(`      URL: ${BASE_URL}/auth/admin/login`);
                console.log(`      Method: POST`);
                console.log(`      Headers: Content-Type: application/json`);
                console.log(`      Body: ${JSON.stringify({ username, password })}`);
            }
            
            console.log('');
        }

        // Test with wrong credentials
        console.log('🧪 Testing with wrong credentials...\n');
        
        try {
            const response = await axios.post(`${BASE_URL}/auth/admin/login`, {
                username: 'wronguser',
                password: 'wrongpass'
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('❌ Unexpected success with wrong credentials!');
            
        } catch (error) {
            console.log('✅ Correctly rejected wrong credentials');
            console.log(`   Status: ${error.response?.status}`);
            console.log(`   Message: ${error.response?.data?.message}`);
        }

        // Test API health
        console.log('\n🏥 Testing API health...\n');
        
        try {
            const healthResponse = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
            console.log('✅ API health check passed');
            console.log(`   Status: ${healthResponse.status}`);
        } catch (error) {
            console.log('❌ API health check failed');
            console.log(`   Error: ${error.message}`);
        }

        console.log('\n✅ Admin API direct test completed!');

    } catch (error) {
        console.error('❌ Error testing admin API:', error.message);
    }
}

testAdminAPIDirectly();