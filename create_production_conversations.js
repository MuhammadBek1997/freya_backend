const { Client } = require('pg');
require('dotenv').config({ path: '.env.production' });

const dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
};

// Sample conversation scenarios
const conversations = [
    {
        userMessages: [
            "Salom! Soch turmaklash uchun vaqt bor mi?",
            "Ertaga ertalab 10:00 da bo'sh vaqtingiz bormi?",
            "Rahmat! Qancha turadi?"
        ],
        employeeMessages: [
            "Salom! Albatta, qachon kelmoqchisiz?",
            "Ha, ertaga 10:00 da bo'sh. Qanday xizmat kerak?",
            "Soch turmaklash 150,000 so'm. Bron qilaylikmi?"
        ]
    },
    {
        userMessages: [
            "Manikür qilish mumkinmi?",
            "Bugun kechqurun vaqtingiz bormi?",
            "18:00 da yaxshi bo'ladi"
        ],
        employeeMessages: [
            "Salom! Manikür xizmati bor. Qachon kelasiz?",
            "Bugun 17:00 dan 19:00 gacha bo'sh vaqtim bor",
            "Yaxshi, 18:00 ga bron qildim. Telefon raqamingizni tasdiqlaysizmi?"
        ]
    },
    {
        userMessages: [
            "Yuz tozalash xizmati bormi?",
            "Narxi qancha?",
            "Yaxshi, haftaning qaysi kunlari ishlaysiz?"
        ],
        employeeMessages: [
            "Ha, yuz tozalash xizmatimiz bor. Professional kosmetolog bilan",
            "Oddiy tozalash 200,000 so'm, chuqur tozalash 350,000 so'm",
            "Dushanba-Shanba 9:00 dan 20:00 gacha ishlaymiz"
        ]
    }
];

async function createConversations() {
    const client = new Client(dbConfig);
    
    try {
        await client.connect();
        console.log('✅ Connected to production database');
        
        // Get the admin employee1_1 first
        const adminResult = await client.query(
            'SELECT * FROM admins WHERE username = $1',
            ['employee1_1']
        );
        
        if (adminResult.rows.length === 0) {
            console.log('❌ Admin employee1_1 not found');
            return;
        }
        
        const admin = adminResult.rows[0];
        console.log(`✅ Found admin: ${admin.username} (${admin.email})`);
        
        // Get the corresponding UUID employee
        const employeeResult = await client.query(
            'SELECT * FROM employees WHERE email = $1',
            [admin.email]
        );
        
        if (employeeResult.rows.length === 0) {
            console.log('❌ UUID employee not found for email:', admin.email);
            console.log('📝 Let me check all employees...');
            
            const allEmployees = await client.query('SELECT * FROM employees LIMIT 5');
            console.log('Available employees:');
            allEmployees.rows.forEach(emp => {
                console.log(`   - ${emp.id}: ${emp.name} (${emp.email})`);
            });
            return;
        }
        
        const employee = employeeResult.rows[0];
        console.log(`✅ Found employee: ${employee.name} (${employee.id})`);
        
        // Get test users
        const usersResult = await client.query(
            'SELECT * FROM users WHERE username LIKE $1 ORDER BY username',
            ['test_user_%']
        );
        
        if (usersResult.rows.length === 0) {
            console.log('❌ No test users found');
            return;
        }
        
        console.log(`✅ Found ${usersResult.rows.length} test users`);
        
        // Create conversations
        for (let i = 0; i < Math.min(conversations.length, usersResult.rows.length); i++) {
            const user = usersResult.rows[i];
            const conversation = conversations[i];
            
            console.log(`\n💬 Creating conversation between ${employee.name} and ${user.username}:`);
            
            // Create alternating messages
            const maxMessages = Math.max(conversation.userMessages.length, conversation.employeeMessages.length);
            
            for (let j = 0; j < maxMessages; j++) {
                // User message first
                if (j < conversation.userMessages.length) {
                    const userMessage = await client.query(`
                        INSERT INTO user_chats (
                            id, sender_id, sender_type, receiver_id, receiver_type,
                            message_text, message_type, is_read, created_at, updated_at
                        ) VALUES (
                            gen_random_uuid(), $1, 'user', $2, 'employee',
                            $3, 'text', true, NOW() - INTERVAL '${maxMessages - j} hours', NOW()
                        ) RETURNING id, message_text, created_at
                    `, [user.id, employee.id, conversation.userMessages[j]]);
                    
                    console.log(`   👤 ${user.username}: ${conversation.userMessages[j]}`);
                    
                    // Small delay between messages
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                // Employee response
                if (j < conversation.employeeMessages.length) {
                    const employeeMessage = await client.query(`
                        INSERT INTO user_chats (
                            id, sender_id, sender_type, receiver_id, receiver_type,
                            message_text, message_type, is_read, created_at, updated_at
                        ) VALUES (
                            gen_random_uuid(), $1, 'employee', $2, 'user',
                            $3, 'text', false, NOW() - INTERVAL '${maxMessages - j - 0.5} hours', NOW()
                        ) RETURNING id, message_text, created_at
                    `, [employee.id, user.id, conversation.employeeMessages[j]]);
                    
                    console.log(`   👩‍💼 ${employee.name}: ${conversation.employeeMessages[j]}`);
                    
                    // Small delay between messages
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
        }
        
        // Add some unread messages from users
        console.log('\n📩 Adding some unread messages from users...');
        
        const unreadMessages = [
            "Salom, hali javob kutmoqdaman",
            "Iltimos tezroq javob bering",
            "Vaqt o'zgartirishim kerak",
            "Bron bekor qilishim mumkinmi?",
            "Qo'shimcha savolim bor"
        ];
        
        for (let i = 0; i < Math.min(unreadMessages.length, usersResult.rows.length); i++) {
            const user = usersResult.rows[i];
            const message = unreadMessages[i];
            
            await client.query(`
                INSERT INTO user_chats (
                    id, sender_id, sender_type, receiver_id, receiver_type,
                    message_text, message_type, is_read, created_at, updated_at
                ) VALUES (
                    gen_random_uuid(), $1, 'user', $2, 'employee',
                    $3, 'text', false, NOW() - INTERVAL '${Math.floor(Math.random() * 5)} minutes', NOW()
                )
            `, [user.id, employee.id, message]);
            
            console.log(`   📩 Unread from ${user.username}: ${message}`);
        }
        
        // Get conversation summary
        const summaryResult = await client.query(`
            SELECT 
                COUNT(*) as total_messages,
                COUNT(CASE WHEN is_read = false AND receiver_type = 'employee' THEN 1 END) as unread_for_employee,
                COUNT(DISTINCT CASE WHEN sender_type = 'user' THEN sender_id WHEN receiver_type = 'user' THEN receiver_id END) as unique_users
            FROM user_chats 
            WHERE (sender_type = 'employee' AND sender_id = $1) 
               OR (receiver_type = 'employee' AND receiver_id = $1)
        `, [employee.id]);
        
        const summary = summaryResult.rows[0];
        
        console.log('\n📊 CONVERSATION SUMMARY:');
        console.log(`   Total messages: ${summary.total_messages}`);
        console.log(`   Unread messages for employee: ${summary.unread_for_employee}`);
        console.log(`   Unique users in conversations: ${summary.unique_users}`);
        
        console.log('\n🎉 Production conversations created successfully!');
        console.log('💡 You can now test the admin panel chat interface');
        console.log(`🔑 Login with employee1_1 credentials to see the conversations`);
        
    } catch (error) {
        console.error('❌ Error creating conversations:', error);
    } finally {
        await client.end();
    }
}

createConversations();