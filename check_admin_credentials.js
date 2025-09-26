const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkAdminCredentials() {
    try {
        console.log('🔍 Checking admin credentials...\n');

        // Check if admins table exists
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'admins'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('❌ Admins table does not exist!');
            return;
        }

        // Get all admin credentials
        const adminsResult = await pool.query(`
            SELECT id, username, password, salon_id, created_at
            FROM admins 
            ORDER BY created_at
        `);

        if (adminsResult.rows.length === 0) {
            console.log('📭 No admin accounts found in the database.');
            return;
        }

        console.log(`📊 Found ${adminsResult.rows.length} admin account(s):\n`);

        // Display admin credentials
        adminsResult.rows.forEach((admin, index) => {
            console.log(`👤 Admin ${index + 1}:`);
            console.log(`   ID: ${admin.id}`);
            console.log(`   Username: ${admin.username}`);
            console.log(`   Password: ${admin.password}`);
            console.log(`   Salon ID: ${admin.salon_id || 'Not assigned'}`);
            console.log(`   Created: ${admin.created_at}`);
            console.log('');
        });

        // Also check if there are any salons to assign admins to
        const salonsResult = await pool.query(`
            SELECT id, name FROM salons ORDER BY created_at
        `);

        console.log(`🏢 Available salons (${salonsResult.rows.length}):`);
        salonsResult.rows.forEach((salon, index) => {
            console.log(`   ${index + 1}. ${salon.name} (ID: ${salon.id})`);
        });

        console.log('\n✅ Admin credentials check completed!');

    } catch (error) {
        console.error('❌ Error checking admin credentials:', error);
    } finally {
        await pool.end();
    }
}

checkAdminCredentials();