const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.production' });

async function createTestUsers() {
    console.log('👥 Creating test users in production database...');
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('✅ Connected to production database');

        // Test users to create
        const testUsers = [
            {
                phone: '+998901234567',
                email: 'user1@test.com',
                username: 'test_user_1',
                password: 'password123'
            },
            {
                phone: '+998901234568',
                email: 'user2@test.com', 
                username: 'test_user_2',
                password: 'password123'
            },
            {
                phone: '+998901234569',
                email: 'user3@test.com',
                username: 'test_user_3', 
                password: 'password123'
            }
        ];

        console.log(`\n📝 Creating ${testUsers.length} test users...`);

        for (const userData of testUsers) {
            try {
                // Hash the password
                const passwordHash = await bcrypt.hash(userData.password, 10);

                // Check if user already exists
                const existingUser = await client.query(
                    'SELECT id FROM users WHERE phone = $1 OR email = $2',
                    [userData.phone, userData.email]
                );

                if (existingUser.rows.length > 0) {
                    console.log(`⚠️ User with phone ${userData.phone} already exists, skipping...`);
                    continue;
                }

                // Insert the user
                const insertResult = await client.query(`
                    INSERT INTO users (
                        id, phone, email, password_hash, username, 
                        registration_step, is_verified, is_active, 
                        created_at, updated_at
                    ) VALUES (
                        gen_random_uuid(), $1, $2, $3, $4, 
                        3, true, true, 
                        NOW(), NOW()
                    ) RETURNING id, phone, email, username
                `, [userData.phone, userData.email, passwordHash, userData.username]);

                const newUser = insertResult.rows[0];
                console.log(`✅ Created user: ${newUser.username} (${newUser.phone}) - ID: ${newUser.id}`);

            } catch (userError) {
                console.log(`❌ Error creating user ${userData.username}:`, userError.message);
            }
        }

        // Verify users were created
        console.log('\n📊 Verifying created users...');
        const allUsers = await client.query('SELECT id, phone, email, username, is_active FROM users ORDER BY created_at DESC');
        
        console.log(`Total users in database: ${allUsers.rows.length}`);
        if (allUsers.rows.length > 0) {
            console.log('Users:');
            allUsers.rows.forEach(user => {
                console.log(`   - ${user.username || 'No username'} (${user.phone}) - Active: ${user.is_active}`);
            });
        }

        console.log('\n✅ Test users creation completed!');

    } catch (error) {
        console.error('❌ Error creating test users:', error);
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

createTestUsers();