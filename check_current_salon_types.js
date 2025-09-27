const { pool } = require('./config/database');

async function checkCurrentSalonTypes() {
    try {
        console.log('Hozirgi salon_types strukturasini tekshirish...\n');
        
        const result = await pool.query('SELECT id, name, salon_types FROM salons ORDER BY created_at');
        
        console.log(`Jami salonlar: ${result.rows.length}\n`);
        
        result.rows.forEach((salon, index) => {
            console.log(`${index + 1}. Salon: ${salon.name}`);
            console.log(`   ID: ${salon.id}`);
            console.log(`   Salon Types:`, JSON.stringify(salon.salon_types, null, 2));
            console.log('---');
        });
        
    } catch (error) {
        console.error('Xatolik:', error);
    } finally {
        await pool.end();
        process.exit();
    }
}

checkCurrentSalonTypes();