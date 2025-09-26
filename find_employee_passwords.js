const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Production database connection
const pool = new Pool({
    connectionString: 'postgres://uab908oh973b26:p56ddf6329de8d93abf0e7a3eefe45d1879ec32502036a51c391715d124b133f3@cduf3or326qj7m.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d4gg4be05g458l',
    ssl: { rejectUnauthorized: false }
});

async function findEmployeePasswords() {
    try {
        console.log('🔍 Employee parollarini qidiryapman...\n');

        // Barcha employeelarni olish
        const employeesResult = await pool.query(`
            SELECT id, employee_name, email, employee_phone, employee_password, salon_id, position, is_active
            FROM employees 
            ORDER BY id
        `);

        const employees = employeesResult.rows;
        console.log(`📊 Jami ${employees.length} ta employee topildi\n`);

        // Mumkin bo'lgan parollar ro'yxati
        const possiblePasswords = [
            'employee123',
            'password123',
            '123456',
            'admin123',
            'salon123',
            'freya123',
            'test123',
            'employee',
            'password'
        ];

        console.log('🔐 Har bir employee uchun parolni tekshiryapman:\n');

        for (let i = 0; i < employees.length; i++) {
            const employee = employees[i];
            console.log(`${i + 1}. Employee: ${employee.employee_name}`);
            console.log(`   Email: ${employee.email}`);
            console.log(`   Phone: ${employee.employee_phone}`);
            console.log(`   Position: ${employee.position}`);
            console.log(`   Salon ID: ${employee.salon_id}`);
            console.log(`   Active: ${employee.is_active}`);
            
            let foundPassword = null;
            
            // Har bir mumkin bo'lgan parolni tekshirish
            for (const testPassword of possiblePasswords) {
                try {
                    const isMatch = await bcrypt.compare(testPassword, employee.employee_password);
                    if (isMatch) {
                        foundPassword = testPassword;
                        break;
                    }
                } catch (error) {
                    console.log(`   ⚠️  Parol tekshirishda xato: ${error.message}`);
                }
            }
            
            if (foundPassword) {
                console.log(`   ✅ PAROL TOPILDI: "${foundPassword}"`);
            } else {
                console.log(`   ❌ Parol topilmadi (hash: ${employee.employee_password.substring(0, 20)}...)`);
            }
            
            console.log('');
        }

        // Xulosa
        console.log('\n📋 XULOSA:');
        console.log('Employee login ma\'lumotlari:');
        console.log('- Username: employee_name yoki email');
        console.log('- API endpoint: POST /api/auth/employee/login');
        console.log('- Parol: Yuqorida ko\'rsatilgan');

    } catch (error) {
        console.error('❌ Xato:', error.message);
    } finally {
        await pool.end();
    }
}

findEmployeePasswords();