const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

async function checkCurrentAdmin() {
    try {
        const db = new sqlite3.Database('./database.sqlite');
        
        console.log('Checking current admin1 data...');
        
        db.get("SELECT * FROM admins WHERE username = 'admin1'", (err, row) => {
            if (err) {
                console.error('Database error:', err);
                return;
            }
            
            if (row) {
                console.log('Current admin1 data:', {
                    id: row.id,
                    username: row.username,
                    email: row.email,
                    password_hash: row.password_hash.substring(0, 20) + '...',
                    is_active: row.is_active,
                    salon_id: row.salon_id
                });
                
                // Test password verification
                const isValid = bcrypt.compareSync('admin123', row.password_hash);
                console.log('Password "admin123" is valid:', isValid);
                
                // Test with different password
                const isValid2 = bcrypt.compareSync('admin1', row.password_hash);
                console.log('Password "admin1" is valid:', isValid2);
                
            } else {
                console.log('Admin1 not found in database');
            }
            
            db.close();
        });
        
    } catch (error) {
        console.error('Error:', error);
    }
}

checkCurrentAdmin();