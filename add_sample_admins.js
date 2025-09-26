require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Production database connection
const pool = new Pool({
    connectionString: 'postgres://uab908oh973b26:p56ddf6329de8d93abf0e7a3eefe45d1879ec32502036a51c391715d124b133f3@cduf3or326qj7m.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d4gg4be05g458l',
    ssl: { rejectUnauthorized: false }
});

async function addSampleAdmins() {
    try {
        console.log('🔗 Connecting to production database...');
        
        // Test connection
        await pool.query('SELECT NOW()');
        console.log('✅ Connected to production database');

        // Check existing admins
        const existingAdmins = await pool.query('SELECT * FROM admins');
        console.log(`📊 Current admins count: ${existingAdmins.rows.length}`);

        if (existingAdmins.rows.length > 0) {
            console.log('Existing admins:');
            existingAdmins.rows.forEach(admin => {
                console.log(`- ID: ${admin.id}, Username: ${admin.username}, Salon ID: ${admin.salon_id}`);
            });
        }

        // Get salons to assign to admins
        const salons = await pool.query('SELECT id, name FROM salons ORDER BY id LIMIT 5');
        console.log(`📊 Available salons: ${salons.rows.length}`);

        // Create sample admins for each salon
        const sampleAdmins = [
            {
                username: 'admin1',
                email: 'admin1@freya.uz',
                password: 'admin123',
                full_name: 'Admin Beauty Palace',
                salon_id: salons.rows[0]?.id || 1
            },
            {
                username: 'admin2', 
                email: 'admin2@freya.uz',
                password: 'admin123',
                full_name: 'Admin Luxury Spa',
                salon_id: salons.rows[1]?.id || 2
            },
            {
                username: 'admin3',
                email: 'admin3@freya.uz', 
                password: 'admin123',
                full_name: 'Admin Private Luxury',
                salon_id: salons.rows[2]?.id || 3
            },
            {
                username: 'admin4',
                email: 'admin4@freya.uz',
                password: 'admin123', 
                full_name: 'Admin Elite Beauty',
                salon_id: salons.rows[3]?.id || 4
            },
            {
                username: 'admin5',
                email: 'admin5@freya.uz',
                password: 'admin123',
                full_name: 'Admin Royal Salon',
                salon_id: salons.rows[4]?.id || 5
            }
        ];

        console.log('📝 Adding sample admins...');
        
        for (const admin of sampleAdmins) {
            // Check if admin already exists
            const existingAdmin = await pool.query(
                'SELECT id FROM admins WHERE username = $1 OR email = $2',
                [admin.username, admin.email]
            );

            if (existingAdmin.rows.length > 0) {
                console.log(`⚠️ Admin ${admin.username} already exists, skipping...`);
                continue;
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(admin.password, 10);

            // Insert admin
            const result = await pool.query(`
                INSERT INTO admins (username, email, password_hash, full_name, salon_id)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, username, salon_id
            `, [admin.username, admin.email, hashedPassword, admin.full_name, admin.salon_id]);

            console.log(`✅ Created admin: ${result.rows[0].username} (ID: ${result.rows[0].id}, Salon ID: ${result.rows[0].salon_id})`);
        }

        // Show final admin list
        const finalAdmins = await pool.query('SELECT id, username, full_name, salon_id FROM admins ORDER BY id');
        console.log('\n=== Final Admins List ===');
        finalAdmins.rows.forEach(admin => {
            console.log(`- ID: ${admin.id}, Username: ${admin.username}, Full Name: ${admin.full_name}, Salon ID: ${admin.salon_id}`);
        });

    } catch (error) {
        console.error('❌ Error adding sample admins:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run the function
addSampleAdmins()
    .then(() => {
        console.log('✅ Sample admins addition completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Failed to add sample admins:', error);
        process.exit(1);
    });