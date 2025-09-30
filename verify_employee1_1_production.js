const { Client } = require('pg');
require('dotenv').config({ path: '.env.production' });

async function verifyEmployee1_1() {
    console.log('🔍 Verifying employee1_1 in production database...');
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('✅ Connected to production database');

        // Check employee1_1 with the exact ID from JWT token
        const employeeId = '161d697c-caf3-4af9-8ef1-e0201fcd858a';
        
        console.log('\n🔍 Checking employee1_1 with ID:', employeeId);
        
        const result = await client.query(
            'SELECT id, username, email, full_name, role, salon_id, is_active, created_at, updated_at FROM admins WHERE id = $1',
            [employeeId]
        );

        if (result.rows.length > 0) {
            const employee = result.rows[0];
            console.log('✅ Employee found in admins table:');
            console.log('   - ID:', employee.id);
            console.log('   - Username:', employee.username);
            console.log('   - Email:', employee.email);
            console.log('   - Full Name:', employee.full_name);
            console.log('   - Role:', employee.role);
            console.log('   - Salon ID:', employee.salon_id);
            console.log('   - Is Active:', employee.is_active);
            console.log('   - Created At:', employee.created_at);
            console.log('   - Updated At:', employee.updated_at);
            
            // Check if role is exactly 'employee'
            if (employee.role === 'employee') {
                console.log('✅ Role is correctly set to "employee"');
            } else {
                console.log('❌ Role is not "employee", it is:', employee.role);
            }
            
            // Check if is_active is true
            if (employee.is_active === true) {
                console.log('✅ Employee is active');
            } else {
                console.log('❌ Employee is not active:', employee.is_active);
            }
            
        } else {
            console.log('❌ Employee not found with ID:', employeeId);
            
            // Try to find by username
            console.log('\n🔍 Searching by username "employee1_1"...');
            const usernameResult = await client.query(
                'SELECT id, username, email, full_name, role, salon_id, is_active FROM admins WHERE username = $1',
                ['employee1_1']
            );
            
            if (usernameResult.rows.length > 0) {
                console.log('✅ Found employee1_1 by username:');
                usernameResult.rows.forEach((emp, index) => {
                    console.log(`   Employee ${index + 1}:`);
                    console.log('     - ID:', emp.id);
                    console.log('     - Username:', emp.username);
                    console.log('     - Email:', emp.email);
                    console.log('     - Role:', emp.role);
                    console.log('     - Salon ID:', emp.salon_id);
                    console.log('     - Is Active:', emp.is_active);
                });
            } else {
                console.log('❌ No employee found with username "employee1_1"');
            }
        }
        
        // Also check all employees in the database
        console.log('\n📊 All employees in admins table:');
        const allEmployees = await client.query(
            'SELECT id, username, email, role, salon_id, is_active FROM admins WHERE role = $1 ORDER BY created_at',
            ['employee']
        );
        
        if (allEmployees.rows.length > 0) {
            console.log(`Found ${allEmployees.rows.length} employees:`);
            allEmployees.rows.forEach((emp, index) => {
                console.log(`   ${index + 1}. ${emp.username} (${emp.id}) - Active: ${emp.is_active}`);
            });
        } else {
            console.log('❌ No employees found in admins table');
        }

    } catch (error) {
        console.error('❌ Database error:', error);
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

verifyEmployee1_1();