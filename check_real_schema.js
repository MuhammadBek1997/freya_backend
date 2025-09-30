const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');

console.log('🔍 Checking real database schema...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
        return;
    }
    console.log('✅ Connected to SQLite database');
});

// Check admins table schema
db.all("PRAGMA table_info(admins)", (err, rows) => {
    if (err) {
        console.error('❌ Schema query error:', err.message);
    } else {
        console.log('📋 Admins table columns:');
        rows.forEach(row => {
            console.log(`  - ${row.name}: ${row.type} (nullable: ${!row.notnull}, default: ${row.dflt_value})`);
        });
    }
    
    // Check admin2 specifically
    db.get("SELECT * FROM admins WHERE username = ?", ['admin2'], (err, row) => {
        if (err) {
            console.error('❌ admin2 query error:', err.message);
        } else if (row) {
            console.log('\n👤 admin2 current data:');
            Object.keys(row).forEach(key => {
                console.log(`  ${key}: ${row[key]}`);
            });
        } else {
            console.log('\n❌ admin2 not found');
        }
        db.close();
    });
});