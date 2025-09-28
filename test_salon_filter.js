const axios = require('axios');

async function testSalonFilterEndpoint() {
    try {
        // Admin 1 uchun token olish
        const loginResponse = await axios.post('http://localhost:3007/api/auth/admin/login', {
            username: 'admin1',
            password: 'admin1123'
        });

        const token = loginResponse.data.token;
        const adminData = loginResponse.data.user;
        
        console.log('Admin ma\'lumotlari:', {
            id: adminData.id,
            email: adminData.email,
            salon_id: adminData.salon_id,
            role: adminData.role
        });

        // Yangi salon filter endpoint ni test qilish
        const salonId = adminData.salon_id;
        console.log(`\nYangi endpoint ni test qilish: /api/appointments/filter/salon/${salonId}`);
        
        const filterResponse = await axios.get(`http://localhost:3007/api/appointments/filter/salon/${salonId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Yangi endpoint javobi:');
        console.log('Status:', filterResponse.status);
        console.log('Success:', filterResponse.data.success);
        console.log('Message:', filterResponse.data.message);
        console.log('Appointmentlar soni:', filterResponse.data.data?.length || 0);
        console.log('Salon ma\'lumotlari:', filterResponse.data.salon);
        console.log('Pagination:', filterResponse.data.pagination);
        
        // Birinchi appointmentning strukturasini ko'rsatish
        if (filterResponse.data.data && filterResponse.data.data.length > 0) {
            console.log('\nBirinchi appointment ma\'lumotlari:');
            console.log(JSON.stringify(filterResponse.data.data[0], null, 2));
        }

        // Status bo'yicha filtrlash test qilish
        console.log('\n--- Status bo\'yicha filtrlash (pending) ---');
        const statusFilterResponse = await axios.get(`http://localhost:3007/api/appointments/filter/salon/${salonId}?status=pending`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Pending appointmentlar soni:', statusFilterResponse.data.data?.length || 0);
        
        // Limit bilan test qilish
        console.log('\n--- Limit bilan test qilish (limit=2) ---');
        const limitResponse = await axios.get(`http://localhost:3007/api/appointments/filter/salon/${salonId}?limit=2`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Limit=2 bilan appointmentlar soni:', limitResponse.data.data?.length || 0);
        console.log('Pagination:', limitResponse.data.pagination);

    } catch (error) {
        console.error('Test xatosi:', error.response?.data || error.message);
    }
}

testSalonFilterEndpoint();