require('dotenv').config();
const { pool } = require('./config/database');
const scheduleTranslationService = require('./services/scheduleTranslationService');

async function translateSchedules() {
    try {
        console.log('🔄 SCHEDULE TARJIMALARINI YANGILASH...\n');

        // Barcha schedule'larni olish
        const schedulesQuery = `
            SELECT id, name, title
            FROM schedules 
            WHERE is_active = true
        `;
        
        const schedulesResult = await pool.query(schedulesQuery);
        const schedules = schedulesResult.rows;
        
        console.log(`📋 Jami ${schedules.length} ta schedule topildi\n`);

        let uzCount = 0, enCount = 0, ruCount = 0;

        for (const schedule of schedules) {
            console.log(`🔄 Schedule tarjima qilinmoqda: ${schedule.name}`);
            
            try {
                // Schedule'ni tarjima qilish va saqlash
                await scheduleTranslationService.translateAndStoreSchedule(schedule.id, {
                    name: schedule.name,
                    title: schedule.title,
                    description: null
                });
                
                uzCount++;
                enCount++;
                ruCount++;
                
                console.log(`✅ Schedule tarjima qilindi: ${schedule.name}`);
            } catch (error) {
                console.error(`❌ Schedule tarjima qilishda xatolik: ${schedule.name}`, error.message);
            }
        }

        console.log('\n📊 YAKUNIY NATIJALAR:');
        console.log(`📋 Schedule tarjimlari:`);
        console.log(`   UZ: ${uzCount}/${schedules.length}`);
        console.log(`   EN: ${enCount}/${schedules.length}`);
        console.log(`   RU: ${ruCount}/${schedules.length}`);

        console.log('\n✅ BARCHA SCHEDULE TARJIMLARI YAKUNLANDI!');
        
    } catch (error) {
        console.error('❌ Umumiy xatolik:', error);
    } finally {
        process.exit(0);
    }
}

translateSchedules();