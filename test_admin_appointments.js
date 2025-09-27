const axios = require('axios');

const BASE_URL = 'https://freya-salon-backend-cc373ce6622a.herokuapp.com/api';

async function testAdminAppointments() {
    try {
        console.log('🔍 Testing admin appointment access...\n');

        // 1. Admin login
        console.log('1. Admin login...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/admin/login`, {
            username: 'admin1',
            password: 'admin1123'
        });

        const { token, user } = loginResponse.data;
        console.log(`✅ Login successful! Admin: ${user.username}, Salon ID: ${user.salon_id}`);

        // 2. Test appointment endpoint
        console.log('\n2. Testing appointment endpoint...');
        try {
            const appointmentResponse = await axios.get(
                `${BASE_URL}/appointments/salon/${user.salon_id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            console.log(`✅ Appointment endpoint works! Status: ${appointmentResponse.status}`);
            console.log(`📋 Appointments found: ${appointmentResponse.data.data?.length || 0}`);
            
            if (appointmentResponse.data.data?.length > 0) {
                console.log('📝 First appointment:', appointmentResponse.data.data[0]);
            }

        } catch (appointmentError) {
            console.log(`❌ Appointment endpoint failed!`);
            console.log(`Status: ${appointmentError.response?.status}`);
            console.log(`Error: ${appointmentError.response?.data?.message || appointmentError.message}`);
            
            if (appointmentError.response?.status === 403) {
                console.log('🔒 This confirms that appointment routes are restricted to users only');
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testAdminAppointments();