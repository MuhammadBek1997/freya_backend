const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./database.db');

console.log('=== DATABASE TABLES CHECK ===\n');

// First check what tables exist
db.all(`SELECT name FROM sqlite_master WHERE type='table'`, (err, tables) => {
    if (err) {
        console.error('Error fetching tables:', err);
        return;
    }
    
    console.log('Available tables:');
    tables.forEach(table => {
        console.log('- ' + table.name);
    });
    
    // Check if admins table exists
    const hasAdmins = tables.some(table => table.name === 'admins');
    const hasEmployees = tables.some(table => table.name === 'employees');
    
    console.log('\n=== TABLE STATUS ===');
    console.log('Admins table exists:', hasAdmins ? '✅' : '❌');
    console.log('Employees table exists:', hasEmployees ? '✅' : '❌');
    
    if (hasAdmins) {
        // Check admin2 in admins table
        db.get(`SELECT * FROM admins WHERE username = 'admin2'`, (err, admin) => {
            if (err) {
                console.error('Error fetching admin2 from admins:', err);
            } else if (admin) {
                console.log('\n✅ Admin2 found in admins table:');
                console.log('- Username:', admin.username);
                console.log('- Role:', admin.role);
                console.log('- Password Hash:', admin.password_hash ? 'EXISTS' : 'MISSING');
            } else {
                console.log('\n❌ Admin2 not found in admins table');
            }
            
            checkEmployeesTable();
        });
    } else {
        checkEmployeesTable();
    }
    
    function checkEmployeesTable() {
        if (hasEmployees) {
            // Check admin2 in employees table
            db.get(`SELECT * FROM employees WHERE username = 'admin2'`, (err, employee) => {
                if (err) {
                    console.error('Error fetching admin2 from employees:', err);
                } else if (employee) {
                    console.log('\n✅ Admin2 found in employees table:');
                    console.log('- Username:', employee.username);
                    console.log('- Role:', employee.role);
                    console.log('- Password Hash:', employee.password_hash ? 'EXISTS' : 'MISSING');
                    
                    // Test password if found
                    if (employee.password_hash) {
                        bcrypt.compare('admin2123', employee.password_hash, (err, result) => {
                            if (err) {
                                console.error('❌ Bcrypt error:', err);
                            } else {
                                console.log('Password verification:', result ? '✅ CORRECT' : '❌ INCORRECT');
                            }
                            db.close();
                        });
                    } else {
                        db.close();
                    }
                } else {
                    console.log('\n❌ Admin2 not found in employees table either');
                    db.close();
                }
            });
        } else {
            console.log('\n❌ Neither admins nor employees table found!');
            db.close();
        }
    }
});