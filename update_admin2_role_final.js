const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');

console.log('🔧 Updating admin2 role to private_salon_admin...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
        return;
    }
    console.log('✅ Connected to SQLite database');
});

// Update admin2 role
db.run(`UPDATE admins 
        SET role = ? 
        WHERE username = ?`, 
        ['private_salon_admin', 'admin2'], 
        function(err) {
            if (err) {
                console.error('❌ Update error:', err.message);
            } else {
                console.log('✅ admin2 role updated successfully');
                
                // Verify the update
                db.get("SELECT username, role, password_hash, salon_id FROM admins WHERE username = ?", ['admin2'], (err, row) => {
                    if (err) {
                        console.error('❌ Verification error:', err.message);
                    } else if (row) {
                        console.log('✅ Verification - admin2 updated:');
                        console.log('  - Username:', row.username);
                        console.log('  - Role:', row.role);
                        console.log('  - Password hash exists:', !!row.password_hash);
                        console.log('  - Salon ID:', row.salon_id);
                    }
                    db.close();
                });
            }
        });