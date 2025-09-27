const { pool } = require('./config/database');

async function updateSalonTypes() {
    try {
        console.log('Barcha salonlarga yangi salon turlarini qo\'shish...\n');
        
        // Avval barcha salonlarni olish
        const salonsResult = await pool.query('SELECT id, name, salon_types FROM salons ORDER BY created_at');
        
        console.log(`Jami salonlar: ${salonsResult.rows.length}\n`);
        
        for (const salon of salonsResult.rows) {
            console.log(`Salon yangilanmoqda: ${salon.name}`);
            
            // Hozirgi salon_types ni olish
            let currentTypes = salon.salon_types || [];
            
            // Yangi turlarni qo'shish
            const newTypes = [
                {
                    "type": "Для детей",
                    "selected": false
                },
                {
                    "type": "На природе", 
                    "selected": false
                }
            ];
            
            // Yangi turlar allaqachon mavjudligini tekshirish
            const existingTypeNames = currentTypes.map(t => t.type);
            
            newTypes.forEach(newType => {
                if (!existingTypeNames.includes(newType.type)) {
                    currentTypes.push(newType);
                    console.log(`  - Qo'shildi: ${newType.type}`);
                } else {
                    console.log(`  - Allaqachon mavjud: ${newType.type}`);
                }
            });
            
            // Salonni yangilash
            await pool.query(
                'UPDATE salons SET salon_types = $1 WHERE id = $2',
                [JSON.stringify(currentTypes), salon.id]
            );
            
            console.log(`  ✓ ${salon.name} muvaffaqiyatli yangilandi\n`);
        }
        
        console.log('Barcha salonlar muvaffaqiyatli yangilandi!');
        
        // Yangilangan natijalarni ko'rsatish
        console.log('\n=== YANGILANGAN SALON TYPES ===\n');
        const updatedResult = await pool.query('SELECT id, name, salon_types FROM salons ORDER BY created_at');
        
        updatedResult.rows.forEach((salon, index) => {
            console.log(`${index + 1}. ${salon.name}:`);
            salon.salon_types.forEach(type => {
                console.log(`   - ${type.type} (${type.selected ? 'tanlangan' : 'tanlanmagan'})`);
            });
            console.log('');
        });
        
    } catch (error) {
        console.error('Xatolik:', error);
    } finally {
        await pool.end();
        process.exit();
    }
}

updateSalonTypes();