const { pool } = require('./config/database');

async function findEmployee1_1() {
    try {
        console.log('🔍 employee1_1 ni barcha table\'larda qidirish...\n');
        
        // Admins table'da qidirish
        console.log('📋 Admins table\'da qidirish:');
        const adminsQuery = `SELECT * FROM admins WHERE username = 'employee1_1' OR email LIKE '%employee1%'`;
        const adminsResult = await pool.query(adminsQuery);
        
        if (adminsResult.rows.length > 0) {
            console.log('✅ Admins table\'da topildi:');
            adminsResult.rows.forEach(admin => {
                console.log(`   ID: ${admin.id}`);
                console.log(`   Username: ${admin.username}`);
                console.log(`   Email: ${admin.email}`);
                console.log(`   Full Name: ${admin.full_name}`);
                console.log(`   Role: ${admin.role}`);
                console.log(`   Salon ID: ${admin.salon_id}`);
                console.log('   ---');
            });
        } else {
            console.log('❌ Admins table\'da topilmadi');
        }
        
        // Employees table'da qidirish
        console.log('\n📋 Employees table\'da qidirish:');
        const employeesQuery = `SELECT * FROM employees WHERE name = 'employee1_1' OR email LIKE '%employee1%'`;
        const employeesResult = await pool.query(employeesQuery);
        
        if (employeesResult.rows.length > 0) {
            console.log('✅ Employees table\'da topildi:');
            employeesResult.rows.forEach(employee => {
                console.log(`   ID: ${employee.id}`);
                console.log(`   Name: ${employee.name}`);
                console.log(`   Email: ${employee.email}`);
                console.log(`   Position: ${employee.position}`);
                console.log(`   Salon ID: ${employee.salon_id}`);
                console.log('   ---');
            });
        } else {
            console.log('❌ Employees table\'da topilmadi');
        }
        
        // Users table'da qidirish (agar mavjud bo'lsa)
        console.log('\n📋 Users table\'da qidirish:');
        try {
            const usersQuery = `SELECT * FROM users WHERE username = 'employee1_1' OR email LIKE '%employee1%'`;
            const usersResult = await pool.query(usersQuery);
            
            if (usersResult.rows.length > 0) {
                console.log('✅ Users table\'da topildi:');
                usersResult.rows.forEach(user => {
                    console.log(`   ID: ${user.id}`);
                    console.log(`   Username: ${user.username}`);
                    console.log(`   Email: ${user.email}`);
                    console.log(`   Role: ${user.role}`);
                    console.log(`   Full Name: ${user.full_name}`);
                    console.log('   ---');
                });
            } else {
                console.log('❌ Users table\'da topilmadi');
            }
        } catch (error) {
            console.log('❌ Users table mavjud emas yoki xatolik:', error.message);
        }
        
        // Barcha table'lar ro'yxatini ko'rish
        console.log('\n📋 Mavjud table\'lar:');
        const tablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `;
        const tablesResult = await pool.query(tablesQuery);
        tablesResult.rows.forEach(table => {
            console.log(`   - ${table.table_name}`);
        });
        
    } catch (error) {
        console.error('Xatolik:', error);
    } finally {
        await pool.end();
    }
}

findEmployee1_1();