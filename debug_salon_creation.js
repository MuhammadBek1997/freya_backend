const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3000/api';

async function debugSalonCreation() {
    try {
        console.log('🔍 Salon yaratish jarayonini debug qilish...\n');

        // Admin token olish
        const loginResponse = await axios.post(`${BASE_URL}/auth/admin/login`, {
            username: 'admin',
            password: 'admin123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Admin token olindi');

        // Salon yaratish
        const salonData = {
            salon_name: 'Test Debug Salon',
            salon_description: 'Bu debug uchun test salon',
            salon_title: 'Debug Test Salon',
            salon_address: 'Test Address',
            salon_phone: '+998901234567',
            salon_email: 'debug@test.com',
            salon_types: ['beauty', 'spa'],
            work_schedule: [
                { day: 'Monday', start: '09:00', end: '18:00' }
            ],
            location: { lat: 41.2995, lng: 69.2401 },
            salon_photos: ['photo1.jpg'],
            salon_comfort: ['wifi', 'parking'],
            salon_additionals: ['massage'],
            salon_payment: { cash: true, card: true },
            private_salon: false,
            salon_orient: { type: 'mixed' }
        };

        console.log('📤 Salon yaratish so\'rovi yuborilmoqda...');
        console.log('Salon ma\'lumotlari:', JSON.stringify(salonData, null, 2));

        const createResponse = await axios.post(`${BASE_URL}/salons`, salonData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Salon yaratildi');
        console.log('Javob:', JSON.stringify(createResponse.data, null, 2));

        const salonId = createResponse.data.data.id;

        // Bir oz kutamiz translation service ishlashi uchun
        console.log('\n⏳ Translation service ishlashi uchun 3 soniya kutamiz...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Salon ma'lumotlarini olish
        console.log('\n📥 Salon ma\'lumotlarini olish...');
        const getSalonResponse = await axios.get(`${BASE_URL}/salons/${salonId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Salon ma\'lumotlari:');
        console.log(JSON.stringify(getSalonResponse.data, null, 2));

    } catch (error) {
        console.error('❌ Xatolik:', error.response?.data || error.message);
    }
}

debugSalonCreation();