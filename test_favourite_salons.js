const axios = require('axios');

// Test konfiguratsiyasi
const BASE_URL = 'https://freya-salon-backend-cc373ce6622a.herokuapp.com/api';

// Test user ma'lumotlari (mavjud user token kerak)
const TEST_USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicGhvbmUiOiIrOTk4OTAxMjM0NTY3IiwiaWF0IjoxNzM4NzU5MjAwLCJleHAiOjE3Mzg4NDU2MDB9.example'; // Bu yerga haqiqiy token qo'ying

const headers = {
    'Authorization': `Bearer ${TEST_USER_TOKEN}`,
    'Content-Type': 'application/json'
};

async function testFavouriteSalons() {
    console.log('🧪 Favourite Salons API Test Boshlandi...\n');

    try {
        // Test 1: Favourite salon qo'shish
        console.log('📝 Test 1: Favourite salon qo\'shish');
        try {
            const addResponse = await axios.post(`${BASE_URL}/users/favourites/add`, {
                salon_id: 1
            }, { headers });
            
            console.log('✅ Favourite salon qo\'shish muvaffaqiyatli:');
            console.log(`   Status: ${addResponse.status}`);
            console.log(`   Message: ${addResponse.data.message}`);
            console.log(`   Favourite salons: ${JSON.stringify(addResponse.data.favourite_salons)}`);
        } catch (error) {
            console.log('❌ Favourite salon qo\'shishda xatolik:');
            console.log(`   Status: ${error.response?.status}`);
            console.log(`   Message: ${error.response?.data?.message}`);
        }
        console.log('');

        // Test 2: Yana bir salon qo'shish
        console.log('📝 Test 2: Yana bir salon qo\'shish (ID: 2)');
        try {
            const addResponse2 = await axios.post(`${BASE_URL}/users/favourites/add`, {
                salon_id: 2
            }, { headers });
            
            console.log('✅ Ikkinchi salon qo\'shish muvaffaqiyatli:');
            console.log(`   Status: ${addResponse2.status}`);
            console.log(`   Favourite salons: ${JSON.stringify(addResponse2.data.favourite_salons)}`);
        } catch (error) {
            console.log('❌ Ikkinchi salon qo\'shishda xatolik:');
            console.log(`   Status: ${error.response?.status}`);
            console.log(`   Message: ${error.response?.data?.message}`);
        }
        console.log('');

        // Test 3: Favourite salonlarni olish
        console.log('📝 Test 3: Favourite salonlarni olish');
        try {
            const getFavouritesResponse = await axios.get(`${BASE_URL}/users/favourites?current_language=ru`, { headers });
            
            console.log('✅ Favourite salonlar muvaffaqiyatli olindi:');
            console.log(`   Status: ${getFavouritesResponse.status}`);
            console.log(`   Salonlar soni: ${getFavouritesResponse.data.total}`);
            console.log(`   Salonlar: ${getFavouritesResponse.data.salons.map(s => s.salon_name).join(', ')}`);
        } catch (error) {
            console.log('❌ Favourite salonlarni olishda xatolik:');
            console.log(`   Status: ${error.response?.status}`);
            console.log(`   Message: ${error.response?.data?.message}`);
        }
        console.log('');

        // Test 4: Recommended salonlarni olish
        console.log('📝 Test 4: Recommended salonlarni olish');
        try {
            const recommendedResponse = await axios.get(`${BASE_URL}/salons/recommended?current_language=ru&page=1&limit=5`, { headers });
            
            console.log('✅ Recommended salonlar muvaffaqiyatli olindi:');
            console.log(`   Status: ${recommendedResponse.status}`);
            console.log(`   Salonlar soni: ${recommendedResponse.data.salons.length}`);
            console.log(`   Total salonlar: ${recommendedResponse.data.pagination.total_salons}`);
            console.log(`   Asoslangan turlar: ${JSON.stringify(recommendedResponse.data.recommendation_info?.based_on_types)}`);
            console.log(`   Favourite salonlar soni: ${recommendedResponse.data.recommendation_info?.favourite_salons_count}`);
            
            if (recommendedResponse.data.salons.length > 0) {
                console.log(`   Birinchi tavsiya: ${recommendedResponse.data.salons[0].salon_name}`);
            }
        } catch (error) {
            console.log('❌ Recommended salonlarni olishda xatolik:');
            console.log(`   Status: ${error.response?.status}`);
            console.log(`   Message: ${error.response?.data?.message}`);
        }
        console.log('');

        // Test 5: Favourite salon olib tashlash
        console.log('📝 Test 5: Favourite salon olib tashlash (ID: 1)');
        try {
            const removeResponse = await axios.post(`${BASE_URL}/users/favourites/remove`, {
                salon_id: 1
            }, { headers });
            
            console.log('✅ Favourite salon olib tashlash muvaffaqiyatli:');
            console.log(`   Status: ${removeResponse.status}`);
            console.log(`   Message: ${removeResponse.data.message}`);
            console.log(`   Qolgan favourite salons: ${JSON.stringify(removeResponse.data.favourite_salons)}`);
        } catch (error) {
            console.log('❌ Favourite salon olib tashlashda xatolik:');
            console.log(`   Status: ${error.response?.status}`);
            console.log(`   Message: ${error.response?.data?.message}`);
        }
        console.log('');

        // Test 6: Bo'sh favourite bilan recommended salonlar
        console.log('📝 Test 6: Barcha favourite salonlarni olib tashlash va recommended test');
        try {
            // Qolgan salonni ham olib tashlash
            await axios.post(`${BASE_URL}/users/favourites/remove`, {
                salon_id: 2
            }, { headers });

            const emptyRecommendedResponse = await axios.get(`${BASE_URL}/salons/recommended?current_language=ru`, { headers });
            
            console.log('✅ Bo\'sh favourite bilan recommended test:');
            console.log(`   Status: ${emptyRecommendedResponse.status}`);
            console.log(`   Salonlar soni: ${emptyRecommendedResponse.data.salons.length}`);
            console.log(`   Message: ${emptyRecommendedResponse.data.message}`);
        } catch (error) {
            console.log('❌ Bo\'sh favourite test xatolik:');
            console.log(`   Status: ${error.response?.status}`);
            console.log(`   Message: ${error.response?.data?.message}`);
        }
        console.log('');

        // Test 7: Noto'g'ri salon ID bilan test
        console.log('📝 Test 7: Noto\'g\'ri salon ID bilan test');
        try {
            const invalidResponse = await axios.post(`${BASE_URL}/users/favourites/add`, {
                salon_id: 99999
            }, { headers });
            
            console.log('⚠️ Kutilmagan muvaffaqiyat:');
            console.log(`   Status: ${invalidResponse.status}`);
        } catch (error) {
            console.log('✅ Noto\'g\'ri salon ID to\'g\'ri rad etildi:');
            console.log(`   Status: ${error.response?.status}`);
            console.log(`   Message: ${error.response?.data?.message}`);
        }

    } catch (error) {
        console.error('❌ Umumiy test xatoligi:', error.message);
    }

    console.log('\n🏁 Favourite Salons API Test Tugadi!');
}

// Testni ishga tushirish
testFavouriteSalons();