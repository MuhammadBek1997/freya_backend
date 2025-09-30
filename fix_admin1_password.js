const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

async function fixAdmin1Password() {
    try {
        const db = new sqlite3.Database('./database.sqlite');
        
        console.log('Fixing admin1 password...');
        
        // First, check current hash
        db.get("SELECT password_hash FROM admins WHERE username = 'admin1'", (err, row) => {
            if (err) {
                console.error('Database error:', err);
                return;
            }
            
            if (row) {
                console.log('Current hash:', row.password_hash);
                
                // Generate new hash for 'admin123'
                const newHash = bcrypt.hashSync('admin123', 10);
                console.log('New hash for admin123:', newHash);
                
                // Update the password
                db.run("UPDATE admins SET password_hash = ? WHERE username = 'admin1'", [newHash], function(err) {
                    if (err) {
                        console.error('Update error:', err);
                        return;
                    }
                    
                    console.log('Password updated successfully');
                    
                    // Verify the update
                    db.get("SELECT password_hash FROM admins WHERE username = 'admin1'", (err, updatedRow) => {
                        if (err) {
                            console.error('Verification error:', err);
                            return;
                        }
                        
                        console.log('Updated hash:', updatedRow.password_hash);
                        
                        // Test the new hash
                        const isValid = bcrypt.compareSync('admin123', updatedRow.password_hash);
                        console.log('New hash validation with admin123:', isValid);
                        
                        db.close();
                    });
                });
            } else {
                console.log('Admin1 not found');
                db.close();
            }
        });
        
    } catch (error) {
        console.error('Error:', error);
    }
}

fixAdmin1Password();