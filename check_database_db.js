const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');

console.log('🔍 Checking admin1 in database.db file...');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
        return;
    }
    console.log('✅ Connected to database.db');
});

// Check admin1 details
db.get("SELECT * FROM admins WHERE username = ?", ['admin1'], async (err, row) => {
    if (err) {
        console.error('❌ Query error:', err.message);
    } else if (row) {
        console.log('✅ admin1 found in database.db:');
        console.log('  - ID:', row.id);
        console.log('  - Username:', row.username);
        console.log('  - Email:', row.email);
        console.log('  - Password Hash (first 20 chars):', row.password_hash.substring(0, 20) + '...');
        console.log('  - Role:', row.role);
        console.log('  - Is Active:', row.is_active);
        
        // Test password verification
        try {
            const isValid1 = await bcrypt.compare('admin123', row.password_hash);
            const isValid2 = await bcrypt.compare('admin1', row.password_hash);
            
            console.log('\n🔐 Password verification:');
            console.log('  - Password "admin123" valid:', isValid1);
            console.log('  - Password "admin1" valid:', isValid2);
        } catch (error) {
            console.error('❌ Password verification error:', error);
        }
    } else {
        console.log('❌ admin1 not found in database.db');
    }
    
    db.close();
});