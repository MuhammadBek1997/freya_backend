require('dotenv').config();
const axios = require('axios');

const templates = [
    "Freya mobil ilovasiga ro'yxatdan o'tish uchun tasdiqlash kodi: {code}",
    "Freya ilovasida parolni tiklash uchun tasdiqlash kodi: {code}",
    "Freya ilovasida telefon raqamni o'zgartirish uchun tasdiqlash kodi: {code}"
];

async function submitTemplates() {
    try {
        console.log('🔑 Eskiz token:', process.env.ESKIZ_TOKEN);
        
        for (let i = 0; i < templates.length; i++) {
            const template = templates[i];
            console.log(`\n📝 Template ${i + 1} yuborish: ${template}`);
            
            try {
                const response = await axios.post(
                    'https://notify.eskiz.uz/api/user/sms/template',
                    {
                        text: template,
                        title: `Freya Template ${i + 1}`
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${process.env.ESKIZ_TOKEN}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                console.log('✅ Template yuborildi:', response.data);
            } catch (error) {
                console.log('❌ Xatolik:', error.response?.data || error.message);
            }
        }
    } catch (error) {
        console.error('❌ Umumiy xatolik:', error.message);
    }
}

submitTemplates();