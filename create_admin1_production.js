const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Production database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function createAdmin1() {
    try {
        console.log('Connecting to production database...');
        
        // Hash the password
        const password = 'admin1123';
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        console.log('Password hashed successfully');
        
        // Check if admin1 already exists
        const existingResult = await pool.query(
            'SELECT username FROM admins WHERE username = $1',
            ['admin1']
        );
        
        if (existingResult.rows.length > 0) {
            console.log('Admin1 already exists, updating password...');
            
            // Update existing admin1
            const updateResult = await pool.query(
                'UPDATE admins SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE username = $2',
                [hashedPassword, 'admin1']
            );
            
            console.log('Update result:', updateResult.rowCount, 'rows affected');
        } else {
            console.log('Creating new admin1 user...');
            
            // Create new admin1
            const insertResult = await pool.query(
                `INSERT INTO admins (username, email, password_hash, full_name, role, is_active) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                ['admin1', 'admin1@freya.uz', hashedPassword, 'Admin 1', 'admin', true]
            );
            
            console.log('Insert result:', insertResult.rowCount, 'rows affected');
        }
        
        // Verify the admin1 user
        const verifyResult = await pool.query(
            'SELECT username, email, full_name, role, is_active FROM admins WHERE username = $1',
            ['admin1']
        );
        
        if (verifyResult.rows.length > 0) {
            console.log('Admin1 user verified:');
            console.log(JSON.stringify(verifyResult.rows[0], null, 2));
            
            // Test password comparison
            const admin = await pool.query(
                'SELECT password_hash FROM admins WHERE username = $1',
                ['admin1']
            );
            
            const isValid = await bcrypt.compare(password, admin.rows[0].password_hash);
            console.log('Password verification test:', isValid ? 'PASSED' : 'FAILED');
        } else {
            console.log('Admin1 not found after operation');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
        console.log('Database connection closed');
    }
}

createAdmin1();