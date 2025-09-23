require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3003/api';

async function testEmployeesSimple() {
    try {
        console.log('🧪 SODDA XODIMLAR TESTI\n');

        // Sodda GET so'rov
        const response = await axios.get(`${BASE_URL}/employees/list`);
        
        console.log('✅ Response status:', response.status);
        console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('❌ Xatolik:', error.message);
        if (error.response) {
            console.error('📄 Response status:', error.response.status);
            console.error('📄 Response data:', error.response.data);
        }
    }
}

testEmployeesSimple();