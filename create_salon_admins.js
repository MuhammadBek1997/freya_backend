const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createSalonAdmins() {
    try {
        console.log('👥 Creating salon admin accounts...\n');

        // First, get all salons
        const salonsResult = await pool.query(`
            SELECT id, name FROM salons ORDER BY created_at
        `);

        if (salonsResult.rows.length === 0) {
            console.log('❌ No salons found! Please create salons first.');
            return;
        }

        console.log(`🏢 Found ${salonsResult.rows.length} salons:`);
        salonsResult.rows.forEach((salon, index) => {
            console.log(`   ${index + 1}. ${salon.name} (ID: ${salon.id})`);
        });

        // Create admin accounts for each salon
        console.log('\n👤 Creating admin accounts...\n');

        const adminAccounts = [];

        for (let i = 0; i < salonsResult.rows.length; i++) {
            const salon = salonsResult.rows[i];
            
            // Generate admin credentials
            const username = `admin${i + 1}`;
            const password = `admin${i + 1}123`;
            const email = `admin${i + 1}@freya.uz`;
            const fullName = `${salon.name} Admin`;
            
            // Hash the password
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // Insert admin into database
            const insertResult = await pool.query(`
                INSERT INTO admins (username, email, password_hash, full_name, role, salon_id, is_active)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, username, email, full_name, salon_id
            `, [username, email, passwordHash, fullName, 'admin', salon.id, true]);

            const createdAdmin = insertResult.rows[0];
            
            adminAccounts.push({
                salon_name: salon.name,
                salon_id: salon.id,
                admin_id: createdAdmin.id,
                username: username,
                password: password, // Store plain password for display
                email: email,
                full_name: fullName
            });

            console.log(`✅ Created admin for "${salon.name}"`);
            console.log(`   Username: ${username}`);
            console.log(`   Password: ${password}`);
            console.log(`   Email: ${email}`);
            console.log('');
        }

        // Display summary
        console.log('📋 ADMIN CREDENTIALS SUMMARY:');
        console.log('=' .repeat(60));
        
        adminAccounts.forEach((admin, index) => {
            console.log(`\n${index + 1}. ${admin.salon_name}:`);
            console.log(`   👤 Username: ${admin.username}`);
            console.log(`   🔑 Password: ${admin.password}`);
            console.log(`   📧 Email: ${admin.email}`);
            console.log(`   🏢 Salon ID: ${admin.salon_id}`);
        });

        console.log('\n' + '=' .repeat(60));
        console.log(`✅ Successfully created ${adminAccounts.length} admin accounts!`);
        console.log('\n⚠️  IMPORTANT: Save these credentials securely!');

    } catch (error) {
        console.error('❌ Error creating salon admins:', error);
    } finally {
        await pool.end();
    }
}

createSalonAdmins();