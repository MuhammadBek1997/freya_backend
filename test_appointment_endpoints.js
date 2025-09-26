const axios = require('axios');

const BASE_URL = 'https://freya-salon-backend-cc373ce6622a.herokuapp.com/api';

// Test user credentials
const TEST_USER = {
    phone: '+998990972472',
    password: 'pass112233'
};

let authToken = '';

async function loginUser() {
    try {
        console.log('🔐 User login qilmoqda...');
        const response = await axios.post(`${BASE_URL}/users/login`, {
            phone: TEST_USER.phone,
            password: TEST_USER.password
        });

        if (response.data.success) {
            authToken = response.data.data.token;
            console.log('✅ User muvaffaqiyatli login qildi');
            console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
            console.log('📱 Phone:', response.data.data.user.phone);
            console.log('👤 Name:', response.data.data.user.name || response.data.data.user.username);
            return response.data.data.user;
        } else {
            throw new Error('Login failed');
        }
    } catch (error) {
        console.error('❌ Login xatosi:', error.response?.data || error.message);
        throw error;
    }
}

async function testUserAppointments() {
    try {
        console.log('\n📅 User appointmentlarini olish...');
        const response = await axios.get(`${BASE_URL}/appointments/my-appointments`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        console.log('✅ User appointments:', response.data.success);
        console.log('📊 Jami appointments:', response.data.data?.length || 0);
        
        if (response.data.data && response.data.data.length > 0) {
            console.log('📋 Birinchi appointment:');
            const first = response.data.data[0];
            console.log('   - ID:', first.id);
            console.log('   - Status:', first.status);
            console.log('   - Date:', first.application_date);
            console.log('   - Time:', first.application_time);
        }
        
        return response.data;
    } catch (error) {
        console.error('❌ User appointments xatosi:', error.response?.data || error.message);
        throw error;
    }
}

async function testSalonAppointments(salonId = 1) {
    try {
        console.log(`\n🏢 Salon ${salonId} appointmentlarini olish...`);
        const response = await axios.get(`${BASE_URL}/appointments/salon/${salonId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        console.log('✅ Salon appointments:', response.data.success);
        console.log('📊 Jami appointments:', response.data.data?.length || 0);
        
        if (response.data.pagination) {
            console.log('📄 Pagination:');
            console.log('   - Page:', response.data.pagination.page);
            console.log('   - Total:', response.data.pagination.total);
            console.log('   - Pages:', response.data.pagination.pages);
        }
        
        if (response.data.data && response.data.data.length > 0) {
            console.log('📋 Birinchi appointment:');
            const first = response.data.data[0];
            console.log('   - ID:', first.id);
            console.log('   - User:', first.user_full_name);
            console.log('   - Status:', first.status);
            console.log('   - Date:', first.application_date);
            console.log('   - Salon:', first.salon_name);
        }
        
        return response.data;
    } catch (error) {
        console.error('❌ Salon appointments xatosi:', error.response?.data || error.message);
        throw error;
    }
}

async function testSalonAppointmentsWithFilters(salonId = 1) {
    try {
        console.log(`\n🔍 Salon ${salonId} appointments (filtered)...`);
        const response = await axios.get(`${BASE_URL}/appointments/salon/${salonId}?status=pending&page=1&limit=5`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        console.log('✅ Filtered salon appointments:', response.data.success);
        console.log('📊 Pending appointments:', response.data.data?.length || 0);
        
        return response.data;
    } catch (error) {
        console.error('❌ Filtered salon appointments xatosi:', error.response?.data || error.message);
        throw error;
    }
}

async function testAllAppointments() {
    try {
        console.log('\n📋 Barcha appointmentlarni olish...');
        const response = await axios.get(`${BASE_URL}/appointments`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        console.log('✅ All appointments:', response.data.success);
        console.log('📊 Jami appointments:', response.data.data?.length || 0);
        
        return response.data;
    } catch (error) {
        console.error('❌ All appointments xatosi:', error.response?.data || error.message);
        throw error;
    }
}

async function runTests() {
    try {
        console.log('🚀 Appointment endpoints testini boshlash...\n');
        
        // 1. Login
        const user = await loginUser();
        
        // 2. Test user appointments
        await testUserAppointments();
        
        // 3. Test salon appointments
        await testSalonAppointments(1);
        
        // 4. Test salon appointments with filters
        await testSalonAppointmentsWithFilters(1);
        
        // 5. Test all appointments
        await testAllAppointments();
        
        console.log('\n🎉 Barcha testlar muvaffaqiyatli yakunlandi!');
        
    } catch (error) {
        console.error('\n💥 Test xatosi:', error.message);
        process.exit(1);
    }
}

runTests();