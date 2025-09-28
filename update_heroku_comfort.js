require('dotenv').config({ path: '.env.production' });
const { Pool } = require('pg');

// Production ma'lumotlar bazasiga ulanish
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function updateHerokuComfort() {
    try {
        console.log('Heroku production ma\'lumotlar bazasiga ulanmoqda...');
        console.log('Database URL:', process.env.DATABASE_URL ? 'Mavjud' : 'Yo\'q');
        
        // Barcha salonlarni olish
        const salonsResult = await pool.query('SELECT id, name, salon_comfort FROM salons');
        console.log(`Jami ${salonsResult.rows.length} ta salon topildi`);
        
        let updatedCount = 0;
        
        for (const salon of salonsResult.rows) {
            let comfort = salon.salon_comfort || [];
            let hasChanges = false;
            
            console.log(`\n${salon.name} salonini tekshirmoqda...`);
            console.log('Hozirgi comfort:', comfort.map(c => c.name).join(', '));
            
            // allow14 va allow16 ni topish va o'chirish
            const originalLength = comfort.length;
            comfort = comfort.filter(item => {
                if (item.name === 'allow14' || item.name === 'allow16') {
                    console.log(`  - ${item.name} o'chirildi`);
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
                console.log(`  - kids qo'shildi`);
                hasChanges = true;
            }
            
            // Agar o'zgarishlar bo'lsa, yangilash
            if (hasChanges) {
                await pool.query(
                    'UPDATE salons SET salon_comfort = $1 WHERE id = $2',
                    [JSON.stringify(comfort), salon.id]
                );
                updatedCount++;
                console.log(`  ✅ ${salon.name} saloni yangilandi`);
            } else {
                console.log(`  ⏭️ ${salon.name} salonida o'zgarish kerak emas`);
            }
        }
        
        console.log(`\n🎉 Jami ${updatedCount} ta salon yangilandi`);
        console.log('Heroku production ma\'lumotlar bazasi muvaffaqiyatli yangilandi!');
        
    } catch (error) {
        console.error('❌ Xatolik:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

updateHerokuComfort();