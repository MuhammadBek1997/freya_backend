const axios = require('axios');

const PRODUCTION_URL = 'https://freya-salon-backend-cc373ce6622a.herokuapp.com';

async function testEmployeeLogin() {
    try {
        console.log('🧪 Production server\'da employee login test...');
        console.log('🌐 Server URL:', PRODUCTION_URL);
        
        // Employee login test
        console.log('\n1️⃣ Employee1_1 bilan login test...');
        const employeeResponse = await axios.post(`${PRODUCTION_URL}/api/auth/employee/login`, {
            username: 'employee1_1',
            password: 'employee123'
        });

        console.log('✅ Employee login muvaffaqiyatli!');
        console.log('📋 Response:');
        console.log('Message:', employeeResponse.data.message);
        console.log('User ID:', employeeResponse.data.user.id);
        console.log('Username:', employeeResponse.data.user.username);
        console.log('Email:', employeeResponse.data.user.email);
        console.log('Role:', employeeResponse.data.user.role);
        console.log('Salon ID:', employeeResponse.data.user.salon_id);
        
        // Admin login test (bu muvaffaqiyatsiz bo'lishi kerak)
        console.log('\n2️⃣ Employee1_1 bilan admin login test (muvaffaqiyatsiz bo\'lishi kerak)...');
        try {
            const adminResponse = await axios.post(`${PRODUCTION_URL}/api/auth/admin/login`, {
                username: 'employee1_1',
                password: 'employee123'
            });
            console.log('❌ XATO: Employee admin sifatida login qila oldi!');
            console.log('Role:', adminResponse.data.user.role);
        } catch (adminError) {
            if (adminError.response && adminError.response.status === 401) {
                console.log('✅ TO\'G\'RI: Employee admin sifatida login qila olmadi');
                console.log('Error message:', adminError.response.data.message);
            } else {
                console.log('❌ Kutilmagan xatolik:', adminError.message);
            }
        }

        // Health check
        console.log('\n3️⃣ Server health check...');
        const healthResponse = await axios.get(`${PRODUCTION_URL}/api/health`);
        console.log('✅ Server ishlayapti');
        console.log('Health status:', healthResponse.data);

    } catch (error) {
        console.error('❌ Test xatoligi:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testEmployeeLogin();