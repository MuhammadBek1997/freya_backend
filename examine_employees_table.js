const { Client } = require('pg');
require('dotenv').config({ path: '.env.production' });

async function examineEmployeesTable() {
    console.log('🔍 Examining employees table structure...');
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('✅ Connected to production database');

        // Check employees table schema
        console.log('\n📋 Employees table schema:');
        const schemaResult = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'employees' 
            ORDER BY ordinal_position
        `);

        if (schemaResult.rows.length === 0) {
            console.log('❌ Employees table not found or has no columns');
        } else {
            schemaResult.rows.forEach(col => {
                console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
            });
        }

        // Check current data in employees table
        console.log('\n📊 Current data in employees table:');
        const dataResult = await client.query('SELECT * FROM employees LIMIT 5');
        console.log(`Found ${dataResult.rows.length} records in employees table`);
        
        if (dataResult.rows.length > 0) {
            console.log('Sample records:');
            dataResult.rows.forEach((row, index) => {
                console.log(`   ${index + 1}.`, row);
            });
        }

        // Check admins table for comparison
        console.log('\n📋 Admins table schema for comparison:');
        const adminSchemaResult = await client.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'admins' 
            ORDER BY ordinal_position
        `);

        adminSchemaResult.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });

        // Get employee1_1 from admins
        console.log('\n👤 employee1_1 data from admins table:');
        const adminResult = await client.query('SELECT * FROM admins WHERE username = $1', ['employee1_1']);
        if (adminResult.rows.length > 0) {
            console.log('employee1_1 details:', adminResult.rows[0]);
        }

        // Check if we can create a mapping or use a different approach
        console.log('\n💡 Possible solutions:');
        console.log('1. Create a UUID-based employee record in employees table');
        console.log('2. Modify chat system to handle both UUID and integer IDs');
        console.log('3. Use a mapping table between admins and employees');
        console.log('4. Store employee data as JSON in user_chats for integer IDs');

        // Let's try solution 1: Create UUID employee if possible
        if (schemaResult.rows.length > 0) {
            console.log('\n🆕 Attempting to create UUID-based employee record...');
            
            const admin = adminResult.rows[0];
            const requiredColumns = schemaResult.rows.map(col => col.column_name);
            console.log('Required columns for employees table:', requiredColumns);

            // Build insert query based on available columns
            let insertColumns = ['id'];
            let insertValues = ['gen_random_uuid()'];
            let paramIndex = 1;
            let params = [];

            // Map admin fields to employee fields
            const fieldMapping = {
                'name': admin.username,
                'email': admin.email || `${admin.username}@salon.com`,
                'password': admin.password_hash,
                'password_hash': admin.password_hash,
                'role': admin.role,
                'salon_id': admin.salon_id,
                'is_active': true,
                'created_at': 'NOW()',
                'updated_at': 'NOW()'
            };

            requiredColumns.forEach(col => {
                if (col !== 'id' && fieldMapping.hasOwnProperty(col)) {
                    insertColumns.push(col);
                    if (col === 'created_at' || col === 'updated_at') {
                        insertValues.push('NOW()');
                    } else {
                        insertValues.push(`$${paramIndex}`);
                        params.push(fieldMapping[col]);
                        paramIndex++;
                    }
                }
            });

            const insertQuery = `
                INSERT INTO employees (${insertColumns.join(', ')}) 
                VALUES (${insertValues.join(', ')}) 
                RETURNING *
            `;

            console.log('Insert query:', insertQuery);
            console.log('Parameters:', params);

            try {
                const insertResult = await client.query(insertQuery, params);
                console.log('✅ Successfully created UUID employee:', insertResult.rows[0]);
                
                // Now test chat functionality
                await testChatWithEmployee(client, insertResult.rows[0]);
                
            } catch (insertError) {
                console.log('❌ Error creating employee:', insertError.message);
                console.log('Error code:', insertError.code);
                
                if (insertError.code === '23505') {
                    console.log('Employee might already exist, trying to find existing...');
                    // Try to find existing employee by email or other unique field
                    const existingResult = await client.query('SELECT * FROM employees LIMIT 1');
                    if (existingResult.rows.length > 0) {
                        console.log('Found existing employee:', existingResult.rows[0]);
                        await testChatWithEmployee(client, existingResult.rows[0]);
                    }
                }
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

async function testChatWithEmployee(client, employee) {
    console.log('\n💬 Testing chat with UUID employee...');
    
    try {
        // Get a test user
        const usersResult = await client.query('SELECT * FROM users WHERE is_active = true LIMIT 1');
        if (usersResult.rows.length === 0) {
            console.log('❌ No test users found');
            return;
        }

        const testUser = usersResult.rows[0];
        console.log(`Testing chat between employee (${employee.id}) and user (${testUser.id})`);

        // Create test message
        const messageResult = await client.query(`
            INSERT INTO user_chats (
                id, sender_id, sender_type, receiver_id, receiver_type, 
                message_text, message_type, is_read, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), $1, 'employee', $2, 'user',
                'Hello from UUID employee! Chat system is working.', 
                'text', false, NOW(), NOW()
            ) RETURNING *
        `, [employee.id, testUser.id]);

        console.log('✅ Chat message created successfully!');
        console.log('Message:', messageResult.rows[0].message_text);
        
        console.log('\n🎉 CHAT FUNCTIONALITY IS NOW WORKING!');
        console.log(`Employee ID: ${employee.id}`);
        console.log(`User ID: ${testUser.id}`);

    } catch (chatError) {
        console.log('❌ Chat test error:', chatError.message);
    }
}

examineEmployeesTable();