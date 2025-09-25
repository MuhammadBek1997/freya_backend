const { pool } = require('./config/database');
const bcrypt = require('bcrypt');

async function createAdmin1() {
    try {
        console.log('Admin1 foydalanuvchisini yaratish...');
        
        // Avval mavjudligini tekshirish
        const existingAdmin = await pool.query(
            'SELECT id, username FROM admins WHERE username = $1',
            ['admin1']
        );
        
        if (existingAdmin.rows.length > 0) {
            console.log('admin1 allaqachon mavjud:', existingAdmin.rows[0]);
            
            // Password'ni yangilash
            const hashedPassword = await bcrypt.hash('admin1123', 10);
            await pool.query(
                'UPDATE admins SET password_hash = $1, updated_at = NOW() WHERE username = $2',
                [hashedPassword, 'admin1']
            );
            console.log('admin1 password yangilandi');
        } else {
            // Yangi admin yaratish
            const hashedPassword = await bcrypt.hash('admin1123', 10);
            
            const result = await pool.query(
                `INSERT INTO admins (username, email, password_hash, full_name, role, is_active, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
                 RETURNING id, username, email, full_name, role`,
                ['admin1', 'admin1@freya.uz', hashedPassword, 'Admin User 1', 'admin', true]
            );
            
            console.log('Yangi admin yaratildi:', result.rows[0]);
        }
        
        // Barcha adminlarni ko'rsatish
        const allAdmins = await pool.query(
            'SELECT id, username, email, full_name, role, is_active, created_at FROM admins ORDER BY created_at'
        );
        
        console.log('\nBarcha adminlar:');
        allAdmins.rows.forEach(admin => {
            console.log(`- ${admin.username} (${admin.role}) - ${admin.is_active ? 'Active' : 'Inactive'}`);
        });
        
    } catch (error) {
        console.error('Xato:', error);
    } finally {
        await pool.end();
    }
}

createAdmin1();