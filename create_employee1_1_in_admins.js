const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
    connectionString: 'postgres://uefhovlhferv7t:pf59bcec9eba0168cce78a7f8728a7a6cf66489256b0dc9829bc4a1e5b46f68d7@c3v5n5ajfopshl.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/dchto8v0bjnhh7',
    ssl: { rejectUnauthorized: false }
});

async function createEmployee1_1InAdmins() {
    try {
        console.log('🔧 Creating employee1_1 in admins table...');

        // Get admin1's salon_id
        const adminResult = await pool.query(
            'SELECT salon_id FROM admins WHERE username = $1',
            ['admin1']
        );

        if (adminResult.rows.length === 0) {
            throw new Error('admin1 not found');
        }

        const salon_id = adminResult.rows[0].salon_id;
        console.log('🏢 Using admin1\'s salon_id:', salon_id);

        const employee = {
            username: 'employee1_1',
            password: '123456',
            email: 'employee1_1@freya.uz',
            full_name: 'Employee One One',
            role: 'employee',
            salon_id: salon_id
        };

        // Hash password
        const password_hash = await bcrypt.hash(employee.password, 10);

        // Check if employee already exists in admins table
        const existingEmployee = await pool.query(
            'SELECT id FROM admins WHERE username = $1',
            [employee.username]
        );

        if (existingEmployee.rows.length > 0) {
            // Update existing employee
            await pool.query(`
                UPDATE admins 
                SET password_hash = $1, full_name = $2, email = $3, salon_id = $4, role = $5, updated_at = NOW()
                WHERE username = $6
            `, [password_hash, employee.full_name, employee.email, employee.salon_id, employee.role, employee.username]);
            
            console.log('✅ employee1_1 updated successfully in admins table!');
        } else {
            // Create new employee in admins table
            const result = await pool.query(`
                INSERT INTO admins (username, password_hash, full_name, email, salon_id, role, is_active, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
                RETURNING id, username, salon_id, role
            `, [employee.username, password_hash, employee.full_name, employee.email, employee.salon_id, employee.role]);
            
            console.log('✅ employee1_1 created successfully in admins table!');
            console.log('👤 Employee data:', result.rows[0]);
        }

        // Verify the employee can login
        console.log('\n🧪 Testing login...');
        const loginTest = await pool.query(
            'SELECT id, username, salon_id, role FROM admins WHERE username = $1 AND role = $2',
            [employee.username, 'employee']
        );

        if (loginTest.rows.length > 0) {
            console.log('✅ employee1_1 found in admins table:');
            console.log('👤 Employee data:', loginTest.rows[0]);
        } else {
            console.log('❌ employee1_1 not found after creation!');
        }

    } catch (error) {
        console.error('❌ Error creating employee1_1 in admins:', error);
    } finally {
        await pool.end();
    }
}

createEmployee1_1InAdmins();