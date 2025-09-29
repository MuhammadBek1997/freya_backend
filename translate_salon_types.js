const { pool } = require('./config/database');

async function translateSalonTypes() {
    try {
        console.log('=== SALON TYPES TARJIMASI (RUSCHA -> INGLIZCHA) ===\n');
        
        // Translation mapping
        const translations = {
            "Салон красоты": "Beauty Salon",
            "Фитнес": "Fitness", 
            "Функциональные тренировки": "Functional Training",
            "Йога": "Yoga",
            "Массаж": "Massage",
            "Для детей": "For Children",
            "На природе": "Outdoor"
        };
        
        console.log('Tarjima jadvali:');
        Object.entries(translations).forEach(([russian, english]) => {
            console.log(`  "${russian}" → "${english}"`);
        });
        console.log('');
        
        // Get all salons with their current salon_types
        const salonsResult = await pool.query('SELECT id, salon_name, salon_types FROM salons ORDER BY id');
        
        console.log(`Jami salonlar: ${salonsResult.rows.length}\n`);
        
        let updatedCount = 0;
        
        for (const salon of salonsResult.rows) {
            console.log(`Salon: ${salon.salon_name} (ID: ${salon.id})`);
            
            if (!salon.salon_types || salon.salon_types === null) {
                console.log('  - salon_types NULL, o\'tkazib yuborildi\n');
                continue;
            }
            
            let salonTypes;
            try {
                salonTypes = Array.isArray(salon.salon_types) ? salon.salon_types : JSON.parse(salon.salon_types);
            } catch (error) {
                console.log('  - JSON parse xatosi, o\'tkazib yuborildi\n');
                continue;
            }
            
            if (!Array.isArray(salonTypes) || salonTypes.length === 0) {
                console.log('  - salon_types bo\'sh yoki noto\'g\'ri format, o\'tkazib yuborildi\n');
                continue;
            }
            
            console.log('  Hozirgi turlar:');
            salonTypes.forEach(type => {
                console.log(`    - "${type.type}" (selected: ${type.selected})`);
            });
            
            // Translate salon types
            let hasChanges = false;
            const translatedTypes = salonTypes.map(typeObj => {
                if (translations[typeObj.type]) {
                    console.log(`    Tarjima: "${typeObj.type}" → "${translations[typeObj.type]}"`);
                    hasChanges = true;
                    return {
                        ...typeObj,
                        type: translations[typeObj.type]
                    };
                }
                return typeObj;
            });
            
            if (hasChanges) {
                // Update the salon with translated types
                await pool.query(
                    'UPDATE salons SET salon_types = $1 WHERE id = $2',
                    [JSON.stringify(translatedTypes), salon.id]
                );
                
                console.log('  ✅ Muvaffaqiyatli yangilandi');
                updatedCount++;
            } else {
                console.log('  - Tarjima qilish uchun turlar topilmadi');
            }
            
            console.log('');
        }
        
        console.log(`\n=== NATIJA ===`);
        console.log(`Jami yangilangan salonlar: ${updatedCount}`);
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

translateSalonTypes();