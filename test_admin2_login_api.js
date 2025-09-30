const axios = require('axios');

const API_BASE = 'http://localhost:5001';

async function testAdmin2Login() {
    console.log('=== TESTING ADMIN2 LOGIN API ===\n');
    
    try {
        // Test admin2 login
        console.log('Testing admin2 login...');
        console.log('Username: admin2');
        console.log('Password: admin2123');
        console.log('Expected Role: private_admin\n');
        
        const loginResponse = await axios.post(`${API_BASE}/api/auth/admin/login`, {
            username: 'admin2',
            password: 'admin2123'
        });
        
        console.log('✅ Login successful!');
        console.log('Response status:', loginResponse.status);
        console.log('Response data:', JSON.stringify(loginResponse.data, null, 2));
        
        // Test token validation
        if (loginResponse.data.token) {
            console.log('\n=== TESTING TOKEN VALIDATION ===');
            
            const tokenResponse = await axios.get(`${API_BASE}/api/auth/admin/profile`, {
                headers: {
                    'Authorization': `Bearer ${loginResponse.data.token}`
                }
            });
            
            console.log('✅ Token validation successful!');
            console.log('Profile data:', JSON.stringify(tokenResponse.data, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Login failed!');
        console.error('Error status:', error.response?.status);
        console.error('Error message:', error.response?.data?.message || error.message);
        console.error('Full error data:', JSON.stringify(error.response?.data, null, 2));
    }
    
    // Also test admin1 for comparison
    try {
        console.log('\n=== TESTING ADMIN1 LOGIN FOR COMPARISON ===');
        
        const admin1Response = await axios.post(`${API_BASE}/api/auth/admin/login`, {
            username: 'admin1',
            password: 'admin1123'
        });
        
        console.log('✅ Admin1 login successful!');
        console.log('Admin1 data:', JSON.stringify(admin1Response.data, null, 2));
        
    } catch (error) {
        console.error('❌ Admin1 login failed!');
        console.error('Error:', error.response?.data?.message || error.message);
    }
}

testAdmin2Login();