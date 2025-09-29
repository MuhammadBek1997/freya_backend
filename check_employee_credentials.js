const { Pool } = require('pg');

// Heroku production database connection
const pool = new Pool({
    connectionString: 'postgres://uefhovlhferv7t:pf59bcec9eba0168cce78a7f8728a7a6cf66489256b0dc9829bc4a1e5b46f68d7@c3v5n5ajfopshl.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/dchto8v0bjnhh7',
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkEmployeeCredentials() {
    try {
        console.log('🔍 Checking employee table structure and credentials...\n');

        // First, check table structure
        const structureResult = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'employees'
            ORDER BY ordinal_position
        `);

        console.log('📋 EMPLOYEES TABLE STRUCTURE:');
        structureResult.rows.forEach(col => {
            console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
        console.log('');

        // Get all employees with their credentials
        const employeesResult = await pool.query(`
            SELECT 
                e.*,
                s.name as salon_name
            FROM employees e
            LEFT JOIN salons s ON e.salon_id = s.id
            ORDER BY s.name, e.id
        `);

        if (employeesResult.rows.length === 0) {
            console.log('❌ No employees found in database!');
            return;
        }

        console.log(`📊 Found ${employeesResult.rows.length} employees:\n`);

        // Group employees by salon
        const employeesBySalon = {};
        employeesResult.rows.forEach(emp => {
            const salonName = emp.salon_name || 'Unknown Salon';
            if (!employeesBySalon[salonName]) {
                employeesBySalon[salonName] = [];
            }
            employeesBySalon[salonName].push(emp);
        });

        // Display employees by salon
        for (const [salonName, employees] of Object.entries(employeesBySalon)) {
            console.log(`🏢 ${salonName}:`);
            employees.forEach((emp, index) => {
                const status = emp.is_waiting ? '⏳ Waiting' : '✅ Active';
                console.log(`   ${index + 1}. Employee ID: ${emp.id}`);
                console.log(`      Full Name: ${emp.full_name || 'Not set'}`);
                console.log(`      Username: ${emp.username || 'Not set'}`);
                console.log(`      Email: ${emp.email || 'Not set'}`);
                console.log(`      Status: ${status}`);
                console.log(`      Salon ID: ${emp.salon_id}`);
                
                // Check if password is set
                if (emp.password_hash) {
                    console.log(`      Password: ✅ Set (hash exists)`);
                } else {
                    console.log(`      Password: ❌ Not set`);
                }
                console.log('');
            });
            console.log('');
        }

        // Show summary
        const activeEmployees = employeesResult.rows.filter(emp => !emp.is_waiting);
        const waitingEmployees = employeesResult.rows.filter(emp => emp.is_waiting);
        const employeesWithUsername = employeesResult.rows.filter(emp => emp.username);
        const employeesWithPassword = employeesResult.rows.filter(emp => emp.password_hash);

        console.log('📈 SUMMARY:');
        console.log(`   Total employees: ${employeesResult.rows.length}`);
        console.log(`   Active employees: ${activeEmployees.length}`);
        console.log(`   Waiting employees: ${waitingEmployees.length}`);
        console.log(`   Employees with username: ${employeesWithUsername.length}`);
        console.log(`   Employees with password: ${employeesWithPassword.length}`);

        if (employeesWithUsername.length > 0) {
            console.log('\n🔐 EMPLOYEES WITH LOGIN CREDENTIALS:');
            employeesWithUsername.forEach(emp => {
                console.log(`   • ${emp.full_name || emp.username} (${emp.username}) - ${emp.salon_name || 'Unknown Salon'}`);
            });
        }

        // Show employees that can login (have both username and password)
        const loginReadyEmployees = employeesResult.rows.filter(emp => emp.username && emp.password_hash);
        if (loginReadyEmployees.length > 0) {
            console.log('\n✅ EMPLOYEES READY FOR LOGIN:');
            loginReadyEmployees.forEach(emp => {
                console.log(`   • Username: ${emp.username}`);
                console.log(`     Name: ${emp.full_name || 'Not set'}`);
                console.log(`     Salon: ${emp.salon_name || 'Unknown'}`);
                console.log(`     Status: ${emp.is_waiting ? 'Waiting' : 'Active'}`);
                console.log('');
            });
        } else {
            console.log('\n❌ NO EMPLOYEES ARE READY FOR LOGIN (missing username or password)');
        }

    } catch (error) {
        console.error('❌ Error checking employee credentials:', error.message);
    } finally {
        await pool.end();
    }
}

checkEmployeeCredentials();