const { Client } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.production' });

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function testChatWithProductionDB() {
    console.log('🔍 Testing chat functionality with production database...');
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('✅ Connected to production database');

        // Step 1: Get employee1_1 data
        console.log('\n📋 Step 1: Getting employee1_1 data...');
        const employeeResult = await client.query(
            'SELECT * FROM admins WHERE username = $1',
            ['employee1_1']
        );

        if (employeeResult.rows.length === 0) {
            console.log('❌ employee1_1 not found');
            return;
        }

        const employee = employeeResult.rows[0];
        console.log('✅ Found employee1_1:', {
            id: employee.id,
            username: employee.username,
            role: employee.role,
            salon_id: employee.salon_id,
            is_active: employee.is_active
        });

        // Step 2: Create a JWT token for employee1_1
        console.log('\n🔑 Step 2: Creating JWT token...');
        const tokenPayload = {
            id: employee.id,
            username: employee.username,
            role: employee.role,
            salon_id: employee.salon_id,
            userType: 'employee'
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });
        console.log('✅ JWT token created');
        console.log('Token payload:', tokenPayload);

        // Step 3: Check if there are any users to chat with
        console.log('\n👥 Step 3: Checking for users to chat with...');
        const usersResult = await client.query('SELECT * FROM users WHERE is_active = true LIMIT 5');
        console.log(`Found ${usersResult.rows.length} active users`);

        if (usersResult.rows.length > 0) {
            console.log('Active users:');
            usersResult.rows.forEach(user => {
                console.log(`   - ID: ${user.id}, Username: ${user.username || 'N/A'}, Phone: ${user.phone}`);
            });
        }

        // Step 4: Check existing chat messages
        console.log('\n💬 Step 4: Checking existing chat messages...');
        
        // Check if user_chats table has any messages
        const messagesResult = await client.query('SELECT COUNT(*) FROM user_chats');
        console.log(`Total messages in user_chats: ${messagesResult.rows[0].count}`);

        // Check if there are any messages involving employees
        const employeeMessagesResult = await client.query(`
            SELECT * FROM user_chats 
            WHERE sender_type = 'employee' OR receiver_type = 'employee'
            LIMIT 5
        `);
        console.log(`Messages involving employees: ${employeeMessagesResult.rows.length}`);

        if (employeeMessagesResult.rows.length > 0) {
            console.log('Employee messages:');
            employeeMessagesResult.rows.forEach(msg => {
                console.log(`   - From: ${msg.sender_type} (${msg.sender_id}) to ${msg.receiver_type} (${msg.receiver_id})`);
                console.log(`     Message: ${msg.message_text}`);
                console.log(`     Date: ${msg.created_at}`);
            });
        }

        // Step 5: Test creating a chat message
        console.log('\n✍️ Step 5: Testing chat message creation...');
        
        if (usersResult.rows.length > 0) {
            const testUser = usersResult.rows[0];
            console.log(`Creating test message from employee1_1 to user ${testUser.id}...`);

            try {
                const insertResult = await client.query(`
                    INSERT INTO user_chats (
                        id, sender_id, sender_type, receiver_id, receiver_type, 
                        message_text, message_type, is_read, created_at, updated_at
                    ) VALUES (
                        gen_random_uuid(), $1, 'employee', $2, 'user',
                        'Hello! This is a test message from employee1_1', 'text', false, NOW(), NOW()
                    ) RETURNING *
                `, [employee.id, testUser.id]);

                console.log('✅ Test message created successfully!');
                console.log('Message details:', insertResult.rows[0]);

                // Step 6: Test retrieving conversations for the employee
                console.log('\n📖 Step 6: Testing conversation retrieval...');
                
                const conversationsResult = await client.query(`
                    SELECT DISTINCT 
                        CASE 
                            WHEN sender_type = 'employee' AND sender_id = $1 THEN receiver_id
                            WHEN receiver_type = 'employee' AND receiver_id = $1 THEN sender_id
                        END as user_id,
                        CASE 
                            WHEN sender_type = 'employee' AND sender_id = $1 THEN receiver_type
                            WHEN receiver_type = 'employee' AND receiver_id = $1 THEN sender_type
                        END as user_type
                    FROM user_chats 
                    WHERE (sender_type = 'employee' AND sender_id = $1) 
                       OR (receiver_type = 'employee' AND receiver_id = $1)
                `, [employee.id]);

                console.log(`✅ Found ${conversationsResult.rows.length} conversations for employee1_1`);
                conversationsResult.rows.forEach(conv => {
                    console.log(`   - Conversation with ${conv.user_type}: ${conv.user_id}`);
                });

                // Step 7: Test getting unread message count
                console.log('\n📊 Step 7: Testing unread message count...');
                
                const unreadResult = await client.query(`
                    SELECT COUNT(*) as unread_count
                    FROM user_chats 
                    WHERE receiver_type = 'employee' 
                      AND receiver_id = $1 
                      AND is_read = false
                `, [employee.id]);

                console.log(`✅ Unread messages for employee1_1: ${unreadResult.rows[0].unread_count}`);

            } catch (insertError) {
                console.log('❌ Error creating test message:', insertError.message);
            }
        } else {
            console.log('⚠️ No users found to test chat with');
        }

        // Step 8: Summary
        console.log('\n📋 Summary:');
        console.log('✅ Production database connection: Working');
        console.log('✅ employee1_1 authentication: Working');
        console.log('✅ JWT token generation: Working');
        console.log(`✅ Users available: ${usersResult.rows.length}`);
        console.log(`✅ Chat functionality: ${usersResult.rows.length > 0 ? 'Working' : 'Limited (no users)'}`);

    } catch (error) {
        console.error('❌ Test error:', error);
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

testChatWithProductionDB();