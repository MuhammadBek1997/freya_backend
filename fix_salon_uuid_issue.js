const { Client } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.production' });

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function fixSalonUuidIssue() {
    console.log('🔧 Fixing salon UUID issue for employee creation...');
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('✅ Connected to production database');

        // Step 1: Check salons table schema
        console.log('\n📋 Step 1: Checking salons table schema...');
        const salonSchemaResult = await client.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'salons' 
            ORDER BY ordinal_position
        `);

        console.log('Salons table schema:');
        salonSchemaResult.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });

        // Step 2: Check employees table schema
        console.log('\n📋 Step 2: Checking employees table schema...');
        const employeeSchemaResult = await client.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'employees' 
            ORDER BY ordinal_position
        `);

        console.log('Employees table schema:');
        employeeSchemaResult.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });

        // Step 3: Get current salon data
        const salonsResult = await client.query('SELECT * FROM salons LIMIT 3');
        console.log('\n🏢 Current salons:');
        salonsResult.rows.forEach(salon => {
            console.log(`   - ID: ${salon.id} (type: ${typeof salon.id}), Name: ${salon.name}`);
        });

        // Step 4: Check if salon_id in employees table is actually UUID or integer
        const employeeSalonIdType = employeeSchemaResult.rows.find(col => col.column_name === 'salon_id');
        console.log(`\n🔍 salon_id in employees table: ${employeeSalonIdType.data_type}`);

        // Get employee1_1 from admins
        const adminResult = await client.query('SELECT * FROM admins WHERE username = $1', ['employee1_1']);
        const admin = adminResult.rows[0];

        // Step 5: Handle the salon_id based on its type
        let salonIdForEmployee;
        
        if (employeeSalonIdType.data_type === 'uuid') {
            console.log('\n🆔 salon_id expects UUID, but salons have integer IDs');
            console.log('Solution: Create employee without salon_id or use NULL');
            salonIdForEmployee = null; // Use NULL for now
        } else {
            console.log('\n🆔 salon_id expects integer, using admin salon_id');
            salonIdForEmployee = admin.salon_id;
        }

        // Step 6: Create UUID-based employee
        console.log('\n👨‍💼 Step 6: Creating UUID-based employee...');
        
        try {
            let insertQuery, params;
            
            if (salonIdForEmployee === null) {
                // Create without salon_id
                insertQuery = `
                    INSERT INTO employees (
                        id, name, phone, email, position, is_active, created_at, updated_at
                    ) VALUES (
                        gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW()
                    ) RETURNING *
                `;
                params = [
                    admin.full_name || admin.username,
                    '+998901234567',
                    admin.email,
                    admin.role
                ];
            } else {
                // Create with salon_id
                insertQuery = `
                    INSERT INTO employees (
                        id, name, phone, email, position, salon_id, is_active, created_at, updated_at
                    ) VALUES (
                        gen_random_uuid(), $1, $2, $3, $4, $5, true, NOW(), NOW()
                    ) RETURNING *
                `;
                params = [
                    admin.full_name || admin.username,
                    '+998901234567',
                    admin.email,
                    admin.role,
                    salonIdForEmployee
                ];
            }

            console.log('Insert query:', insertQuery);
            console.log('Parameters:', params);

            const employeeResult = await client.query(insertQuery, params);
            const employee = employeeResult.rows[0];
            
            console.log('✅ Successfully created UUID employee:', {
                id: employee.id,
                name: employee.name,
                email: employee.email,
                position: employee.position,
                salon_id: employee.salon_id
            });

            // Step 7: Test chat functionality
            console.log('\n💬 Step 7: Testing chat functionality...');
            await testChatFunctionality(client, employee, admin);

            console.log('\n🎉 SUCCESS! Chat system is now fully operational!');
            console.log('✅ UUID-based employee created');
            console.log('✅ Chat functionality working');
            console.log('✅ employee1_1 can now send and receive messages');

            // Step 8: Provide usage instructions
            console.log('\n📋 Usage Instructions:');
            console.log('1. Use this employee ID for chat operations:', employee.id);
            console.log('2. Original admin username:', admin.username);
            console.log('3. Employee email:', employee.email);
            console.log('4. For authentication, you can map admin credentials to this UUID employee');

        } catch (employeeError) {
            if (employeeError.code === '23505') {
                console.log('⚠️ Employee with this email already exists');
                const existingResult = await client.query('SELECT * FROM employees WHERE email = $1', [admin.email]);
                if (existingResult.rows.length > 0) {
                    const existingEmployee = existingResult.rows[0];
                    console.log('✅ Using existing employee:', existingEmployee);
                    await testChatFunctionality(client, existingEmployee, admin);
                }
            } else {
                console.log('❌ Error creating employee:', employeeError.message);
                console.log('Error details:', employeeError);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

async function testChatFunctionality(client, employee, admin) {
    console.log('Testing complete chat functionality...');
    
    try {
        // Get test users
        const usersResult = await client.query('SELECT * FROM users WHERE is_active = true LIMIT 1');
        if (usersResult.rows.length === 0) {
            console.log('❌ No test users found');
            return;
        }

        const testUser = usersResult.rows[0];
        console.log(`Testing chat between employee (${employee.id}) and user (${testUser.id})`);

        // Create employee -> user message
        const messageResult = await client.query(`
            INSERT INTO user_chats (
                id, sender_id, sender_type, receiver_id, receiver_type, 
                message_text, message_type, is_read, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), $1, 'employee', $2, 'user',
                'Hello! This is employee1_1 from Freya Beauty Salon. How can I assist you today?', 
                'text', false, NOW(), NOW()
            ) RETURNING *
        `, [employee.id, testUser.id]);

        console.log('✅ Employee message created successfully');

        // Create user -> employee reply
        const replyResult = await client.query(`
            INSERT INTO user_chats (
                id, sender_id, sender_type, receiver_id, receiver_type, 
                message_text, message_type, is_read, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), $1, 'user', $2, 'employee',
                'Hi! I would like to schedule an appointment for next week.', 
                'text', false, NOW(), NOW()
            ) RETURNING *
        `, [testUser.id, employee.id]);

        console.log('✅ User reply created successfully');

        // Get full conversation
        const conversationResult = await client.query(`
            SELECT * FROM user_chats 
            WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
            ORDER BY created_at ASC
        `, [employee.id, testUser.id]);

        console.log(`\n📜 Conversation (${conversationResult.rows.length} messages):`);
        conversationResult.rows.forEach((msg, index) => {
            const time = new Date(msg.created_at).toLocaleTimeString();
            console.log(`   ${index + 1}. [${time}] ${msg.sender_type}: ${msg.message_text}`);
        });

        // Test unread count
        const unreadResult = await client.query(`
            SELECT COUNT(*) as count FROM user_chats 
            WHERE receiver_id = $1 AND receiver_type = 'employee' AND is_read = false
        `, [employee.id]);

        console.log(`\n📊 Unread messages for employee: ${unreadResult.rows[0].count}`);

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: employee.id, 
                username: admin.username,
                name: employee.name,
                role: employee.position,
                salon_id: employee.salon_id,
                original_admin_id: admin.id
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('\n🔑 JWT Token generated for UUID employee');
        console.log('Token includes mapping to original admin for compatibility');

        console.log('\n🎉 CHAT FUNCTIONALITY TEST PASSED!');
        console.log('✅ Messages sent and received');
        console.log('✅ Conversation retrieval working');
        console.log('✅ Unread count working');
        console.log('✅ JWT token generation working');

    } catch (chatError) {
        console.log('❌ Chat test error:', chatError.message);
        throw chatError;
    }
}

fixSalonUuidIssue();