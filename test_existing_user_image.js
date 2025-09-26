const axios = require('axios');

const BASE_URL = 'https://freya-salon-backend-cc373ce6622a.herokuapp.com/api';

// Existing user credentials
const userCredentials = {
    phone: '+998990972472',
    password: 'pass112233'
};

// Sample base64 image (small PNG)
const sampleImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function testExistingUserImageFunctionality() {
    try {
        console.log('🚀 Mavjud foydalanuvchi bilan rasm funksiyasini test qilish...\n');

        // Step 1: Login to get token
        console.log('🔐 Step 1: Login qilish...');
        const loginResponse = await axios.post(`${BASE_URL}/users/login`, {
            phone: userCredentials.phone,
            password: userCredentials.password
        });
        
        console.log('✅ Login muvaffaqiyatli');
        const token = loginResponse.data.data.token;
        const userId = loginResponse.data.data.user.id;
        console.log('User ID:', userId);
        console.log('Token olindi:', token.substring(0, 30) + '...');

        // Step 2: Check current profile
        console.log('\n👤 Step 2: Hozirgi profilni tekshirish...');
        const currentProfileResponse = await axios.get(`${BASE_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Profil ma\'lumotlari olindi');
        console.log('Hozirda rasm bor:', !!currentProfileResponse.data.user.image);
        if (currentProfileResponse.data.user.image) {
            console.log('Rasm ma\'lumotlari uzunligi:', currentProfileResponse.data.user.image.length);
        }

        // Step 3: Test image upload
        console.log('\n📸 Step 3: Rasm yuklashni test qilish...');
        const uploadResponse = await axios.post(`${BASE_URL}/users/upload-image`, {
            image: sampleImageBase64
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Rasm yuklash muvaffaqiyatli');
        console.log('Rasm URL:', uploadResponse.data.imageUrl);

        // Step 4: Test profile retrieval after upload
        console.log('\n👤 Step 4: Yuklashdan keyin profilni tekshirish...');
        const profileAfterUploadResponse = await axios.get(`${BASE_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Yangilangan profil olindi');
        console.log('Profilda rasm bor:', !!profileAfterUploadResponse.data.user.image);
        if (profileAfterUploadResponse.data.user.image) {
            console.log('Yangi rasm ma\'lumotlari uzunligi:', profileAfterUploadResponse.data.user.image.length);
        }

        // Step 5: Test image retrieval endpoint
        console.log('\n🖼️ Step 5: Rasm olish endpointini test qilish...');
        const imageResponse = await axios.get(`${BASE_URL}/users/image`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Rasm olish muvaffaqiyatli');
        console.log('Rasm ma\'lumotlari olindi:', !!imageResponse.data.image);

        // Step 6: Test image deletion
        console.log('\n🗑️ Step 6: Rasm o\'chirishni test qilish...');
        const deleteResponse = await axios.delete(`${BASE_URL}/users/image`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Rasm o\'chirish muvaffaqiyatli');
        console.log('O\'chirish xabari:', deleteResponse.data.message);

        // Step 7: Verify image is deleted
        console.log('\n🔍 Step 7: Rasm o\'chirilganini tasdiqlash...');
        const profileAfterDeleteResponse = await axios.get(`${BASE_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ O\'chirishdan keyin profil tekshirildi');
        console.log('O\'chirishdan keyin profilda rasm bor:', !!profileAfterDeleteResponse.data.user.image);

        console.log('\n🎉 Barcha rasm funksiyalari muvaffaqiyatli test qilindi!');

    } catch (error) {
        console.error('\n❌ Test muvaffaqiyatsiz:', error.response?.data || error.message);
        if (error.response?.status) {
            console.error('Status:', error.response.status);
        }
        if (error.response?.data) {
            console.error('Response ma\'lumotlari:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Test ishga tushirish
testExistingUserImageFunctionality();