const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixSalonCoordinates() {
    try {
        console.log('🔧 Salon koordinatalarini tuzatish...\n');
        
        // Hozirgi koordinatalarni ko'rish
        const currentQuery = `
            SELECT id, name, location
            FROM salons 
            ORDER BY name;
        `;
        
        const currentResult = await pool.query(currentQuery);
        console.log('📍 Hozirgi koordinatalar:');
        console.log('='.repeat(60));
        
        currentResult.rows.forEach((salon, index) => {
            console.log(`${index + 1}. ${salon.name}`);
            console.log(`   Location: ${JSON.stringify(salon.location)}`);
            
            if (salon.location) {
                console.log(`   Latitude: ${salon.location.latitude}`);
                console.log(`   Longitude: ${salon.location.longitude}`);
            }
            console.log('');
        });
        
        // Koordinatalarni lat/long formatiga o'zgartirish
        console.log('🔄 Koordinatalarni lat/long formatiga ozgartirish...\n');
        
        for (const salon of currentResult.rows) {
            if (salon.location && salon.location.latitude && salon.location.longitude) {
                const newLocation = {
                    lat: salon.location.latitude,
                    long: salon.location.longitude
                };
                
                const updateQuery = `
                    UPDATE salons 
                    SET location = $1 
                    WHERE id = $2
                `;
                
                await pool.query(updateQuery, [JSON.stringify(newLocation), salon.id]);
                
                console.log(`✅ ${salon.name} koordinatalari yangilandi:`);
                console.log(`   Eski: latitude=${salon.location.latitude}, longitude=${salon.location.longitude}`);
                console.log(`   Yangi: lat=${newLocation.lat}, long=${newLocation.long}`);
                console.log('');
            }
        }
        
        // Yangilangan koordinatalarni tekshirish
        console.log('🔍 Yangilangan koordinatalarni tekshirish...\n');
        
        const updatedResult = await pool.query(currentQuery);
        console.log('📍 Yangilangan koordinatalar:');
        console.log('='.repeat(60));
        
        updatedResult.rows.forEach((salon, index) => {
            console.log(`${index + 1}. ${salon.name}`);
            console.log(`   Location: ${JSON.stringify(salon.location)}`);
            
            if (salon.location) {
                console.log(`   Lat: ${salon.location.lat} (type: ${typeof salon.location.lat})`);
                console.log(`   Long: ${salon.location.long} (type: ${typeof salon.location.long})`);
                
                const isLatValid = salon.location.lat !== null && !isNaN(salon.location.lat) && salon.location.lat !== undefined;
                const isLongValid = salon.location.long !== null && !isNaN(salon.location.long) && salon.location.long !== undefined;
                
                console.log(`   ✅ Lat valid: ${isLatValid}`);
                console.log(`   ✅ Long valid: ${isLongValid}`);
            }
            console.log('');
        });
        
        console.log('🎉 Barcha salon koordinatalari muvaffaqiyatli yangilandi!');
        
    } catch (error) {
        console.error('❌ Xatolik yuz berdi:', error.message);
    } finally {
        await pool.end();
    }
}

fixSalonCoordinates();