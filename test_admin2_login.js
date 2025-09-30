const axios = require('axios');

const PRODUCTION_URL = 'https://freya-salon-backend-cc373ce6622a.herokuapp.com/api';

async function testAdmin2Login() {
    try {
        console.log('🔍 Testing admin2 login with different passwords...');
        
        const passwords = [
            'admin2123',
            'admin2',
            'admin123',
            'password123',
            'freya123',
            'salon123',
            'admin',
            'test123'
        ];
        
        for (const password of passwords) {
            try {
                console.log(`\n🔐 Trying admin2 with password: ${password}`);
                
                const response = await axios.post(`${PRODUCTION_URL}/auth/admin/login`, {
                    username: 'admin2',
                    password: password
                });
                
                if (response.status === 200) {
                    console.log('✅ SUCCESS! admin2 login successful!');
                    console.log('Token:', response.data.token ? 'EXISTS' : 'NOT_FOUND');
                    console.log('User info:', JSON.stringify(response.data.user, null, 2));
                    return; // Exit on first success
                }
                
            } catch (error) {
                if (error.response) {
                    console.log(`❌ Failed: ${error.response.status} - ${error.response.data.message || error.response.data}`);
                } else {
                    console.log(`❌ Failed: ${error.message}`);
                }
            }
        }
        
        console.log('\n❌ All password attempts failed for admin2');
        
        // Test if admin2 user exists by checking error message
        console.log('\n🔍 Testing if admin2 user exists...');
        try {
            const response = await axios.post(`${PRODUCTION_URL}/auth/admin/login`, {
                username: 'admin2',
                password: 'definitely_wrong_password'
            });
        } catch (error) {
            if (error.response) {
                console.log('Error message:', error.response.data.message);
                if (error.response.data.message.includes('username') || error.response.data.message.includes('topilmadi')) {
                    console.log('🔍 Likely admin2 user does not exist');
                } else if (error.response.data.message.includes('password')) {
                    console.log('🔍 admin2 user exists but password is wrong');
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error occurred:', error.message);
    }
}

testAdmin2Login();