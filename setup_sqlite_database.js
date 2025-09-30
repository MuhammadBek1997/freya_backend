const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./database.db');

console.log('=== SETTING UP SQLITE DATABASE ===\n');

// Create admins table
const createAdminsTable = `
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`;

// Create users table
const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(10),
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT 1,
    is_verified BOOLEAN DEFAULT 0,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`;

// Create salons table
const createSalonsTable = `
CREATE TABLE IF NOT EXISTS salons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    address VARCHAR(500),
    location JSON,
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(255),
    image_url VARCHAR(255),
    rating DECIMAL(3,2) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    salon_type VARCHAR(50) DEFAULT 'public',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`;

// Create employees table
const createEmployeesTable = `
CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    salon_id INTEGER,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'employee',
    specialization VARCHAR(200),
    experience_years INTEGER DEFAULT 0,
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (salon_id) REFERENCES salons(id)
)`;

// Create services table
const createServicesTable = `
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    salon_id INTEGER,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (salon_id) REFERENCES salons(id)
)`;

// Create appointments table
const createAppointmentsTable = `
CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    salon_id INTEGER,
    employee_id INTEGER,
    service_id INTEGER,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    total_price DECIMAL(10,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (salon_id) REFERENCES salons(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (service_id) REFERENCES services(id)
)`;

// Create posts table
const createPostsTable = `
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    salon_id INTEGER,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    image_url VARCHAR(255),
    video_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'published',
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (salon_id) REFERENCES salons(id)
)`;

// Create messages table
const createMessagesTable = `
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER,
    receiver_id INTEGER,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
)`;

async function setupDatabase() {
    try {
        // Create tables
        console.log('Creating admins table...');
        await new Promise((resolve, reject) => {
            db.run(createAdminsTable, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log('Creating users table...');
        await new Promise((resolve, reject) => {
            db.run(createUsersTable, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log('Creating salons table...');
        await new Promise((resolve, reject) => {
            db.run(createSalonsTable, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log('Creating employees table...');
        await new Promise((resolve, reject) => {
            db.run(createEmployeesTable, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log('Creating services table...');
        await new Promise((resolve, reject) => {
            db.run(createServicesTable, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log('Creating appointments table...');
        await new Promise((resolve, reject) => {
            db.run(createAppointmentsTable, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log('Creating posts table...');
        await new Promise((resolve, reject) => {
            db.run(createPostsTable, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log('Creating messages table...');
        await new Promise((resolve, reject) => {
            db.run(createMessagesTable, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log('\n✅ All tables created successfully!');

        // Create admin users
        console.log('\nCreating admin users...');
        
        const admin1Hash = await bcrypt.hash('admin1123', 10);
        const admin2Hash = await bcrypt.hash('admin2123', 10);

        // Insert admin1
        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO admins (username, email, password_hash, full_name, role) 
                    VALUES (?, ?, ?, ?, ?)`, 
                   ['admin1', 'admin1@freya.com', admin1Hash, 'Admin One', 'admin'], 
                   (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Insert admin2
        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO admins (username, email, password_hash, full_name, role) 
                    VALUES (?, ?, ?, ?, ?)`, 
                   ['admin2', 'admin2@freya.com', admin2Hash, 'Admin Two', 'private_admin'], 
                   (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log('✅ Admin users created successfully!');

        // Create sample salons
        console.log('\nCreating sample salons...');
        
        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO salons (name, description, address, location, phone, email, salon_type) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`, 
                   ['Beauty Salon 1', 'Professional beauty salon', 'Tashkent, Uzbekistan', 
                    '{"lat": 41.2995, "long": 69.2401}', '+998901234567', 'salon1@freya.com', 'public'], 
                   (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO salons (name, description, address, location, phone, email, salon_type) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`, 
                   ['Private Salon 2', 'Exclusive private salon', 'Samarkand, Uzbekistan', 
                    '{"lat": 39.6542, "long": 66.9597}', '+998901234568', 'salon2@freya.com', 'private'], 
                   (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log('✅ Sample salons created successfully!');

        // Verify setup
        console.log('\n=== VERIFICATION ===');
        
        db.all(`SELECT username, role FROM admins`, (err, admins) => {
            if (err) {
                console.error('Error fetching admins:', err);
            } else {
                console.log('Created admins:');
                admins.forEach(admin => {
                    console.log(`- ${admin.username} (${admin.role})`);
                });
            }
            
            db.all(`SELECT name, salon_type FROM salons`, (err, salons) => {
                if (err) {
                    console.error('Error fetching salons:', err);
                } else {
                    console.log('\nCreated salons:');
                    salons.forEach(salon => {
                        console.log(`- ${salon.name} (${salon.salon_type})`);
                    });
                }
                
                console.log('\n🎉 Database setup completed successfully!');
                db.close();
            });
        });

    } catch (error) {
        console.error('❌ Error setting up database:', error);
        db.close();
    }
}

setupDatabase();