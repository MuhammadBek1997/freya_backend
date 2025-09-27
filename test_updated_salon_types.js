const { pool } = require('./config/database');

async function testUpdatedSalonTypes() {
    try {
        console.log('Yangilangan salon turlarini test qilish...\n');
        
        // Barcha salonlarni olish
        const result = await pool.query('SELECT id, name, salon_types FROM salons ORDER BY created_at');
        
        console.log(`Jami salonlar: ${result.rows.length}\n`);
        
        // Har bir salon uchun tekshirish
        let allSalonsHaveNewTypes = true;
        
        result.rows.forEach((salon, index) => {
            console.log(`${index + 1}. ${salon.name}:`);
            
            const typeNames = salon.salon_types.map(t => t.type);
            const hasChildrenType = typeNames.includes('Для детей');
            const hasOutdoorType = typeNames.includes('На природе');
            
            console.log(`   Jami turlar: ${salon.salon_types.length}`);
            console.log(`   "Для детей" mavjud: ${hasChildrenType ? '✓' : '✗'}`);
            console.log(`   "На природе" mavjud: ${hasOutdoorType ? '✓' : '✗'}`);
            
            if (!hasChildrenType || !hasOutdoorType) {
                allSalonsHaveNewTypes = false;
                console.log('   ⚠️  Yangi turlar to\'liq qo\'shilmagan!');
            } else {
                console.log('   ✅ Barcha yangi turlar mavjud');
            }
            
            // Barcha turlarni ko'rsatish
            console.log('   Turlar ro\'yxati:');
            salon.salon_types.forEach(type => {
                console.log(`     - ${type.type} (${type.selected ? 'tanlangan' : 'tanlanmagan'})`);
            });
            console.log('');
        });
        
        // Umumiy natija
        console.log('=== TEST NATIJASI ===');
        if (allSalonsHaveNewTypes) {
            console.log('✅ Barcha salonlarga yangi turlar muvaffaqiyatli qo\'shildi!');
            console.log('✅ "Для детей" va "На природе" turlari barcha salonlarda mavjud');
        } else {
            console.log('❌ Ba\'zi salonlarda yangi turlar to\'liq qo\'shilmagan');
        }
        
        // Statistika
        const totalTypes = result.rows[0]?.salon_types?.length || 0;
        console.log(`\n📊 Statistika:`);
        console.log(`   Har bir salonda turlar soni: ${totalTypes}`);
        console.log(`   Kutilgan turlar soni: 7 (5 eski + 2 yangi)`);
        console.log(`   Status: ${totalTypes === 7 ? '✅ To\'g\'ri' : '❌ Noto\'g\'ri'}`);
        
    } catch (error) {
        console.error('Xatolik:', error);
    } finally {
        await pool.end();
        process.exit();
    }
}

testUpdatedSalonTypes();