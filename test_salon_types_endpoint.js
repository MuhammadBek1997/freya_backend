const axios = require('axios');

// Test yangi salon types endpoint
async function testSalonTypesEndpoint() {
    console.log('🧪 Salon types endpoint test boshlandi...\n');
    
    const baseURL = 'https://freya-salon-backend-cc373ce6622a.herokuapp.com';
    
    try {
        // Test 1: Salon turlari bilan filtrlash
        console.log('📋 Test 1: "Beauty Salon" va "Fitness" turlari bilan filtrlash');
        
        const response1 = await axios.get(`${baseUrl}/salons`, {
            params: {
                salon_types: 'Beauty Salon,Fitness',
                current_language: 'ru',
                page: 1,
                limit: 5
            }
        });
        
        console.log('✅ Status:', response1.status);
        console.log('📊 Topilgan salonlar soni:', response1.data.salons?.length || 0);
        console.log('🔍 Filtrlangan turlar:', response1.data.filters?.salon_types);
        console.log('📄 Pagination:', response1.data.pagination);
        
        if (response1.data.salons && response1.data.salons.length > 0) {
            console.log('🏢 Birinchi salon:', {
                id: response1.data.salons[0].id,
                name: response1.data.salons[0].name,
                salon_types: response1.data.salons[0].salon_types?.map(type => type.name)
            });
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Test 2: Yangi qo'shilgan turlar bilan test
        console.log('📋 Test 2: "For Children" va "Outdoor" turlari bilan filtrlash');
        
        const response2 = await axios.get(`${baseUrl}/salons`, {
            params: {
                salon_types: 'For Children,Outdoor',
                current_language: 'ru',
                page: 1,
                limit: 5
            }
        });
        
        console.log('✅ Status:', response2.status);
        console.log('📊 Topilgan salonlar soni:', response2.data.salons?.length || 0);
        console.log('🔍 Filtrlangan turlar:', response2.data.filters?.salon_types);
        
        if (response2.data.salons && response2.data.salons.length > 0) {
            console.log('🏢 Birinchi salon:', {
                id: response2.data.salons[0].id,
                name: response2.data.salons[0].name,
                salon_types: response2.data.salons[0].salon_types?.map(type => type.name)
            });
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Test 3: Qidiruv bilan birgalikda
        console.log('📋 Test 3: "Beauty Salon" turi va "beauty" qidiruvi');
        
        const response3 = await axios.get(`${baseUrl}/salons`, {
            params: {
                salon_types: 'Beauty Salon',
                search: 'beauty',
                current_language: 'ru',
                page: 1,
                limit: 3
            }
        });
        
        console.log('✅ Status:', response3.status);
        console.log('📊 Topilgan salonlar soni:', response3.data.salons?.length || 0);
        console.log('🔍 Qidiruv so\'zi:', response3.data.filters?.search);
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Test 4: Noto'g'ri parametr bilan test
        console.log('📋 Test 4: salon_types parametrisiz so\'rov (xato kutilmoqda)');
        try {
            const response4 = await axios.get(`${baseURL}/api/salons/filter/types`, {
                params: {
                    current_language: 'ru',
                    page: 1,
                    limit: 5
                }
            });
            console.log('❌ Kutilmagan muvaffaqiyat:', response4.status);
        } catch (error) {
            console.log('✅ Kutilgan xato:', error.response?.status, error.response?.data?.message);
        }
        
        console.log('\n🎉 Barcha testlar yakunlandi!');
        
    } catch (error) {
        console.error('❌ Test xatosi:', error.response?.data || error.message);
    }
}

// Test ishga tushirish
testSalonTypesEndpoint();