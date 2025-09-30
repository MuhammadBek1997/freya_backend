const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');

console.log('🔧 Fixing admin1 password in database.db...');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
        return;
    }
    console.log('✅ Connected to database.db');
});

async function fixAdmin1Password() {
    try {
        // Generate new hash for admin123
        const newHash = await bcrypt.hash('admin123', 10);
        console.log('🔐 Generated new hash for "admin123"');
        
        // Update admin1 password
        db.run(
            'UPDATE admins SET password_hash = ? WHERE username = ?',
            [newHash, 'admin1'],
            function(err) {
                if (err) {
                    console.error('❌ Update error:', err.message);
                } else {
                    console.log('✅ admin1 password updated successfully in database.db');
                    console.log('  - Rows affected:', this.changes);
                    
                    // Verify the update
                    db.get("SELECT * FROM admins WHERE username = ?", ['admin1'], async (err, row) => {
                        if (err) {
                            console.error('❌ Verification error:', err.message);
                        } else if (row) {
                            console.log('✅ Verification - admin1 updated:');
                            console.log('  - Username:', row.username);
                            console.log('  - Email:', row.email);
                            console.log('  - New hash (first 20 chars):', row.password_hash.substring(0, 20) + '...');
                            
                            // Test password verification
                            try {
                                const isValid = await bcrypt.compare('admin123', row.password_hash);
                                console.log('  - Password "admin123" verification:', isValid);
                            } catch (error) {
                                console.error('❌ Password verification error:', error);
                            }
                        }
                        db.close();
                    });
                }
            }
        );
        
    } catch (error) {
        console.error('❌ Error generating hash:', error);
        db.close();
    }
}

fixAdmin1Password();