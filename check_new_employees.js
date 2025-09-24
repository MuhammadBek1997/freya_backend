const { pool } = require('./config/database');

async function checkNewEmployees() {
    try {
        console.log('🔍 Yangi employee ma\'lumotlarini tekshirish...\n');
        
        // Yangi employee ma'lumotlarini ko'rish
        const employeesQuery = 'SELECT * FROM employees WHERE email IS NOT NULL ORDER BY created_at DESC LIMIT 10';
        const employeesResult = await pool.query(employeesQuery);
        
        console.log('👥 Yangi Employee ma\'lumotlari:');
        employeesResult.rows.forEach(employee => {
            console.log(`   ID: ${employee.id}`);
            console.log(`   Name: ${employee.name || employee.employee_name}`);
            console.log(`   Email: ${employee.email}`);
            console.log(`   Phone: ${employee.phone}`);
            console.log(`   Position: ${employee.position}`);
            console.log(`   Employee Password: ${employee.employee_password ? 'MAVJUD' : 'YO\'Q'}`);
            console.log(`   Created: ${employee.created_at}`);
            console.log('   ---');
        });
        
    } catch (error) {
        console.error('Xatolik:', error);
    } finally {
        await pool.end();
    }
}

checkNewEmployees();