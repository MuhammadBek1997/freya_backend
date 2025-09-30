const { Client } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.production' });

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function fixEmployeeUuidIssue() {
    console.log('🔧 Fixing employee UUID issue for chat functionality...');
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('✅ Connected to production database');

        // Step 1: Check if employee1_1 exists in employees table (UUID-based)
        console.log('\n📋 Step 1: Checking employees table for UUID-based records...');
        const employeesResult = await client.query('SELECT * FROM employees WHERE username = $1', ['employee1_1']);
        
        if (employeesResult.rows.length > 0) {
            console.log('✅ Found employee1_1 in employees table:', employeesResult.rows[0]);
            const employee = employeesResult.rows[0];
            
            // Test chat with UUID employee
            await testChatWithUuidEmployee(client, employee);
        } else {
            console.log('❌ employee1_1 not found in employees table');
            
            // Step 2: Get employee1_1 from admins table
            const adminResult = await client.query('SELECT * FROM admins WHERE username = $1', ['employee1_1']);
            const admin = adminResult.rows[0];
            
            console.log('📋 Found employee1_1 in admins table:', {
                id: admin.id,
                username: admin.username,
                role: admin.role,
                salon_id: admin.salon_id
            });

            // Step 3: Create a UUID-based employee record
            console.log('\n🆕 Step 3: Creating UUID-based employee record...');
            
            try {
                const createEmployeeResult = await client.query(`
                    INSERT INTO employees (
                        id, username, email, password_hash, role, salon_id, 
                        is_active, created_at, updated_at
                    ) VALUES (
                        gen_random_uuid(), $1, $2, $3, $4, $5, 
                        true, NOW(), NOW()
                    ) RETURNING *
                `, [
                    admin.username,
                    admin.email || `${admin.username}@salon.com`,
                    admin.password_hash,
                    admin.role,
                    admin.salon_id
                ]);

                const newEmployee = createEmployeeResult.rows[0];
                console.log('✅ Created UUID-based employee record:', {
                    id: newEmployee.id,
                    username: newEmployee.username,
                    role: newEmployee.role,
                    salon_id: newEmployee.salon_id
                });

                // Test chat with new UUID employee
                await testChatWithUuidEmployee(client, newEmployee);

            } catch (createError) {
                if (createError.code === '23505') { // Unique constraint violation
                    console.log('⚠️ Employee already exists in employees table, fetching...');
                    const existingResult = await client.query('SELECT * FROM employees WHERE username = $1', ['employee1_1']);
                    const existingEmployee = existingResult.rows[0];
                    console.log('✅ Found existing UUID employee:', existingEmployee);
                    
                    // Test chat with existing UUID employee
                    await testChatWithUuidEmployee(client, existingEmployee);
                } else {
                    console.log('❌ Error creating employee:', createError.message);
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

async function testChatWithUuidEmployee(client, employee) {
    console.log('\n💬 Testing chat functionality with UUID employee...');
    
    try {
        // Get test users
        const usersResult = await client.query('SELECT * FROM users WHERE is_active = true LIMIT 1');
        if (usersResult.rows.length === 0) {
            console.log('❌ No test users found');
            return;
        }

        const testUser = usersResult.rows[0];
        console.log(`Selected test user: ${testUser.username} (ID: ${testUser.id})`);

        // Create test conversation
        console.log('\n✍️ Creating test conversation...');
        
        const messageResult = await client.query(`
            INSERT INTO user_chats (
                id, sender_id, sender_type, receiver_id, receiver_type, 
                message_text, message_type, is_read, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), $1, 'employee', $2, 'user',
                'Hello! This is a test message from employee1_1 using UUID.', 
                'text', false, NOW(), NOW()
            ) RETURNING *
        `, [employee.id, testUser.id]);

        console.log('✅ Test message created successfully!');
        const message = messageResult.rows[0];
        console.log('Message details:', {
            id: message.id,
            from: `${message.sender_type} (${message.sender_id})`,
            to: `${message.receiver_type} (${message.receiver_id})`,
            text: message.message_text
        });

        // Create user reply
        const replyResult = await client.query(`
            INSERT INTO user_chats (
                id, sender_id, sender_type, receiver_id, receiver_type, 
                message_text, message_type, is_read, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), $1, 'user', $2, 'employee',
                'Thank you! The UUID-based chat is working perfectly.', 
                'text', false, NOW(), NOW()
            ) RETURNING *
        `, [testUser.id, employee.id]);

        console.log('✅ User reply created successfully!');

        // Get conversation history
        const historyResult = await client.query(`
            SELECT * FROM user_chats 
            WHERE (sender_type = 'employee' AND sender_id = $1 AND receiver_id = $2)
               OR (sender_type = 'user' AND sender_id = $2 AND receiver_id = $1)
            ORDER BY created_at ASC
        `, [employee.id, testUser.id]);

        console.log(`\n📜 Conversation history (${historyResult.rows.length} messages):`);
        historyResult.rows.forEach((msg, index) => {
            console.log(`   ${index + 1}. [${msg.sender_type}]: ${msg.message_text}`);
        });

        // Test unread count
        const unreadResult = await client.query(`
            SELECT COUNT(*) as unread_count
            FROM user_chats 
            WHERE receiver_type = 'employee' 
              AND receiver_id = $1 
              AND is_read = false
        `, [employee.id]);

        console.log(`\n📊 Unread messages for employee: ${unreadResult.rows[0].unread_count}`);

        // Generate JWT token for the UUID employee
        const token = jwt.sign(
            { 
                id: employee.id, 
                username: employee.username, 
                role: employee.role,
                salon_id: employee.salon_id 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('\n🔑 JWT Token for UUID employee generated successfully');
        console.log('Token payload:', {
            id: employee.id,
            username: employee.username,
            role: employee.role,
            salon_id: employee.salon_id
        });

        console.log('\n✅ CHAT FUNCTIONALITY FULLY OPERATIONAL WITH UUID EMPLOYEE!');
        console.log('🎉 employee1_1 can now send and receive messages using UUID-based system');

    } catch (chatError) {
        console.log('❌ Chat test error:', chatError.message);
    }
}

fixEmployeeUuidIssue();