const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');

console.log('🔍 Checking admin2 status in database...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
        return;
    }
    console.log('✅ Connected to SQLite database');
});

// Check admin2 details
db.get("SELECT * FROM admins WHERE username = ?", ['admin2'], (err, row) => {
    if (err) {
        console.error('❌ Query error:', err.message);
    } else if (row) {
        console.log('✅ admin2 found:');
        console.log('  - ID:', row.id);
        console.log('  - Username:', row.username);
        console.log('  - Password:', row.password);
        console.log('  - Role:', row.role);
        console.log('  - Salon ID:', row.salon_id);
        console.log('  - Is Active:', row.is_active);
        console.log('  - Full Name:', row.full_name);
        console.log('  - Email:', row.email);
    } else {
        console.log('❌ admin2 not found in database');
    }
    
    db.close();
});