const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

async function testAdmin2Login() {
    console.log('🧪 Testing admin2 login with admin2123...');
    
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/admin/login`, {
            username: 'admin2',
            password: 'admin2123'
        });
        
        console.log('✅ Login successful!');
        console.log('Response data:', response.data);
        console.log('User role:', response.data.user?.role);
        
    } catch (error) {
        console.log('❌ Login failed!');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error data:', error.response.data);
        } else {
            console.log('Network error:', error.message);
        }
    }
}

testAdmin2Login();