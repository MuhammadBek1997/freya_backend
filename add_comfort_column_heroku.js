require('dotenv').config({ path: '.env.production' });
const { Pool } = require('pg');

// Production ma'lumotlar bazasiga ulanish
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function addComfortColumn() {
    try {
        console.log('Heroku production ma\'lumotlar bazasiga ulanmoqda...');
        
        // salon_comfort ustunini qo'shish
        console.log('salon_comfort ustunini qo\'shmoqda...');
        await pool.query(`
            ALTER TABLE salons 
            ADD COLUMN IF NOT EXISTS salon_comfort JSONB DEFAULT '[]'
        `);
        console.log('✅ salon_comfort ustuni qo\'shildi');
        
        // Barcha salonlarga default comfort ma'lumotlarini qo'shish
        console.log('\nBarcha salonlarga default comfort ma\'lumotlarini qo\'shmoqda...');
        
        const defaultComfort = [
            { name: 'wifi', isActive: true },
            { name: 'parking', isActive: true },
            { name: 'kids', isActive: true },
            { name: 'music', isActive: true },
            { name: 'coffee', isActive: true }
        ];
        
        const updateResult = await pool.query(`
            UPDATE salons 
            SET salon_comfort = $1 
            WHERE salon_comfort IS NULL OR salon_comfort = '[]'
        `, [JSON.stringify(defaultComfort)]);
        
        console.log(`✅ ${updateResult.rowCount} ta salon yangilandi`);
        
        // Natijani tekshirish
        const checkResult = await pool.query('SELECT id, name, salon_comfort FROM salons LIMIT 3');
        console.log('\nYangilangan salonlar:');
        checkResult.rows.forEach(salon => {
            console.log(`- ${salon.name}: ${salon.salon_comfort.map(c => c.name).join(', ')}`);
        });
        
        console.log('\n🎉 Production ma\'lumotlar bazasi muvaffaqiyatli yangilandi!');
        
    } catch (error) {
        console.error('❌ Xatolik:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

addComfortColumn();