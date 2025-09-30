require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkAdmin1() {
    try {
        console.log('🔍 Checking admin1 in PostgreSQL database...');
        
        // Check admin1 details
        const result = await pool.query('SELECT * FROM admins WHERE username = $1', ['admin1']);
        
        if (result.rows.length === 0) {
            console.log('❌ admin1 not found in PostgreSQL database');
        } else {
            const admin = result.rows[0];
            console.log('✅ admin1 found in PostgreSQL database:');
            console.log('  - ID:', admin.id);
            console.log('  - Username:', admin.username);
            console.log('  - Email:', admin.email);
            console.log('  - Role:', admin.role);
            console.log('  - Is Active:', admin.is_active);
            console.log('  - Password Hash (first 20 chars):', admin.password_hash.substring(0, 20) + '...');
            console.log('  - Created At:', admin.created_at);
            console.log('  - Updated At:', admin.updated_at);
            
            // Test password verification
            console.log('\n🔐 Testing password verification:');
            const isValid1 = await bcrypt.compare('admin123', admin.password_hash);
            const isValid2 = await bcrypt.compare('admin1', admin.password_hash);
            
            console.log('  - Password "admin123" valid:', isValid1);
            console.log('  - Password "admin1" valid:', isValid2);
            
            // Generate a new hash for comparison
            const newHash = await bcrypt.hash('admin123', 10);
            console.log('\n🆕 New hash for "admin123":', newHash.substring(0, 20) + '...');
            const testNewHash = await bcrypt.compare('admin123', newHash);
            console.log('  - New hash verification:', testNewHash);
        }
        
    } catch (error) {
        console.error('❌ Error checking admin1:', error);
    } finally {
        await pool.end();
    }
}

checkAdmin1();