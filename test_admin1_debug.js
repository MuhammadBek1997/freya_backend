const axios = require('axios');

async function testAdmin1Login() {
    try {
        console.log('Admin1 login qilish...');
        
        const response = await axios.post('http://localhost:5009/api/auth/admin/login', {
            username: 'admin1',
            password: 'admin123'
        });
        
        console.log('Login muvaffaqiyatli:', response.data);
        const token = response.data.token;
        
        console.log('\nAdmin salon ma\'lumotlarini olish...');
        
        const salonResponse = await axios.get('http://localhost:5009/api/salons', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Salon ma\'lumotlari:', salonResponse.data);
        
    } catch (error) {
        console.error('Xatolik:', error.response?.data || error.message);
    }
}

testAdmin1Login();