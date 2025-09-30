const { Pool } = require('pg');
require('dotenv').config();

// Production database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://freya_user:freya_password@localhost:5432/freya_db',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkAndFixEmployee() {
    try {
        console.log('🔍 Production database\'da employee1_1 user\'ini tekshirish...');
        
        // Employee1_1 ni admins table'ida topish
        const result = await pool.query(
            'SELECT id, username, email, full_name, role, salon_id, is_active FROM admins WHERE username = $1',
            ['employee1_1']
        );

        if (result.rows.length === 0) {
            console.log('❌ employee1_1 user topilmadi');
            return;
        }

        const user = result.rows[0];
        console.log('📋 Hozirgi user ma\'lumotlari:');
        console.log('ID:', user.id);
        console.log('Username:', user.username);
        console.log('Email:', user.email);
        console.log('Full Name:', user.full_name);
        console.log('Role:', user.role);
        console.log('Salon ID:', user.salon_id);
        console.log('Is Active:', user.is_active);

        // Agar role employee bo'lmasa, uni tuzatish
        if (user.role !== 'employee') {
            console.log('🔧 Role\'ni employee\'ga o\'zgartirish...');
            
            const updateResult = await pool.query(
                'UPDATE admins SET role = $1 WHERE username = $2 RETURNING *',
                ['employee', 'employee1_1']
            );

            if (updateResult.rows.length > 0) {
                console.log('✅ Role muvaffaqiyatli o\'zgartirildi!');
                console.log('📋 Yangi ma\'lumotlar:');
                const updatedUser = updateResult.rows[0];
                console.log('Role:', updatedUser.role);
            } else {
                console.log('❌ Role o\'zgartirishda xatolik');
            }
        } else {
            console.log('✅ Role allaqachon employee');
        }

        // Test login qilish
        console.log('🧪 Employee login test...');
        const loginTest = await pool.query(
            'SELECT id, username, email, password_hash, full_name, role, salon_id FROM admins WHERE username = $1 AND role = $2 AND is_active = true',
            ['employee1_1', 'employee']
        );

        if (loginTest.rows.length > 0) {
            console.log('✅ Employee login test muvaffaqiyatli!');
            console.log('User role:', loginTest.rows[0].role);
        } else {
            console.log('❌ Employee login test muvaffaqiyatsiz');
        }

    } catch (error) {
        console.error('❌ Xatolik:', error.message);
    } finally {
        await pool.end();
    }
}

checkAndFixEmployee();