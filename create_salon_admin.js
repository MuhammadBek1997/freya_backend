const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createSalonAdmin() {
    try {
        const salonId = 'b02f3c03-f063-4b03-b559-be2b0258f9df';
        
        console.log('🔧 Salon admin yaratish boshlandi...');
        console.log('Salon ID:', salonId);

        // Salon mavjudligini tekshirish
        const salonCheck = await pool.query('SELECT * FROM salons WHERE id = $1', [salonId]);
        
        if (salonCheck.rows.length === 0) {
            console.log('❌ Salon topilmadi!');
            return;
        }

        const salon = salonCheck.rows[0];
        console.log('✅ Salon topildi:', salon.salon_name);

        // Bu salon uchun admin mavjudligini tekshirish
        const adminCheck = await pool.query('SELECT * FROM admins WHERE salon_id = $1', [salonId]);
        
        if (adminCheck.rows.length > 0) {
            console.log('✅ Bu salon uchun admin allaqachon mavjud:');
            adminCheck.rows.forEach((admin, index) => {
                console.log(`\nAdmin ${index + 1}:`);
                console.log('   Username:', admin.username);
                console.log('   Email:', admin.email);
                console.log('   Full Name:', admin.full_name);
                console.log('   Role:', admin.role);
                console.log('   Faol:', admin.is_active ? 'Ha' : 'Yo\'q');
                console.log('   Yaratilgan:', admin.created_at);
            });
            
            console.log('\n🔐 LOGIN MA\'LUMOTLARI:');
            console.log('   Username:', adminCheck.rows[0].username);
            console.log('   Password: [Parol hash qilingan, yangi parol o\'rnatish kerak]');
            
            return;
        }

        // Yangi admin yaratish
        const username = `salon_${salon.salon_name.toLowerCase().replace(/\s+/g, '_')}_admin`;
        const email = `admin_${salonId.substring(0, 8)}@freya.uz`;
        const password = `salon${salonId.substring(0, 8)}`;
        const hashedPassword = await bcrypt.hash(password, 10);

        const adminResult = await pool.query(`
            INSERT INTO admins (username, email, password_hash, full_name, role, salon_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [username, email, hashedPassword, `${salon.salon_name} Administrator`, 'admin', salonId]);

        console.log('✅ Yangi admin yaratildi!');
        console.log('\n🔐 LOGIN MA\'LUMOTLARI:');
        console.log('   Username:', username);
        console.log('   Password:', password);
        console.log('   Email:', email);
        console.log('   Admin ID:', adminResult.rows[0].id);

    } catch (error) {
        console.error('❌ Xatolik yuz berdi:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

createSalonAdmin();