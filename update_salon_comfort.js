const { Pool } = require('pg');
const pool = require('./config/database');

async function updateSalonComfort() {
    try {
        console.log('🔄 Salon comfort ma\'lumotlarini yangilash boshlandi...\n');

        // 1. Barcha salonlarni olish
        const salonsResult = await pool.query('SELECT id, salon_name, salon_comfort FROM salons');
        const salons = salonsResult.rows;

        console.log(`📊 Jami ${salons.length} ta salon topildi\n`);

        let updatedCount = 0;

        // 2. Har bir salon uchun salon_comfort ni yangilash
        for (const salon of salons) {
            let salonComfort = salon.salon_comfort;
            let hasChanges = false;

            // JSON string bo'lsa, parse qilish
            if (typeof salonComfort === 'string') {
                try {
                    salonComfort = JSON.parse(salonComfort);
                } catch (e) {
                    console.log(`⚠️  Salon ${salon.salon_name} (ID: ${salon.id}) uchun salon_comfort parse qilib bo'lmadi`);
                    continue;
                }
            }

            // Agar salon_comfort array bo'lsa
            if (Array.isArray(salonComfort)) {
                // allow14 va allow16 ni topish va o'chirish
                const filteredComfort = salonComfort.filter(item => 
                    item.name !== 'allow14' && item.name !== 'allow16'
                );

                // Agar allow14 yoki allow16 mavjud bo'lsa
                if (filteredComfort.length !== salonComfort.length) {
                    hasChanges = true;
                    
                    // kids elementini qo'shish (agar mavjud bo'lmasa)
                    const hasKids = filteredComfort.some(item => item.name === 'kids');
                    if (!hasKids) {
                        filteredComfort.push({ "name": "kids", "isActive": true });
                    }

                    // Ma'lumotlar bazasini yangilash
                    await pool.query(
                        'UPDATE salons SET salon_comfort = $1 WHERE id = $2',
                        [JSON.stringify(filteredComfort), salon.id]
                    );

                    console.log(`✅ Salon "${salon.salon_name}" (ID: ${salon.id}) yangilandi`);
                    updatedCount++;
                } else {
                    console.log(`ℹ️  Salon "${salon.salon_name}" (ID: ${salon.id}) - o'zgarish kerak emas`);
                }
            } else {
                console.log(`⚠️  Salon "${salon.salon_name}" (ID: ${salon.id}) - salon_comfort noto'g'ri formatda`);
            }
        }

        console.log(`\n📈 Xulosa:`);
        console.log(`- Jami tekshirilgan salonlar: ${salons.length}`);
        console.log(`- Yangilangan salonlar: ${updatedCount}`);
        console.log(`- O'zgarish kerak bo'lmagan salonlar: ${salons.length - updatedCount}`);

        console.log('\n✅ Salon comfort ma\'lumotlari muvaffaqiyatli yangilandi!');

    } catch (error) {
        console.error('❌ Xatolik yuz berdi:', error);
    } finally {
        process.exit(0);
    }
}

// Scriptni ishga tushirish
if (require.main === module) {
    updateSalonComfort();
}

module.exports = { updateSalonComfort };