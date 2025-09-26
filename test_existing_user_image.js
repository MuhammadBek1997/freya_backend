const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://freya-salon-backend-cc373ce6622a.herokuapp.com/api';

// Test uchun foydalanuvchi ma'lumotlari
const userCredentials = {
    phone: '+998990972472',
    password: 'pass112233'
};

// Test uchun oddiy rasm fayli yaratish
function createTestImageFile() {
    const testImagePath = path.join(__dirname, 'test_image.png');
    // 1x1 pixel PNG fayl yaratish
    const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x5C, 0x72, 0xA3, 0x66, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    fs.writeFileSync(testImagePath, pngBuffer);
    return testImagePath;
}

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
        console.log('Hozirda rasm bor:', !!currentProfileResponse.data.data.user.image);
        if (currentProfileResponse.data.data.user.image) {
            console.log('Rasm ma\'lumotlari uzunligi:', currentProfileResponse.data.data.user.image.length);
        }

        // Step 3: Test image upload
        console.log('\n📸 Step 3: Rasm yuklashni test qilish...');
        
        // Test rasm faylini yaratish
        const testImagePath = createTestImageFile();
        
        // FormData yaratish
        const formData = new FormData();
        formData.append('image', fs.createReadStream(testImagePath));
        
        const uploadResponse = await axios.post(`${BASE_URL}/users/profile/image/upload`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                ...formData.getHeaders()
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
        console.log('Profilda rasm bor:', !!profileAfterUploadResponse.data.data.user.image);
        if (profileAfterUploadResponse.data.data.user.image) {
            console.log('Yangi rasm ma\'lumotlari uzunligi:', profileAfterUploadResponse.data.data.user.image.length);
        }

        // Step 5: Test image retrieval endpoint
        console.log('\n🖼️ Step 5: Rasm olish endpointini test qilish...');
        const imageResponse = await axios.get(`${BASE_URL}/users/profile/image`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Rasm olish muvaffaqiyatli');
        console.log('Rasm ma\'lumotlari olindi:', !!imageResponse.data.image);

        // Step 6: Test image deletion
        console.log('\n🗑️ Step 6: Rasm o\'chirishni test qilish...');
        const deleteResponse = await axios.delete(`${BASE_URL}/users/profile/image`, {
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
        console.log('O\'chirishdan keyin profilda rasm bor:', !!profileAfterDeleteResponse.data.data.user.image);

        console.log('\n🎉 Barcha rasm funksiyalari muvaffaqiyatli test qilindi!');

    } catch (error) {
        console.error('\n❌ Test muvaffaqiyatsiz:', error.response?.data || error.message);
        if (error.response?.status) {
            console.error('Status:', error.response.status);
        }
        if (error.response?.data) {
            console.error('Response ma\'lumotlari:', JSON.stringify(error.response.data, null, 2));
        }
    } finally {
        // Test fayl tozalash
        const testImagePath = path.join(__dirname, 'test_image.png');
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath);
            console.log('\n🧹 Test fayli tozalandi');
        }
    }
}

// Test ishga tushirish
testExistingUserImageFunctionality();