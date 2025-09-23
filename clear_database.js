const pool = require('./config/database');

async function clearDatabase() {
    try {
        console.log('🗑️ Databaseni tozalash boshlandi...');
        
        // Barcha ma'lumotlarni o'chirish (foreign key constraint'lar tufayli tartib muhim)
        
        // Avval mavjud jadvallarni tekshiramiz va faqat mavjud bo'lganlarini o'chiramiz
        const tables = [
            { name: 'schedule_translations', description: 'Schedule translations' },
            { name: 'employee_translations', description: 'Employee translations' },
            { name: 'salon_translations', description: 'Salon translations' },
            { name: 'schedules', description: 'Schedules' },
            { name: 'employees', description: 'Employees' },
            { name: 'salons', description: 'Salons' }
        ];
        
        for (const table of tables) {
            try {
                // Jadval mavjudligini tekshirish
                const checkQuery = `
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = $1
                    );
                `;
                const exists = await pool.query(checkQuery, [table.name]);
                
                if (exists.rows[0].exists) {
                    await pool.query(`DELETE FROM ${table.name}`);
                    console.log(`✅ ${table.description} o'chirildi`);
                } else {
                    console.log(`⚠️ ${table.description} jadvali mavjud emas`);
                }
            } catch (error) {
                console.log(`⚠️ ${table.description} o'chirishda xatolik: ${error.message}`);
            }
        }
        
        console.log('🎉 Database muvaffaqiyatli tozalandi!');
        
    } catch (error) {
        console.error('❌ Database tozalashda xatolik:', error);
    } finally {
        process.exit(0);
    }
}

clearDatabase();