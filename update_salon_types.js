const { Pool } = require('pg');

// Production database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function updateSalonTypes() {
    try {
        console.log('🔧 Updating salon types...\n');
        
        // Get all salons
        const salonsResult = await pool.query(`
            SELECT id, name, salon_type 
            FROM salons 
            ORDER BY created_at
        `);
        
        console.log('📍 CURRENT SALONS:');
        salonsResult.rows.forEach((salon, index) => {
            console.log(`${index + 1}. ${salon.name} - Type: ${salon.salon_type}`);
        });
        
        // Update specific salons to corporate
        // Let's make the first 4 salons corporate and keep 2 as private
        const salonsToUpdate = salonsResult.rows.slice(0, 4); // First 4 salons
        
        console.log('\n🔄 Updating salons to corporate type:');
        for (const salon of salonsToUpdate) {
            await pool.query(`
                UPDATE salons 
                SET salon_type = 'corporate' 
                WHERE id = $1
            `, [salon.id]);
            
            console.log(`✅ Updated "${salon.name}" to corporate`);
        }
        
        // Show updated results
        const updatedSalons = await pool.query(`
            SELECT id, name, salon_type 
            FROM salons 
            ORDER BY created_at
        `);
        
        console.log('\n📍 UPDATED SALONS:');
        const privateCount = updatedSalons.rows.filter(s => s.salon_type === 'private').length;
        const corporateCount = updatedSalons.rows.filter(s => s.salon_type === 'corporate').length;
        
        updatedSalons.rows.forEach((salon, index) => {
            console.log(`${index + 1}. ${salon.name} - Type: ${salon.salon_type}`);
        });
        
        console.log(`\n📊 Summary:`);
        console.log(`   Private salons: ${privateCount}`);
        console.log(`   Corporate salons: ${corporateCount}`);
        console.log(`   Total salons: ${updatedSalons.rows.length}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
        console.log('\n🔚 Database connection closed');
    }
}

updateSalonTypes();