const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');

console.log('=== UPDATING ADMIN2 ROLE TO PRIVATE_SALON_ADMIN ===\n');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
        return;
    }
    console.log('✅ Connected to SQLite database');
});

// Check current admin2 role
db.get('SELECT id, username, role FROM admins WHERE username = ?', ['admin2'], (err, row) => {
    if (err) {
        console.error('❌ Error checking admin2:', err.message);
        return;
    }
    
    if (!row) {
        console.log('❌ Admin2 not found');
        return;
    }
    
    console.log('Current admin2 data:');
    console.log(`- ID: ${row.id}`);
    console.log(`- Username: ${row.username}`);
    console.log(`- Current Role: ${row.role}\n`);
    
    // Update role to private_salon_admin
    db.run('UPDATE admins SET role = ? WHERE username = ?', ['private_salon_admin', 'admin2'], function(err) {
        if (err) {
            console.error('❌ Error updating admin2 role:', err.message);
            return;
        }
        
        console.log('✅ Admin2 role updated successfully!');
        console.log(`Changes made: ${this.changes}\n`);
        
        // Verify the update
        db.get('SELECT id, username, role FROM admins WHERE username = ?', ['admin2'], (err, updatedRow) => {
            if (err) {
                console.error('❌ Error verifying update:', err.message);
                return;
            }
            
            console.log('Updated admin2 data:');
            console.log(`- ID: ${updatedRow.id}`);
            console.log(`- Username: ${updatedRow.username}`);
            console.log(`- New Role: ${updatedRow.role}`);
            
            if (updatedRow.role === 'private_salon_admin') {
                console.log('\n🎉 Role successfully updated to private_salon_admin!');
            } else {
                console.log('\n❌ Role update failed!');
            }
            
            db.close();
        });
    });
});