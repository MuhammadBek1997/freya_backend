const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkSalonCoordinates() {
    try {
        console.log('🔍 Salon koordinatalarini tekshirish...\n');
        
        // Salon jadvalining strukturasini ko'rish
        const structureQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'salons' 
            ORDER BY ordinal_position;
        `;
        
        const structureResult = await pool.query(structureQuery);
        console.log('📋 Salons jadvali strukturasi:');
        structureResult.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        console.log('');
        
        // Barcha salonlarni va ularning koordinatalarini ko'rish
        const salonsQuery = `
            SELECT id, name, address, location, created_at
            FROM salons 
            ORDER BY id;
        `;
        
        const salonsResult = await pool.query(salonsQuery);
        console.log('🏢 Salonlar va ularning koordinatalari:');
        console.log('='.repeat(80));
        
        salonsResult.rows.forEach((salon, index) => {
            console.log(`${index + 1}. Salon: ${salon.name}`);
            console.log(`   ID: ${salon.id}`);
            console.log(`   Address: ${salon.address}`);
            console.log(`   Location JSON: ${JSON.stringify(salon.location)}`);
            console.log(`   Created: ${salon.created_at}`);
            
            // Location JSON dan lat va long ni ajratib olish
            let lat = null, long = null;
            if (salon.location) {
                lat = salon.location.lat;
                long = salon.location.long;
            }
            
            console.log(`   Lat: ${lat} (type: ${typeof lat})`);
            console.log(`   Long: ${long} (type: ${typeof long})`);
            
            // Koordinatalar to'g'ri ekanligini tekshirish
            const isLatValid = lat !== null && !isNaN(lat) && lat !== undefined;
            const isLongValid = long !== null && !isNaN(long) && long !== undefined;
            
            console.log(`   ✅ Lat valid: ${isLatValid}`);
            console.log(`   ✅ Long valid: ${isLongValid}`);
            console.log('   ' + '-'.repeat(50));
        });
        
        console.log(`\n📊 Jami salonlar: ${salonsResult.rows.length}`);
        
        // Koordinatalar statistikasi
        const validCoords = salonsResult.rows.filter(salon => {
            if (!salon.location) return false;
            const lat = salon.location.lat;
            const long = salon.location.long;
            return lat !== null && !isNaN(lat) && lat !== undefined &&
                   long !== null && !isNaN(long) && long !== undefined;
        });
        
        console.log(`✅ To'g'ri koordinatalarga ega salonlar: ${validCoords.length}`);
        console.log(`❌ Noto'g'ri koordinatalarga ega salonlar: ${salonsResult.rows.length - validCoords.length}`);
        
        if (validCoords.length < salonsResult.rows.length) {
            console.log('\n⚠️  Ba\'zi salonlarda koordinatalar noto\'g\'ri yoki mavjud emas!');
        }
        
    } catch (error) {
        console.error('❌ Xatolik yuz berdi:', error.message);
    } finally {
        await pool.end();
    }
}

checkSalonCoordinates();