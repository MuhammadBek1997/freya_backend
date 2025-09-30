const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking local database for employee1_1...');

// Check employees table
db.all("SELECT * FROM employees WHERE username = 'employee1_1'", (err, rows) => {
    if (err) {
        console.error('Error checking employees:', err);
    } else {
        console.log('Employees with username employee1_1:', rows);
    }
    
    // Check admins table if it exists
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='admins'", (err, tables) => {
        if (err) {
            console.error('Error checking tables:', err);
        } else if (tables.length > 0) {
            db.all("SELECT * FROM admins WHERE username = 'employee1_1'", (err, adminRows) => {
                if (err) {
                    console.error('Error checking admins:', err);
                } else {
                    console.log('Admins with username employee1_1:', adminRows);
                }
                db.close();
            });
        } else {
            console.log('No admins table found in local database');
            db.close();
        }
    });
});