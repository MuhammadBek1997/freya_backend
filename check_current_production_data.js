const { Pool } = require('pg');

// Production database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkCurrentData() {
    try {
        console.log('🔍 Checking current production data...\n');
        
        // Check salons
        const salonsResult = await pool.query(`
            SELECT id, name, is_private, is_active, created_at 
            FROM salons 
            ORDER BY created_at
        `);
        
        console.log('📍 SALONS:');
        console.log(`Total salons: ${salonsResult.rows.length}`);
        salonsResult.rows.forEach((salon, index) => {
            console.log(`${index + 1}. ${salon.name} - Private: ${salon.is_private} - Active: ${salon.is_active}`);
        });
        
        // Count by type
        const privateCount = salonsResult.rows.filter(s => s.is_private).length;
        const corporateCount = salonsResult.rows.filter(s => !s.is_private).length;
        console.log(`\n📊 Private salons: ${privateCount}, Corporate salons: ${corporateCount}\n`);
        
        // Check employees for each salon
        console.log('👥 EMPLOYEES BY SALON:');
        for (const salon of salonsResult.rows) {
            const employeesResult = await pool.query(`
                SELECT id, name, phone, email, position 
                FROM employees 
                WHERE salon_id = $1
            `, [salon.id]);
            
            console.log(`${salon.name}: ${employeesResult.rows.length} employees`);
            employeesResult.rows.forEach((emp, index) => {
                console.log(`  ${index + 1}. ${emp.name} - ${emp.position} - ${emp.phone}`);
            });
        }
        
        // Check schedules for each employee
        console.log('\n📅 SCHEDULES BY EMPLOYEE:');
        for (const salon of salonsResult.rows) {
            const employeesResult = await pool.query(`
                SELECT id, name FROM employees WHERE salon_id = $1
            `, [salon.id]);
            
            console.log(`\n${salon.name}:`);
            for (const employee of employeesResult.rows) {
                const schedulesResult = await pool.query(`
                    SELECT id, service_name, duration, price 
                    FROM schedules 
                    WHERE employee_id = $1
                `, [employee.id]);
                
                console.log(`  ${employee.name}: ${schedulesResult.rows.length} schedules`);
                schedulesResult.rows.forEach((schedule, index) => {
                    console.log(`    ${index + 1}. ${schedule.service_name} - ${schedule.duration}min - ${schedule.price} so'm`);
                });
            }
        }
        
        // Check users
        const usersResult = await pool.query(`
            SELECT id, phone, full_name, created_at 
            FROM users 
            ORDER BY created_at
        `);
        
        console.log(`\n👤 USERS:`);
        console.log(`Total users: ${usersResult.rows.length}`);
        usersResult.rows.forEach((user, index) => {
            console.log(`${index + 1}. ${user.full_name || 'No name'} - ${user.phone}`);
        });
        
        // Check admins
        const adminsResult = await pool.query(`
            SELECT id, username, full_name, role, salon_id 
            FROM admins 
            WHERE is_active = true
            ORDER BY created_at
        `);
        
        console.log(`\n🔑 ADMINS:`);
        console.log(`Total admins: ${adminsResult.rows.length}`);
        adminsResult.rows.forEach((admin, index) => {
            const salonName = salonsResult.rows.find(s => s.id === admin.salon_id)?.name || 'No salon';
            console.log(`${index + 1}. ${admin.username} (${admin.full_name}) - ${admin.role} - Salon: ${salonName}`);
        });
        
        // Summary
        console.log('\n📋 SUMMARY:');
        console.log(`✅ Salons: ${salonsResult.rows.length} (${privateCount} private, ${corporateCount} corporate)`);
        console.log(`✅ Users: ${usersResult.rows.length}`);
        console.log(`✅ Admins: ${adminsResult.rows.length}`);
        
        const totalEmployees = await pool.query('SELECT COUNT(*) as count FROM employees');
        const totalSchedules = await pool.query('SELECT COUNT(*) as count FROM schedules');
        console.log(`✅ Total employees: ${totalEmployees.rows[0].count}`);
        console.log(`✅ Total schedules: ${totalSchedules.rows[0].count}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
        console.log('\n🔚 Database connection closed');
    }
}

checkCurrentData();