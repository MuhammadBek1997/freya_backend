const { pool } = require('./config/database');

async function createSampleAppointments() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Sample appointments yaratish...');
        
        // Begin transaction
        await client.query('BEGIN');
        
        // First, check if we have users, salons, schedules, and employees
        const usersCheck = await client.query('SELECT COUNT(*) as count FROM users');
        const salonsCheck = await client.query('SELECT COUNT(*) as count FROM salons');
        const schedulesCheck = await client.query('SELECT COUNT(*) as count FROM schedules');
        const employeesCheck = await client.query('SELECT COUNT(*) as count FROM employees');
        
        console.log(`📊 Mavjud ma'lumotlar:`);
        console.log(`   Users: ${usersCheck.rows[0].count}`);
        console.log(`   Salons: ${salonsCheck.rows[0].count}`);
        console.log(`   Schedules: ${schedulesCheck.rows[0].count}`);
        console.log(`   Employees: ${employeesCheck.rows[0].count}`);
        
        // Get some sample data
        const users = await client.query('SELECT id, phone FROM users LIMIT 3');
        const salons = await client.query('SELECT id, salon_name FROM salons LIMIT 2');
        const schedules = await client.query('SELECT id FROM schedules LIMIT 3');
        const employees = await client.query('SELECT id, name, salon_id FROM employees LIMIT 3');
        
        if (users.rows.length === 0) {
            console.log('⚠️ Users jadvali bo\'sh. Avval users yarating.');
            return;
        }
        
        if (schedules.rows.length === 0) {
            console.log('⚠️ Schedules jadvali bo\'sh. Avval schedules yarating.');
            return;
        }
        
        // Clear existing appointments
        await client.query('DELETE FROM appointments');
        console.log('🗑️ Mavjud appointmentlar o\'chirildi');
        
        // Create sample appointments
        const sampleAppointments = [
            {
                application_number: 'APP001',
                user_id: users.rows[0].id,
                user_name: 'Akmal Karimov',
                phone_number: users.rows[0].phone || '+998901234567',
                application_date: '2024-01-25',
                application_time: '10:00',
                schedule_id: schedules.rows[0].id,
                employee_id: employees.rows[0]?.id || null,
                service_name: 'Soch kesish',
                service_price: 50000,
                status: 'pending',
                notes: 'Qisqa soch kesish'
            },
            {
                application_number: 'APP002',
                user_id: users.rows[1]?.id || users.rows[0].id,
                user_name: 'Dilnoza Abdullayeva',
                phone_number: users.rows[1]?.phone || '+998901234568',
                application_date: '2024-01-25',
                application_time: '14:00',
                schedule_id: schedules.rows[1]?.id || schedules.rows[0].id,
                employee_id: employees.rows[1]?.id || employees.rows[0]?.id,
                service_name: 'Manikür',
                service_price: 80000,
                status: 'accepted',
                notes: 'Gel lak bilan'
            },
            {
                application_number: 'APP003',
                user_id: users.rows[2]?.id || users.rows[0].id,
                user_name: 'Sardor Toshmatov',
                phone_number: users.rows[2]?.phone || '+998901234569',
                application_date: '2024-01-26',
                application_time: '11:30',
                schedule_id: schedules.rows[2]?.id || schedules.rows[0].id,
                employee_id: employees.rows[2]?.id || employees.rows[0]?.id,
                service_name: 'Soqol olish',
                service_price: 30000,
                status: 'done',
                notes: 'Klassik uslub'
            },
            {
                application_number: 'APP004',
                user_id: users.rows[0].id,
                user_name: 'Malika Rahimova',
                phone_number: '+998901234570',
                application_date: '2024-01-27',
                application_time: '16:00',
                schedule_id: schedules.rows[0].id,
                employee_id: employees.rows[0]?.id || null,
                service_name: 'Soch bo\'yash',
                service_price: 120000,
                status: 'pending',
                notes: 'Blond rangga'
            },
            {
                application_number: 'APP005',
                user_id: users.rows[1]?.id || users.rows[0].id,
                user_name: 'Jasur Normatov',
                phone_number: '+998901234571',
                application_date: '2024-01-28',
                application_time: '09:00',
                schedule_id: schedules.rows[1]?.id || schedules.rows[0].id,
                employee_id: employees.rows[1]?.id || employees.rows[0]?.id,
                service_name: 'Massaj',
                service_price: 100000,
                status: 'cancelled',
                notes: 'Bosh va bo\'yin massaji'
            }
        ];
        
        // Insert appointments
        for (const appointment of sampleAppointments) {
            await client.query(`
                INSERT INTO appointments (
                    application_number, user_id, user_name, phone_number,
                    application_date, application_time, schedule_id, employee_id,
                    service_name, service_price, status, notes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, [
                appointment.application_number,
                appointment.user_id,
                appointment.user_name,
                appointment.phone_number,
                appointment.application_date,
                appointment.application_time,
                appointment.schedule_id,
                appointment.employee_id,
                appointment.service_name,
                appointment.service_price,
                appointment.status,
                appointment.notes
            ]);
        }
        
        console.log(`✅ ${sampleAppointments.length} ta sample appointment yaratildi`);
        
        // Commit transaction
        await client.query('COMMIT');
        console.log('✅ Transaction muvaffaqiyatli yakunlandi');
        
        // Show created appointments
        const result = await client.query('SELECT * FROM appointments ORDER BY created_at');
        console.log('\n📋 Yaratilgan appointmentlar:');
        result.rows.forEach((app, index) => {
            console.log(`${index + 1}. ${app.application_number} - ${app.user_name} - ${app.service_name} - ${app.status}`);
        });
        
    } catch (error) {
        // Rollback on error
        await client.query('ROLLBACK');
        console.error('❌ Xatolik:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the script
createSampleAppointments()
    .then(() => {
        console.log('🎉 Sample appointments muvaffaqiyatli yaratildi!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script xatosi:', error);
        process.exit(1);
    });