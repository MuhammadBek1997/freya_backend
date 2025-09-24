const { Client } = require('pg');

// Heroku PostgreSQL connection
const client = new Client({
    connectionString: 'postgres://u82hhsnrq03vdb:p894645a6da7b84f388ce131c8306b8bf2c5c3a5c7b32d2e5cd60987b1c644d1f@c3mvmsjsgbq96j.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com:5432/d7cho3buhj3j6g',
    ssl: {
        rejectUnauthorized: false
    }
});

async function clearHerokuDatabase() {
    try {
        await client.connect();
        console.log('✅ Heroku PostgreSQL ga ulanish muvaffaqiyatli');

        // Foreign key constraint larni o'chirish uchun ketma-ketlik
        const tables = [
            'employee_translations',
            'salon_translations', 
            'schedules',
            'employees',
            'admins',
            'salons'
        ];

        for (const table of tables) {
            try {
                // Jadval mavjudligini tekshirish
                const checkResult = await client.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = $1
                    );
                `, [table]);

                if (checkResult.rows[0].exists) {
                    await client.query(`DELETE FROM ${table}`);
                    console.log(`✅ ${table} jadvali tozalandi`);
                } else {
                    console.log(`⚠️ ${table} jadvali mavjud emas`);
                }
            } catch (error) {
                console.log(`⚠️ ${table} jadvalini tozalashda xatolik:`, error.message);
            }
        }

        console.log('🎉 Heroku ma\'lumotlar bazasi muvaffaqiyatli tozalandi!');
        
    } catch (error) {
        console.error('❌ Xatolik:', error.message);
    } finally {
        await client.end();
        process.exit(0);
    }
}

clearHerokuDatabase();