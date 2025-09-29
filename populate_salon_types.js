const { pool } = require('./config/database');

async function populateSalonTypes() {
    try {
        console.log('=== SALONLARGA DEFAULT SALON TYPES QO\'SHISH (INGLIZCHA) ===\n');
        
        // Default English salon types
        const defaultSalonTypes = [
            {"type": "Beauty Salon", "selected": true},
            {"type": "Fitness", "selected": false},
            {"type": "Functional Training", "selected": false},
            {"type": "Yoga", "selected": false},
            {"type": "Massage", "selected": false}
        ];
        
        console.log('Default salon types (inglizcha):');
        defaultSalonTypes.forEach(type => {
            console.log(`  - "${type.type}" (selected: ${type.selected})`);
        });
        console.log('');
        
        // Get all salons
        const salonsResult = await pool.query('SELECT id, salon_name, salon_types FROM salons ORDER BY id');
        
        console.log(`Jami salonlar: ${salonsResult.rows.length}\n`);
        
        let updatedCount = 0;
        
        for (const salon of salonsResult.rows) {
            console.log(`Salon: ${salon.salon_name} (ID: ${salon.id})`);
            
            // Check if salon_types is null or empty
            if (!salon.salon_types || salon.salon_types === null) {
                console.log('  - salon_types NULL, default qiymatlar qo\'shilmoqda...');
                
                // Update with default salon types
                await pool.query(
                    'UPDATE salons SET salon_types = $1 WHERE id = $2',
                    [JSON.stringify(defaultSalonTypes), salon.id]
                );
                
                console.log('  ✅ Default salon types qo\'shildi');
                updatedCount++;
            } else {
                console.log('  - salon_types allaqachon mavjud, o\'tkazib yuborildi');
            }
            
            console.log('');
        }
        
        console.log(`\n=== NATIJA ===`);
        console.log(`Yangilangan salonlar: ${updatedCount}`);
        console.log(`Jami salonlar: ${salonsResult.rows.length}`);
        
        // Show updated results
        console.log('\n=== YANGILANGAN SALON TYPES ===\n');
        const updatedResult = await pool.query('SELECT id, salon_name, salon_types FROM salons ORDER BY id');
        
        updatedResult.rows.forEach((salon, index) => {
            console.log(`${index + 1}. ${salon.salon_name} (ID: ${salon.id})`);
            if (salon.salon_types && Array.isArray(salon.salon_types)) {
                salon.salon_types.forEach(type => {
                    console.log(`   - ${type.type} (selected: ${type.selected})`);
                });
            } else if (salon.salon_types) {
                try {
                    const types = JSON.parse(salon.salon_types);
                    types.forEach(type => {
                        console.log(`   - ${type.type} (selected: ${type.selected})`);
                    });
                } catch (error) {
                    console.log(`   - Raw: ${salon.salon_types}`);
                }
            } else {
                console.log('   - salon_types: NULL');
            }
            console.log('');
        });
        
    } catch (error) {
        console.error('Xatolik yuz berdi:', error);
    } finally {
        await pool.end();
    }
}

populateSalonTypes();