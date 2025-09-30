const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debugAdminLogin() {
    try {
        console.log('🔍 Admin login muammosini tekshirish...\n');
        
        // Barcha adminlarni ko'rish
        const adminsQuery = `
            SELECT id, username, password, salon_id, created_at
            FROM admins 
            ORDER BY username;
        `;
        
        const adminsResult = await pool.query(adminsQuery);
        console.log('👥 Mavjud adminlar:');
        console.log('='.repeat(80));
        
        adminsResult.rows.forEach((admin, index) => {
            console.log(`${index + 1}. Admin: ${admin.username}`);
            console.log(`   ID: ${admin.id}`);
            console.log(`   Salon ID: ${admin.salon_id}`);
            console.log(`   Password hash: ${admin.password.substring(0, 20)}...`);
            console.log(`   Created: ${admin.created_at}`);
            console.log('');
        });
        
        // Test login credentials
        const testCredentials = [
            { username: 'admin1', password: 'admin123' },
            { username: 'admin2', password: 'admin123' },
            { username: 'admin', password: 'admin123' },
            { username: 'admin1', password: 'password123' },
            { username: 'admin2', password: 'password123' }
        ];
        
        console.log('🧪 Login test qilish:');
        console.log('='.repeat(80));
        
        for (const cred of testCredentials) {
            console.log(`\n🔐 Test: ${cred.username} / ${cred.password}`);
            
            // Admin topish
            const adminQuery = 'SELECT * FROM admins WHERE username = $1';
            const adminResult = await pool.query(adminQuery, [cred.username]);
            
            if (adminResult.rows.length === 0) {
                console.log(`❌ Admin topilmadi: ${cred.username}`);
                continue;
            }
            
            const admin = adminResult.rows[0];
            console.log(`✅ Admin topildi: ${admin.username}`);
            
            // Password tekshirish
            try {
                const isPasswordValid = await bcrypt.compare(cred.password, admin.password);
                console.log(`🔑 Password to'g'ri: ${isPasswordValid}`);
                
                if (isPasswordValid) {
                    console.log(`🎉 MUVAFFAQIYATLI LOGIN: ${cred.username} / ${cred.password}`);
                    
                    // Salon ma'lumotlarini olish
                    const salonQuery = 'SELECT name FROM salons WHERE id = $1';
                    const salonResult = await pool.query(salonQuery, [admin.salon_id]);
                    
                    if (salonResult.rows.length > 0) {
                        console.log(`🏢 Salon: ${salonResult.rows[0].name}`);
                    }
                }
            } catch (bcryptError) {
                console.log(`❌ Bcrypt xatosi: ${bcryptError.message}`);
            }
        }
        
        // Password hash yaratish (test uchun)
        console.log('\n🔧 Test password hash yaratish:');
        console.log('='.repeat(80));
        
        const testPassword = 'admin123';
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(testPassword, saltRounds);
        console.log(`Password: ${testPassword}`);
        console.log(`Hash: ${hashedPassword}`);
        
        // Hash tekshirish
        const isValid = await bcrypt.compare(testPassword, hashedPassword);
        console.log(`Hash tekshiruvi: ${isValid}`);
        
    } catch (error) {
        console.error('❌ Xatolik yuz berdi:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        await pool.end();
    }
}

debugAdminLogin();