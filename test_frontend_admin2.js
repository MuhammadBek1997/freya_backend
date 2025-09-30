const axios = require('axios');

const FRONTEND_URL = 'http://localhost:5197';
const PRODUCTION_URL = 'https://freya-salon-backend-cc373ce6622a.herokuapp.com/api';

async function testFrontendAdmin2Login() {
    try {
        console.log('🔍 Testing admin2 login from frontend perspective...');
        
        // Test direct API call first
        console.log('\n1️⃣ Testing direct API call...');
        const directResponse = await axios.post(`${PRODUCTION_URL}/auth/admin/login`, {
            username: 'admin2',
            password: 'admin2123'
        });
        
        console.log('✅ Direct API call successful!');
        console.log('Response status:', directResponse.status);
        console.log('User data:', JSON.stringify(directResponse.data.user, null, 2));
        
        // Test with exact same headers as frontend
        console.log('\n2️⃣ Testing with frontend-like headers...');
        const frontendLikeResponse = await axios.post(`${PRODUCTION_URL}/auth/admin/login`, {
            username: 'admin2',
            password: 'admin2123'
        }, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        console.log('✅ Frontend-like API call successful!');
        console.log('Response status:', frontendLikeResponse.status);
        console.log('User data:', JSON.stringify(frontendLikeResponse.data.user, null, 2));
        
        // Test CORS
        console.log('\n3️⃣ Testing CORS...');
        const corsResponse = await axios.post(`${PRODUCTION_URL}/auth/admin/login`, {
            username: 'admin2',
            password: 'admin2123'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Origin': FRONTEND_URL
            }
        });
        
        console.log('✅ CORS test successful!');
        console.log('Response status:', corsResponse.status);
        
        console.log('\n✅ All tests passed! Admin2 login should work from frontend.');
        console.log('\n📝 Instructions for testing in browser:');
        console.log('1. Open http://localhost:5197/');
        console.log('2. Enter username: admin2');
        console.log('3. Enter password: admin2123');
        console.log('4. Click login button');
        console.log('5. Check browser console for detailed logs');
        
    } catch (error) {
        console.error('❌ Error occurred:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testFrontendAdmin2Login();