const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Heroku production database connection
const pool = new Pool({
    connectionString: 'postgres://uefhovlhferv7t:pf59bcec9eba0168cce78a7f8728a7a6cf66489256b0dc9829bc4a1e5b46f68d7@c3v5n5ajfopshl.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/dchto8v0bjnhh7',
    ssl: {
        rejectUnauthorized: false
    }
});

async function createEmployee1_1() {
    try {
        console.log('🔍 Creating employee1_1 user...\n');

        // Get admin1's salon_id
        const adminResult = await pool.query('SELECT salon_id FROM admins WHERE username = $1', ['admin1']);
        
        if (adminResult.rows.length === 0) {
            console.log('❌ admin1 not found! Cannot get salon_id.');
            return;
        }

        const salon_id = adminResult.rows[0].salon_id;
        console.log(`📍 Using admin1's salon_id: ${salon_id}`);

        // Create employee1_1 credentials
        const employee = {
            username: 'employee1_1',
            password: '123456',
            full_name: 'Employee One One',
            email: 'employee1_1@freya.uz',
            salon_id: salon_id
        };

        // Hash the password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(employee.password, saltRounds);

        // Check if employee already exists
        const existingEmployee = await pool.query(
            'SELECT id FROM employees WHERE username = $1',
            [employee.username]
        );

        if (existingEmployee.rows.length > 0) {
            console.log('⚠️ employee1_1 already exists! Updating...');
            
            // Update existing employee
            await pool.query(`
                UPDATE employees 
                SET password_hash = $1, employee_name = $2, email = $3, salon_id = $4, updated_at = NOW()
                WHERE username = $5
            `, [password_hash, employee.full_name, employee.email, employee.salon_id, employee.username]);
            
            console.log('✅ employee1_1 updated successfully!');
        } else {
            // Create new employee
            const result = await pool.query(`
                INSERT INTO employees (username, password_hash, employee_name, email, salon_id, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                RETURNING id, username, salon_id
            `, [employee.username, password_hash, employee.full_name, employee.email, employee.salon_id]);
            
            console.log('✅ employee1_1 created successfully!');
            console.log('👤 Employee data:', result.rows[0]);
        }

        // Verify the employee can login
        console.log('\n🧪 Testing login...');
        const loginTest = await pool.query(
            'SELECT id, username, salon_id FROM employees WHERE username = $1',
            [employee.username]
        );

        if (loginTest.rows.length > 0) {
            console.log('✅ employee1_1 found in database:');
            console.log('👤 Employee data:', loginTest.rows[0]);
        } else {
            console.log('❌ employee1_1 not found after creation!');
        }

    } catch (error) {
        console.error('❌ Error creating employee1_1:', error);
    } finally {
        await pool.end();
    }
}

createEmployee1_1();