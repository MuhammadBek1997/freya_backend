const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/freya_db'
});

async function verifyTranslation() {
    try {
        const result = await pool.query('SELECT id, salon_name_en, salon_types FROM salons ORDER BY id');
        
        console.log('🔍 Current salon types in database:');
        console.log('=====================================');
        
        const allTypes = [];
        
        result.rows.forEach(salon => {
            console.log(`\nSalon ID: ${salon.id}`);
            console.log(`Name: ${salon.salon_name_en}`);
            console.log(`Types: ${JSON.stringify(salon.salon_types, null, 2)}`);
            
            if (salon.salon_types && Array.isArray(salon.salon_types)) {
                salon.salon_types.forEach(type => {
                    if (type.type && !allTypes.includes(type.type)) {
                        allTypes.push(type.type);
                    }
                });
            }
        });
        
        console.log('\n📊 All unique salon types found:');
        allTypes.forEach(type => console.log(`  - ${type}`));
        
        // Check for Russian characters
        const russianTypes = allTypes.filter(type => /[а-яё]/i.test(type));
        
        if (russianTypes.length > 0) {
            console.log('\n❌ Russian types still found:');
            russianTypes.forEach(type => console.log(`  - ${type}`));
        } else {
            console.log('\n✅ All salon types are now in English!');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

verifyTranslation();