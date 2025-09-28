const pool = require('./config/database');

async function updateProductionComfort() {
    try {
        console.log('Production ma\'lumotlar bazasini yangilamoqda...');
        
        // Barcha salonlarni olish
        const salonsResult = await pool.query('SELECT id, salon_name, salon_comfort FROM salons');
        console.log(`Jami ${salonsResult.rows.length} ta salon topildi`);
        
        let updatedCount = 0;
        
        for (const salon of salonsResult.rows) {
            let comfort = salon.salon_comfort || [];
            let hasChanges = false;
            
            // allow14 va allow16 ni topish va o'chirish
            comfort = comfort.filter(item => {
                if (item.name === 'allow14' || item.name === 'allow16') {
                    console.log(`${salon.salon_name} salonidan ${item.name} o'chirildi`);
                    hasChanges = true;
                    return false;
                }
                return true;
            });
            
            // kids mavjudligini tekshirish
            const hasKids = comfort.some(item => item.name === 'kids');
            if (!hasKids) {
                comfort.push({
                    name: 'kids',
                    isActive: true
                });
                console.log(`${salon.salon_name} saloniga kids qo'shildi`);
                hasChanges = true;
            }
            
            // Agar o'zgarishlar bo'lsa, yangilash
            if (hasChanges) {
                await pool.query(
                    'UPDATE salons SET salon_comfort = $1 WHERE id = $2',
                    [JSON.stringify(comfort), salon.id]
                );
                updatedCount++;
                console.log(`${salon.salon_name} saloni yangilandi`);
            }
        }
        
        console.log(`\nJami ${updatedCount} ta salon yangilandi`);
        console.log('Production ma\'lumotlar bazasi muvaffaqiyatli yangilandi!');
        
    } catch (error) {
        console.error('Xatolik:', error.message);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

updateProductionComfort();