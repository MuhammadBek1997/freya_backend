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

async function fixAdmin1Password() {
    try {
        console.log('🔧 Fixing admin1 password in PostgreSQL database...');
        
        // Check if admin1 exists
        const checkAdmin = await pool.query('SELECT * FROM admins WHERE username = $1', ['admin1']);
        
        if (checkAdmin.rows.length === 0) {
            console.log('❌ admin1 not found in PostgreSQL database');
            
            // Create admin1 if not exists
            console.log('📝 Creating admin1 in PostgreSQL database...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            await pool.query(`
                INSERT INTO admins (username, email, password_hash, full_name, role) 
                VALUES ($1, $2, $3, $4, $5)
            `, ['admin1', 'admin1@freya.com', hashedPassword, 'Admin One', 'admin']);
            
            console.log('✅ admin1 created successfully in PostgreSQL');
        } else {
            console.log('✅ admin1 found in PostgreSQL database');
            console.log('Current admin1 data:');
            console.log('  - ID:', checkAdmin.rows[0].id);
            console.log('  - Username:', checkAdmin.rows[0].username);
            console.log('  - Email:', checkAdmin.rows[0].email);
            console.log('  - Role:', checkAdmin.rows[0].role);
            
            // Update password
            console.log('🔄 Updating admin1 password...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            await pool.query(
                'UPDATE admins SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE username = $2',
                [hashedPassword, 'admin1']
            );
            
            console.log('✅ admin1 password updated successfully');
        }
        
        // Verify the password
        console.log('🔍 Verifying password...');
        const verifyAdmin = await pool.query('SELECT * FROM admins WHERE username = $1', ['admin1']);
        
        if (verifyAdmin.rows.length > 0) {
            const admin = verifyAdmin.rows[0];
            const isPasswordValid = await bcrypt.compare('admin123', admin.password_hash);
            
            console.log('Password verification result:', isPasswordValid);
            
            if (isPasswordValid) {
                console.log('✅ Password verification successful! admin1 can now login with "admin123"');
            } else {
                console.log('❌ Password verification failed');
            }
        }
        
    } catch (error) {
        console.error('❌ Error fixing admin1 password:', error);
    } finally {
        await pool.end();
    }
}

fixAdmin1Password();