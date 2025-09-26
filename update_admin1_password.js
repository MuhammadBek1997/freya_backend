const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Production database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function updateAdmin1Password() {
    try {
        console.log('Connecting to database...');
        
        // Hash the password
        const password = 'admin1123';
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        console.log('Password hashed successfully');
        
        // Update admin1 password
        const updateResult = await pool.query(
            'UPDATE admins SET password = $1 WHERE username = $2',
            [hashedPassword, 'admin1']
        );
        
        console.log('Update result:', updateResult.rowCount, 'rows affected');
        
        // Verify the update
        const verifyResult = await pool.query(
            'SELECT username, password FROM admins WHERE username = $1',
            ['admin1']
        );
        
        if (verifyResult.rows.length > 0) {
            console.log('Admin1 found with updated password hash');
            
            // Test password comparison
            const isValid = await bcrypt.compare(password, verifyResult.rows[0].password);
            console.log('Password verification test:', isValid ? 'PASSED' : 'FAILED');
        } else {
            console.log('Admin1 not found after update');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
        console.log('Database connection closed');
    }
}

updateAdmin1Password();