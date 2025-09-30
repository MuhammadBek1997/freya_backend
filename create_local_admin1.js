const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

async function createLocalAdmin1() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Database connection error:', err);
                reject(err);
                return;
            }
            console.log('Connected to SQLite database');
        });

        // Create admins table if not exists
        const createAdminsTable = `
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT NOT NULL,
                salon_id INTEGER,
                role TEXT DEFAULT 'admin',
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        db.run(createAdminsTable, async (err) => {
            if (err) {
                console.error('Error creating admins table:', err);
                reject(err);
                return;
            }
            console.log('Admins table created or already exists');

            try {
                // Hash password
                const hashedPassword = await bcrypt.hash('admin123', 10);
                
                // Insert admin1
                const insertAdmin = `
                    INSERT OR REPLACE INTO admins 
                    (username, email, password_hash, full_name, salon_id, role, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;

                db.run(insertAdmin, [
                    'admin1',
                    'admin1@freya.uz',
                    hashedPassword,
                    'Admin One',
                    1,
                    'admin',
                    1
                ], function(err) {
                    if (err) {
                        console.error('Error inserting admin1:', err);
                        reject(err);
                        return;
                    }
                    
                    console.log('Admin1 created successfully with ID:', this.lastID);
                    
                    // Verify admin1 was created
                    db.get('SELECT * FROM admins WHERE username = ?', ['admin1'], (err, row) => {
                        if (err) {
                            console.error('Error verifying admin1:', err);
                            reject(err);
                            return;
                        }
                        
                        console.log('Admin1 verification:', row);
                        db.close();
                        resolve(row);
                    });
                });
            } catch (error) {
                console.error('Error hashing password:', error);
                reject(error);
            }
        });
    });
}

createLocalAdmin1()
    .then(() => {
        console.log('✅ Admin1 created successfully');
    })
    .catch((error) => {
        console.error('❌ Error creating admin1:', error);
    });