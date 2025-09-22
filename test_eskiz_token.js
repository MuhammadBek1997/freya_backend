const axios = require('axios');
require('dotenv').config();

async function testEskizToken() {
    console.log('🔍 Eskiz token ni tekshirish...\n');
    
    const email = process.env.ESKIZ_EMAIL;
    const password = process.env.ESKIZ_PASSWORD;
    const currentToken = process.env.ESKIZ_TOKEN;
    
    console.log('📧 Email:', email);
    console.log('🔑 Current Token:', currentToken ? currentToken.substring(0, 50) + '...' : 'MAVJUD EMAS');
    
    // 1. Yangi token olish
    try {
        console.log('\n🔄 Yangi token olish...');
        const authResponse = await axios.post('https://notify.eskiz.uz/api/auth/login', {
            email: email,
            password: password
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const newToken = authResponse.data.data.token;
        console.log('✅ Yangi token olindi:', newToken.substring(0, 50) + '...');
        
        // 2. Balansni tekshirish
        console.log('\n💰 Balansni tekshirish...');
        const balanceResponse = await axios.get('https://notify.eskiz.uz/api/user/get-limit', {
            headers: {
                'Authorization': `Bearer ${newToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Balans ma\'lumotlari:', balanceResponse.data);
        
        // 3. Test SMS yuborish
        console.log('\n📱 Test SMS yuborish...');
        const smsResponse = await axios.post('https://notify.eskiz.uz/api/message/sms/send', {
            mobile_phone: '998901234567',
            message: 'Test SMS from Freya app. Verification code: 123456',
            from: '4546',
            callback_url: null
        }, {
            headers: {
                'Authorization': `Bearer ${newToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ SMS yuborildi:', smsResponse.data);
        
        console.log('\n🎉 Barcha testlar muvaffaqiyatli!');
        console.log('\n📝 Yangi token:');
        console.log(newToken);
        
    } catch (error) {
        console.error('❌ Xatolik:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.log('🔐 Authorization xatoligi - email/password noto\'g\'ri');
        } else if (error.response?.status === 400) {
            console.log('📝 Request format xatoligi');
        }
    }
}

testEskizToken();