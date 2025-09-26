const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testAdminLogin() {
    try {
        console.log('🔍 Testing admin login functionality...\n');

        // Get all admins from database
        const adminsResult = await pool.query(`
            SELECT id, username, email, password_hash, full_name, role, salon_id, is_active
            FROM admins 
            WHERE is_active = true
            ORDER BY created_at
        `);

        if (adminsResult.rows.length === 0) {
            console.log('❌ No active admin accounts found!');
            return;
        }

        console.log(`📊 Found ${adminsResult.rows.length} active admin(s):\n`);

        // Test each admin's credentials
        for (let i = 0; i < adminsResult.rows.length; i++) {
            const admin = adminsResult.rows[i];
            console.log(`👤 Testing Admin ${i + 1}:`);
            console.log(`   Username: ${admin.username}`);
            console.log(`   Email: ${admin.email}`);
            console.log(`   Full Name: ${admin.full_name}`);
            console.log(`   Role: ${admin.role || 'admin'}`);
            console.log(`   Salon ID: ${admin.salon_id}`);
            console.log(`   Active: ${admin.is_active}`);

            // Test password verification with expected passwords
            const testPasswords = [
                `admin${i + 1}123`,  // Expected pattern from create script
                'admin123',          // Common password
                'password123',       // Another common password
                '123456'            // Simple password
            ];

            let passwordFound = false;
            for (const testPassword of testPasswords) {
                try {
                    const isValid = await bcrypt.compare(testPassword, admin.password_hash);
                    if (isValid) {
                        console.log(`   ✅ Password found: "${testPassword}"`);
                        passwordFound = true;
                        break;
                    }
                } catch (error) {
                    console.log(`   ❌ Error testing password "${testPassword}": ${error.message}`);
                }
            }

            if (!passwordFound) {
                console.log(`   ❌ No matching password found from test list`);
                console.log(`   🔍 Password hash: ${admin.password_hash.substring(0, 20)}...`);
            }

            console.log('');
        }

        // Test the authentication logic manually
        console.log('🧪 Testing authentication logic manually...\n');
        
        if (adminsResult.rows.length > 0) {
            const testAdmin = adminsResult.rows[0];
            const testPassword = `admin1123`; // Expected password for first admin
            
            console.log(`Testing login for: ${testAdmin.username}`);
            
            // Simulate the exact query from authController
            const authResult = await pool.query(
                'SELECT id, username, email, password_hash, full_name, salon_id, is_active, created_at, updated_at FROM admins WHERE username = $1 AND is_active = true',
                [testAdmin.username]
            );

            if (authResult.rows.length === 0) {
                console.log('❌ Admin not found in auth query');
            } else {
                console.log('✅ Admin found in auth query');
                
                const foundAdmin = authResult.rows[0];
                try {
                    const isValidPassword = await bcrypt.compare(testPassword, foundAdmin.password_hash);
                    console.log(`Password verification result: ${isValidPassword ? '✅ VALID' : '❌ INVALID'}`);
                    
                    if (!isValidPassword) {
                        // Try other possible passwords
                        const otherPasswords = ['admin123', 'password123', 'admin1123'];
                        for (const pwd of otherPasswords) {
                            const testResult = await bcrypt.compare(pwd, foundAdmin.password_hash);
                            if (testResult) {
                                console.log(`✅ Correct password found: "${pwd}"`);
                                break;
                            }
                        }
                    }
                } catch (error) {
                    console.log(`❌ Password comparison error: ${error.message}`);
                }
            }
        }

        console.log('\n✅ Admin login test completed!');

    } catch (error) {
        console.error('❌ Error testing admin login:', error);
    } finally {
        await pool.end();
    }
}

testAdminLogin();