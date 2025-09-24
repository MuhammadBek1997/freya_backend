const { Client } = require('pg');

// Heroku PostgreSQL connection
const client = new Client({
    connectionString: 'postgres://u82hhsnrq03vdb:p894645a6da7b84f388ce131c8306b8bf2c5c3a5c7b32d2e5cd60987b1c644d1f@c3mvmsjsgbq96j.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com:5432/d7cho3buhj3j6g',
    ssl: {
        rejectUnauthorized: false
    }
});

async function testHerokuData() {
    try {
        await client.connect();
        console.log('✅ Heroku PostgreSQL ga ulanish muvaffaqiyatli\n');

        // Salonlar ro'yxatini olish
        console.log('🏢 SALONLAR RO\'YXATI:');
        const salonsResult = await client.query(`
            SELECT id, salon_name, is_private, salon_types, location, 
                   description_uz, description_ru, description_en,
                   address_uz, address_ru, address_en
            FROM salons 
            ORDER BY salon_name;
        `);

        if (salonsResult.rows.length === 0) {
            console.log('   ❌ Hech qanday salon topilmadi!');
        } else {
            salonsResult.rows.forEach((salon, index) => {
                console.log(`\n   ${index + 1}. ${salon.salon_name}`);
                console.log(`      ID: ${salon.id}`);
                console.log(`      Private: ${salon.is_private}`);
                console.log(`      Types: ${salon.salon_types ? JSON.stringify(salon.salon_types) : 'null'}`);
                console.log(`      Location: ${salon.location ? JSON.stringify(salon.location) : 'null'}`);
                console.log(`      Description UZ: ${salon.description_uz || 'null'}`);
                console.log(`      Address UZ: ${salon.address_uz || 'null'}`);
            });
        }

        // Adminlar ro'yxati
        console.log('\n\n👥 ADMINLAR RO\'YXATI:');
        const adminsResult = await client.query(`
            SELECT a.id, a.username, a.full_name, s.salon_name
            FROM admins a
            LEFT JOIN salons s ON a.salon_id = s.id
            ORDER BY a.username;
        `);

        if (adminsResult.rows.length === 0) {
            console.log('   ❌ Hech qanday admin topilmadi!');
        } else {
            adminsResult.rows.forEach((admin, index) => {
                console.log(`   ${index + 1}. ${admin.username} (${admin.full_name}) - ${admin.salon_name}`);
            });
        }

        // Employeelar ro'yxati
        console.log('\n\n👨‍💼 EMPLOYEELAR RO\'YXATI:');
        const employeesResult = await client.query(`
            SELECT e.id, e.employee_name, e.is_waiting, s.salon_name
            FROM employees e
            LEFT JOIN salons s ON e.salon_id = s.id
            ORDER BY s.salon_name, e.employee_name;
        `);

        if (employeesResult.rows.length === 0) {
            console.log('   ❌ Hech qanday employee topilmadi!');
        } else {
            let currentSalon = '';
            employeesResult.rows.forEach((emp) => {
                if (emp.salon_name !== currentSalon) {
                    currentSalon = emp.salon_name;
                    console.log(`\n   🏢 ${currentSalon}:`);
                }
                const waitingIcon = emp.is_waiting ? '⏳' : '✅';
                console.log(`      ${waitingIcon} ${emp.employee_name} (Waiting: ${emp.is_waiting})`);
            });
        }

        console.log('\n📊 UMUMIY STATISTIKA:');
        console.log(`   - Salonlar: ${salonsResult.rows.length}`);
        console.log(`   - Adminlar: ${adminsResult.rows.length}`);
        console.log(`   - Employeelar: ${employeesResult.rows.length}`);
        
        const privateSalons = salonsResult.rows.filter(s => s.is_private === true);
        const publicSalons = salonsResult.rows.filter(s => s.is_private === false);
        console.log(`   - Private salonlar: ${privateSalons.length}`);
        console.log(`   - Public salonlar: ${publicSalons.length}`);
        
    } catch (error) {
        console.error('❌ Xatolik:', error.message);
        console.error(error.stack);
    } finally {
        await client.end();
        process.exit(0);
    }
}

testHerokuData();