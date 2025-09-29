const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Heroku production database connection
const pool = new Pool({
    connectionString: 'postgres://uefhovlhferv7t:pf59bcec9eba0168cce78a7f8728a7a6cf66489256b0dc9829bc4a1e5b46f68d7@c3v5n5ajfopshl.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/dchto8v0bjnhh7',
    ssl: {
        rejectUnauthorized: false
    }
});

async function createTestEmployee() {
    try {
        console.log('🔍 Creating test employee with login credentials...\n');

        // First, get a salon to assign the employee to
        const salonsResult = await pool.query('SELECT id, name FROM salons LIMIT 1');
        
        if (salonsResult.rows.length === 0) {
            console.log('❌ No salons found! Cannot create employee without salon.');
            return;
        }

        const salon = salonsResult.rows[0];
        console.log(`📍 Using salon: ${salon.name} (ID: ${salon.id})`);

        // Create test employee credentials
        const testEmployee = {
            username: 'test_employee',
            password: 'test123',
            full_name: 'Test Employee',
            email: 'test.employee@freya.uz',
            salon_id: salon.id
        };

        // Hash the password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(testEmployee.password, saltRounds);

        // Check if employee with this username already exists
        const existingEmployee = await pool.query(
            'SELECT id FROM employees WHERE username = $1',
            [testEmployee.username]
        );

        if (existingEmployee.rows.length > 0) {
            console.log('⚠️ Employee with username "test_employee" already exists!');
            
            // Update existing employee
            await pool.query(`
                UPDATE employees 
                SET password_hash = $1, full_name = $2, email = $3, salon_id = $4, is_active = true
                WHERE username = $5
            `, [password_hash, testEmployee.full_name, testEmployee.email, testEmployee.salon_id, testEmployee.username]);
            
            console.log('✅ Updated existing test employee with new credentials');
        } else {
            // Create new employee - using existing table structure
            const result = await pool.query(`
                INSERT INTO employees (employee_name, username, password_hash, full_name, email, salon_id, is_active)
                VALUES ($1, $2, $3, $4, $5, $6, true)
                RETURNING id
            `, [testEmployee.full_name, testEmployee.username, password_hash, testEmployee.full_name, testEmployee.email, testEmployee.salon_id]);

            console.log('✅ Created new test employee with ID:', result.rows[0].id);
        }

        console.log('\n🔐 TEST EMPLOYEE LOGIN CREDENTIALS:');
        console.log(`   Username: ${testEmployee.username}`);
        console.log(`   Password: ${testEmployee.password}`);
        console.log(`   Full Name: ${testEmployee.full_name}`);
        console.log(`   Email: ${testEmployee.email}`);
        console.log(`   Salon: ${salon.name}`);

        // Verify the employee was created/updated
        const verifyResult = await pool.query(`
            SELECT e.*, s.name as salon_name
            FROM employees e
            LEFT JOIN salons s ON e.salon_id = s.id
            WHERE e.username = $1
        `, [testEmployee.username]);

        if (verifyResult.rows.length > 0) {
            const emp = verifyResult.rows[0];
            console.log('\n✅ VERIFICATION - Employee found in database:');
            console.log(`   ID: ${emp.id}`);
            console.log(`   Username: ${emp.username}`);
            console.log(`   Full Name: ${emp.full_name}`);
            console.log(`   Email: ${emp.email}`);
            console.log(`   Salon: ${emp.salon_name}`);
            console.log(`   Status: ${emp.is_active ? 'Active' : 'Inactive'}`);
            console.log(`   Password Hash: ${emp.password_hash ? 'Set' : 'Not set'}`);
        }

        console.log('\n📱 You can now use these credentials to login to the employee panel!');

    } catch (error) {
        console.error('❌ Error creating test employee:', error.message);
    } finally {
        await pool.end();
    }
}

createTestEmployee();