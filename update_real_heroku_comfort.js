const { Pool } = require('pg');

// Haqiqiy Heroku ma'lumotlar bazasiga ulanish
const pool = new Pool({
    connectionString: 'postgres://uefhovlhferv7t:pf59bcec9eba0168cce78a7f8728a7a6cf66489256b0dc9829bc4a1e5b46f68d7@c3v5n5ajfopshl.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/dchto8v0bjnhh7',
    ssl: {
        rejectUnauthorized: false
    }
});

async function updateRealHerokuComfort() {
    try {
        console.log('Haqiqiy Heroku production ma\'lumotlar bazasiga ulanmoqda...');
        
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
        console.log('Haqiqiy Heroku production ma\'lumotlar bazasi muvaffaqiyatli yangilandi!');
        
        // Natijani tekshirish
        const checkResult = await pool.query('SELECT id, name, salon_comfort FROM salons LIMIT 3');
        console.log('\nYangilangan salonlar:');
        checkResult.rows.forEach(salon => {
            console.log(`- ${salon.name}: ${salon.salon_comfort.map(c => c.name).join(', ')}`);
        });
        
    } catch (error) {
        console.error('❌ Xatolik:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

updateRealHerokuComfort();