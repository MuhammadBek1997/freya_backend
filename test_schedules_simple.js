const axios = require('axios');

const BASE_URL = 'http://localhost:3003/api';

async function testSchedulesSimple() {
    try {
        console.log('Jadvallar API test qilish...');
        
        const response = await axios.get(`${BASE_URL}/schedules`);
        
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('Xatolik:', error.response?.status, error.response?.data || error.message);
    }
}

testSchedulesSimple();