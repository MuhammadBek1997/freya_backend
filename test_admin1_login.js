const axios = require('axios');

async function testAdmin1Login() {
    try {
        console.log('🔐 admin1 login testi...\n');

        const loginData = {
            username: 'admin1',
            password: 'admin1123'
        };

        console.log('📤 Login ma\'lumotlari yuborilmoqda:', loginData);

        const response = await axios.post('https://freya-salon-backend-cc373ce6622a.herokuapp.com/api/auth/admin/login', loginData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Login muvaffaqiyatli!');
        console.log('📋 Javob:', {
            success: response.data.success,
            message: response.data.message,
            admin: response.data.admin ? {
                id: response.data.admin.id,
                username: response.data.admin.username,
                email: response.data.admin.email,
                role: response.data.admin.role
            } : null,
            token: response.data.token ? 'Token mavjud' : 'Token yo\'q'
        });

    } catch (error) {
        console.error('❌ Login xatoligi:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });
    }
}

testAdmin1Login();