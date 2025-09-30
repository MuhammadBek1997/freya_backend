const { Pool } = require('pg');

// Production database connection
const productionPool = new Pool({
    connectionString: 'postgresql://freya_salon_user:freya_salon_password_2024@dpg-cs6aqt5umphs73e3vhog-a.oregon-postgres.render.com/freya_salon_db',
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkAdmin2Production() {
    try {
        console.log('🔍 Checking admin2 user in production database...');
        
        // Check if admin2 exists
        const adminQuery = `
            SELECT id, username, email, full_name, role, password_hash, salon_id, created_at
            FROM admins 
            WHERE username = 'admin2'
        `;
        
        const result = await productionPool.query(adminQuery);
        
        if (result.rows.length === 0) {
            console.log('❌ admin2 user not found in production database!');
            
            // Show all existing admins
            console.log('\n📋 All existing admins:');
            const allAdminsQuery = 'SELECT id, username, email, full_name, role, salon_id FROM admins ORDER BY username';
            const allAdmins = await productionPool.query(allAdminsQuery);
            
            allAdmins.rows.forEach((admin, index) => {
                console.log(`${index + 1}. Username: ${admin.username}, Email: ${admin.email}, Role: ${admin.role}, Salon ID: ${admin.salon_id}`);
            });
            
        } else {
            const admin2 = result.rows[0];
            console.log('✅ admin2 user found!');
            console.log('Admin2 details:');
            console.log('- ID:', admin2.id);
            console.log('- Username:', admin2.username);
            console.log('- Email:', admin2.email);
            console.log('- Full Name:', admin2.full_name);
            console.log('- Role:', admin2.role);
            console.log('- Salon ID:', admin2.salon_id);
            console.log('- Password Hash:', admin2.password_hash ? 'EXISTS' : 'NULL/UNDEFINED');
            console.log('- Created At:', admin2.created_at);
            
            if (!admin2.password_hash) {
                console.log('\n⚠️ WARNING: admin2 has no password hash!');
            }
        }
        
    } catch (error) {
        console.error('❌ Error checking admin2:', error.message);
    } finally {
        await productionPool.end();
    }
}

checkAdmin2Production();