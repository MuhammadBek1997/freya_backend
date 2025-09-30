const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testSalonAPI() {
    try {
        console.log('🧪 Salon API ni test qilish...\n');
        
        // Salon ma'lumotlarini olish (API kabi)
        const salonsQuery = `
            SELECT 
                id, 
                name, 
                address, 
                location,
                salon_types,
                salon_comfort,
                is_private
            FROM salons 
            ORDER BY name;
        `;
        
        const result = await pool.query(salonsQuery);
        
        console.log('📡 API Response (JSON format):');
        console.log('='.repeat(60));
        
        const apiResponse = result.rows.map(salon => ({
            id: salon.id,
            name: salon.name,
            address: salon.address,
            location: salon.location,
            salon_types: salon.salon_types,
            salon_comfort: salon.salon_comfort,
            is_private: salon.is_private
        }));
        
        console.log(JSON.stringify(apiResponse, null, 2));
        
        console.log('\n📍 Koordinatalar tekshiruvi:');
        console.log('='.repeat(60));
        
        apiResponse.forEach((salon, index) => {
            console.log(`${index + 1}. ${salon.name}`);
            if (salon.location) {
                console.log(`   Lat: ${salon.location.lat} (${typeof salon.location.lat})`);
                console.log(`   Long: ${salon.location.long} (${typeof salon.location.long})`);
                console.log(`   ✅ Koordinatalar mavjud: ${salon.location.lat && salon.location.long ? 'Ha' : 'Yo\'q'}`);
            } else {
                console.log('   ❌ Location ma\'lumoti yo\'q');
            }
            console.log('');
        });
        
        console.log('🎯 Frontend uchun test:');
        console.log('='.repeat(60));
        
        // Frontend kabi test qilish
        const profArr = apiResponse; // Frontend da profArr[0] ishlatiladi
        if (profArr.length > 0) {
            const firstSalon = profArr[0];
            console.log('profArr[0]:', JSON.stringify(firstSalon, null, 2));
            console.log('profArr[0]?.location?.lat:', firstSalon?.location?.lat);
            console.log('profArr[0]?.location?.long:', firstSalon?.location?.long);
            
            const lat = firstSalon?.location?.lat;
            const long = firstSalon?.location?.long;
            
            console.log(`\nYandexMap komponentiga uzatiladigan qiymatlar:`);
            console.log(`lat: ${lat} (type: ${typeof lat})`);
            console.log(`long: ${long} (type: ${typeof long})`);
            console.log(`isNaN(lat): ${isNaN(lat)}`);
            console.log(`isNaN(long): ${isNaN(long)}`);
            
            if (lat && long && !isNaN(lat) && !isNaN(long)) {
                console.log('✅ Koordinatalar YandexMap uchun to\'g\'ri!');
            } else {
                console.log('❌ Koordinatalar YandexMap uchun noto\'g\'ri!');
            }
        }
        
    } catch (error) {
        console.error('❌ Xatolik yuz berdi:', error.message);
    } finally {
        await pool.end();
    }
}

testSalonAPI();