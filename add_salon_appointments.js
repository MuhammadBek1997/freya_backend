// Set production environment
process.env.NODE_ENV = 'production';
const { pool } = require('./config/database');

async function addAppointmentsForAllSalons() {
    try {
        console.log('Starting to add 2 appointments for each salon...');

        // Get all salons (check if salon_name_uz exists, fallback to salon_name)
        let salonsQuery = 'SELECT id, salon_name_uz FROM salons ORDER BY salon_name_uz';
        try {
            var salonsResult = await pool.query(salonsQuery);
        } catch (error) {
            if (error.message.includes('salon_name_uz')) {
                console.log('Using salon_name instead of salon_name_uz');
                salonsQuery = 'SELECT id, salon_name FROM salons ORDER BY salon_name';
                salonsResult = await pool.query(salonsQuery);
            } else {
                throw error;
            }
        }
        console.log(`Found ${salonsResult.rows.length} salons`);

        // Get users for appointments
        const usersResult = await pool.query('SELECT id, username, phone FROM users LIMIT 10');
        console.log(`Found ${usersResult.rows.length} users`);

        // Get services
        const servicesResult = await pool.query('SELECT id, name, price FROM services WHERE is_active = true LIMIT 5');
        console.log(`Found ${servicesResult.rows.length} services`);

        if (usersResult.rows.length === 0) {
            console.log('No users found. Creating sample users...');
            // Create sample users if none exist
            for (let i = 1; i <= 6; i++) {
                await pool.query(`
                    INSERT INTO users (username, phone, email, is_verified, is_active)
                    VALUES ($1, $2, $3, true, true)
                    ON CONFLICT (phone) DO NOTHING
                `, [`user${i}`, `+99890123456${i}`, `user${i}@example.com`]);
            }
            
            // Get users again
            const newUsersResult = await pool.query('SELECT id, username, phone FROM users LIMIT 10');
            usersResult.rows = newUsersResult.rows;
            console.log(`Created and found ${usersResult.rows.length} users`);
        }

        let appointmentCounter = 1;
        let userIndex = 0;

        // Process each salon
        for (const salon of salonsResult.rows) {
            const salonName = salon.salon_name_uz || salon.salon_name || 'Unknown Salon';
            console.log(`\nProcessing salon: ${salonName} (${salon.id})`);

            // Get employees for this salon
            const employeesResult = await pool.query(
                'SELECT id, employee_name FROM employees WHERE salon_id = $1 AND is_active = true LIMIT 3',
                [salon.id]
            );

            // Get schedules for this salon
            const schedulesResult = await pool.query(
                'SELECT id, name, date FROM schedules WHERE salon_id = $1 AND is_active = true LIMIT 3',
                [salon.id]
            );

            console.log(`  Found ${employeesResult.rows.length} employees, ${schedulesResult.rows.length} schedules`);

            // If no employees or schedules, create basic ones
            if (employeesResult.rows.length === 0) {
                console.log('  Creating sample employee...');
                const employeeResult = await pool.query(`
                    INSERT INTO employees (employee_name, salon_id, employee_phone, is_active)
                    VALUES ($1, $2, $3, true)
                    RETURNING id, employee_name
                `, [`Employee ${salonName}`, salon.id, `+99890000${appointmentCounter}`]);
                employeesResult.rows.push(employeeResult.rows[0]);
            }

            if (schedulesResult.rows.length === 0) {
                console.log('  Creating sample schedule...');
                const scheduleResult = await pool.query(`
                    INSERT INTO schedules (salon_id, date, name, is_active)
                    VALUES ($1, $2, $3, true)
                    RETURNING id, name, date
                `, [salon.id, '2024-12-30', `Schedule ${salonName}`]);
                schedulesResult.rows.push(scheduleResult.rows[0]);
            }

            // Create 2 appointments for this salon
            for (let i = 0; i < 2; i++) {
                const user = usersResult.rows[userIndex % usersResult.rows.length];
                const employee = employeesResult.rows[i % employeesResult.rows.length];
                const schedule = schedulesResult.rows[i % schedulesResult.rows.length];
                const service = servicesResult.rows[i % servicesResult.rows.length];

                const applicationNumber = `APP${String(appointmentCounter).padStart(3, '0')}`;
                const appointmentDate = i === 0 ? '2024-12-30' : '2024-12-31';
                const appointmentTime = i === 0 ? '10:00:00' : '14:00:00';

                try {
                    const appointmentResult = await pool.query(`
                        INSERT INTO appointments (
                            application_number,
                            user_id,
                            user_name,
                            phone_number,
                            application_date,
                            application_time,
                            schedule_id,
                            employee_id,
                            service_name,
                            service_price,
                            status,
                            notes
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                        RETURNING id, application_number
                    `, [
                        applicationNumber,
                        user.id,
                        user.username || 'Test User',
                        user.phone,
                        appointmentDate,
                        appointmentTime,
                        schedule.id,
                        employee.id,
                        service ? service.name : 'Soch kesish',
                        service ? service.price : '50000.00',
                        'pending',
                        `Test appointment ${i + 1} for ${salon.salon_name_uz}`
                    ]);

                    console.log(`  ✓ Created appointment ${appointmentResult.rows[0].application_number} for ${user.phone}`);
                    appointmentCounter++;
                    userIndex++;
                } catch (error) {
                    console.error(`  ✗ Error creating appointment ${i + 1}:`, error.message);
                }
            }
        }

        console.log('\n✅ Finished adding appointments for all salons!');

        // Show summary
        const totalAppointments = await pool.query('SELECT COUNT(*) as count FROM appointments');
        console.log(`Total appointments in database: ${totalAppointments.rows[0].count}`);

    } catch (error) {
        console.error('Error adding appointments:', error);
    } finally {
        await pool.end();
    }
}

// Run the script
addAppointmentsForAllSalons();