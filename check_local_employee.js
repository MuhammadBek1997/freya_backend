const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Local database connection
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'freya_salon',
    password: 'admin',
    port: 5432,
});

async function checkLocalEmployee() {
    try {
        console.log('🔍 Local database\'da employee1_1 tekshirish...');
        
        // Employee1_1 ni topish
        const result = await pool.query(
            'SELECT id, username, password, role, salon_id FROM admins WHERE username = $1',
            ['employee1_1']
        );

        if (result.rows.length === 0) {
            console.log('❌ Employee1_1 topilmadi');
            return;
        }

        const employee = result.rows[0];
        console.log('✅ Employee1_1 topildi:');
        console.log('ID:', employee.id);
        console.log('Username:', employee.username);
        console.log('Role:', employee.role);
        console.log('Salon ID:', employee.salon_id);

        // Turli parollarni test qilish
        const testPasswords = [
            'password123',
            'employee123',
            'admin123',
            '123456',
            'freya123',
            'employee1_1'
        ];

        console.log('\n🔐 Parollarni test qilish...');
        let correctPassword = null;
        
        for (const testPassword of testPasswords) {
            try {
                const isMatch = await bcrypt.compare(testPassword, employee.password);
                if (isMatch) {
                    console.log(`✅ To'g'ri parol topildi: "${testPassword}"`);
                    correctPassword = testPassword;
                    break;
                } else {
                    console.log(`❌ Noto'g'ri parol: "${testPassword}"`);
                }
            } catch (error) {
                console.log(`❌ Parol tekshirishda xatolik: "${testPassword}" - ${error.message}`);
            }
        }

        if (!correctPassword) {
            console.log('\n❌ Hech qanday test parol mos kelmadi');
        }

        return correctPassword;

    } catch (error) {
        console.error('❌ Database xatoligi:', error.message);
    } finally {
        await pool.end();
    }
}

checkLocalEmployee();