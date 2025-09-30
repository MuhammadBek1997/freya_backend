const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');

console.log('🔧 Fixing admin2 credentials...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
        return;
    }
    console.log('✅ Connected to SQLite database');
});

async function fixAdmin2() {
    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash('admin2123', 10);
        
        // Update admin2 with proper password and salon_id
        db.run(`UPDATE admins 
                SET password = ?, salon_id = ? 
                WHERE username = ?`, 
                [hashedPassword, 2, 'admin2'], 
                function(err) {
                    if (err) {
                        console.error('❌ Update error:', err.message);
                    } else {
                        console.log('✅ admin2 credentials updated successfully');
                        console.log('  - Password: admin2123 (hashed)');
                        console.log('  - Salon ID: 2');
                        
                        // Verify the update
                        db.get("SELECT * FROM admins WHERE username = ?", ['admin2'], (err, row) => {
                            if (err) {
                                console.error('❌ Verification error:', err.message);
                            } else if (row) {
                                console.log('✅ Verification - admin2 updated:');
                                console.log('  - Username:', row.username);
                                console.log('  - Password hash exists:', !!row.password);
                                console.log('  - Role:', row.role);
                                console.log('  - Salon ID:', row.salon_id);
                                console.log('  - Is Active:', row.is_active);
                            }
                            db.close();
                        });
                    }
                });
    } catch (error) {
        console.error('❌ Error hashing password:', error);
        db.close();
    }
}

fixAdmin2();