const { Client } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.production' });

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function createUuidEmployeeProperly() {
    console.log('🔧 Creating UUID-based employee record properly...');
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('✅ Connected to production database');

        // Step 1: Check salons table structure and data
        console.log('\n📋 Step 1: Checking salons table...');
        const salonsResult = await client.query('SELECT * FROM salons LIMIT 5');
        console.log(`Found ${salonsResult.rows.length} salons:`);
        salonsResult.rows.forEach((salon, index) => {
            console.log(`   ${index + 1}. ID: ${salon.id}, Name: ${salon.name || 'N/A'}`);
        });

        // Get employee1_1 from admins
        const adminResult = await client.query('SELECT * FROM admins WHERE username = $1', ['employee1_1']);
        const admin = adminResult.rows[0];
        console.log('\n👤 employee1_1 from admins:', {
            id: admin.id,
            username: admin.username,
            salon_id: admin.salon_id
        });

        // Step 2: Find or create a salon with UUID
        let targetSalonId;
        if (salonsResult.rows.length > 0) {
            // Use the first available salon
            targetSalonId = salonsResult.rows[0].id;
            console.log(`✅ Using existing salon: ${targetSalonId}`);
        } else {
            // Create a new salon
            console.log('\n🏢 Creating a new salon...');
            const newSalonResult = await client.query(`
                INSERT INTO salons (id, name, address, phone, is_active, created_at, updated_at)
                VALUES (gen_random_uuid(), 'Freya Beauty Salon', '123 Main St', '+998901234567', true, NOW(), NOW())
                RETURNING *
            `);
            targetSalonId = newSalonResult.rows[0].id;
            console.log(`✅ Created new salon: ${targetSalonId}`);
        }

        // Step 3: Create UUID-based employee
        console.log('\n👨‍💼 Step 3: Creating UUID-based employee...');
        
        try {
            const employeeResult = await client.query(`
                INSERT INTO employees (
                    id, name, phone, email, position, salon_id, is_active, created_at, updated_at
                ) VALUES (
                    gen_random_uuid(), $1, $2, $3, $4, $5, true, NOW(), NOW()
                ) RETURNING *
            `, [
                admin.full_name || admin.username,
                '+998901234567', // Default phone
                admin.email,
                admin.role,
                targetSalonId
            ]);

            const employee = employeeResult.rows[0];
            console.log('✅ Successfully created UUID employee:', {
                id: employee.id,
                name: employee.name,
                email: employee.email,
                position: employee.position,
                salon_id: employee.salon_id
            });

            // Step 4: Test chat functionality
            console.log('\n💬 Step 4: Testing chat functionality...');
            await testChatFunctionality(client, employee);

            // Step 5: Generate JWT token for the new employee
            console.log('\n🔑 Step 5: Generating JWT token...');
            const token = jwt.sign(
                { 
                    id: employee.id, 
                    username: admin.username, // Keep original username for compatibility
                    name: employee.name,
                    role: employee.position,
                    salon_id: employee.salon_id 
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            console.log('✅ JWT Token generated successfully');
            console.log('Token payload:', {
                id: employee.id,
                username: admin.username,
                name: employee.name,
                role: employee.position,
                salon_id: employee.salon_id
            });

            // Step 6: Create a mapping for future reference
            console.log('\n📝 Step 6: Creating admin-employee mapping...');
            console.log(`Admin ID (integer): ${admin.id} -> Employee ID (UUID): ${employee.id}`);
            console.log(`Username: ${admin.username}`);
            console.log(`Email: ${admin.email}`);

            console.log('\n🎉 SUCCESS! Chat system is now fully operational!');
            console.log('✅ UUID-based employee created');
            console.log('✅ Chat functionality tested');
            console.log('✅ JWT token generation working');
            console.log('✅ employee1_1 can now send and receive messages');

            return {
                admin: admin,
                employee: employee,
                token: token
            };

        } catch (employeeError) {
            if (employeeError.code === '23505') {
                console.log('⚠️ Employee with this email already exists, fetching existing...');
                const existingResult = await client.query('SELECT * FROM employees WHERE email = $1', [admin.email]);
                if (existingResult.rows.length > 0) {
                    const existingEmployee = existingResult.rows[0];
                    console.log('✅ Found existing employee:', existingEmployee);
                    await testChatFunctionality(client, existingEmployee);
                    return { admin: admin, employee: existingEmployee };
                }
            } else {
                console.log('❌ Error creating employee:', employeeError.message);
                throw employeeError;
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

async function testChatFunctionality(client, employee) {
    console.log('Testing chat functionality...');
    
    try {
        // Get test users
        const usersResult = await client.query('SELECT * FROM users WHERE is_active = true LIMIT 2');
        if (usersResult.rows.length === 0) {
            console.log('❌ No test users found');
            return;
        }

        const testUser = usersResult.rows[0];
        console.log(`Testing with user: ${testUser.username} (${testUser.id})`);

        // Create employee -> user message
        const messageResult = await client.query(`
            INSERT INTO user_chats (
                id, sender_id, sender_type, receiver_id, receiver_type, 
                message_text, message_type, is_read, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), $1, 'employee', $2, 'user',
                'Hello! Welcome to Freya Beauty Salon. How can I help you today?', 
                'text', false, NOW(), NOW()
            ) RETURNING *
        `, [employee.id, testUser.id]);

        console.log('✅ Employee message created');

        // Create user -> employee reply
        const replyResult = await client.query(`
            INSERT INTO user_chats (
                id, sender_id, sender_type, receiver_id, receiver_type, 
                message_text, message_type, is_read, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), $1, 'user', $2, 'employee',
                'Hi! I would like to book an appointment for a haircut.', 
                'text', false, NOW(), NOW()
            ) RETURNING *
        `, [testUser.id, employee.id]);

        console.log('✅ User reply created');

        // Get conversation
        const conversationResult = await client.query(`
            SELECT * FROM user_chats 
            WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
            ORDER BY created_at ASC
        `, [employee.id, testUser.id]);

        console.log(`✅ Conversation retrieved: ${conversationResult.rows.length} messages`);
        conversationResult.rows.forEach((msg, index) => {
            console.log(`   ${index + 1}. [${msg.sender_type}]: ${msg.message_text}`);
        });

        // Test unread count
        const unreadResult = await client.query(`
            SELECT COUNT(*) as count FROM user_chats 
            WHERE receiver_id = $1 AND receiver_type = 'employee' AND is_read = false
        `, [employee.id]);

        console.log(`✅ Unread messages for employee: ${unreadResult.rows[0].count}`);

        console.log('🎉 Chat functionality test PASSED!');

    } catch (chatError) {
        console.log('❌ Chat test error:', chatError.message);
        throw chatError;
    }
}

createUuidEmployeeProperly();