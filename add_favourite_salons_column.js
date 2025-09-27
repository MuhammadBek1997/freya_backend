require('dotenv').config({ path: '.env.production' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function addFavouriteSalonsColumn() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Production database ga ulanmoqda...');
        
        // Users table mavjudligini tekshirish
        const tableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);
        
        if (!tableExists.rows[0].exists) {
            console.log('❌ Users table mavjud emas!');
            return;
        }
        
        // favourite_salons ustuni mavjudligini tekshirish
        const columnExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'users' 
                AND column_name = 'favourite_salons'
            );
        `);
        
        if (columnExists.rows[0].exists) {
            console.log('ℹ️  favourite_salons ustuni allaqachon mavjud');
        } else {
            console.log('➕ favourite_salons ustuni qo\'shilmoqda...');
            
            // JSONB tipida favourite_salons ustuni qo'shish
            await client.query(`
                ALTER TABLE users 
                ADD COLUMN favourite_salons JSONB DEFAULT '[]'
            `);
            
            console.log('✅ favourite_salons ustuni muvaffaqiyatli qo\'shildi');
        }
        
        // Yangilangan table strukturasini ko'rish
        const schema = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position;
        `);
        
        console.log('\n📋 Users table yangilangan strukturasi:');
        schema.rows.forEach(column => {
            console.log(`   ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable}, default: ${column.column_default})`);
        });
        
        // Mavjud userlar sonini ko'rish
        const userCount = await client.query('SELECT COUNT(*) FROM users');
        console.log(`\n👥 Jami userlar soni: ${userCount.rows[0].count}`);
        
        // Agar userlar mavjud bo'lsa, ularning favourite_salons qiymatini tekshirish
        if (parseInt(userCount.rows[0].count) > 0) {
            const sampleUsers = await client.query(`
                SELECT id, phone, favourite_salons 
                FROM users 
                LIMIT 3
            `);
            
            console.log('\n📋 Namuna userlar:');
            sampleUsers.rows.forEach(user => {
                console.log(`   ID: ${user.id}, Phone: ${user.phone}, Favourite Salons: ${JSON.stringify(user.favourite_salons)}`);
            });
        }
        
        console.log('\n🎉 Migration muvaffaqiyatli yakunlandi!');
        
    } catch (error) {
        console.error('❌ Migration xatosi:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

// Migration ishga tushirish
addFavouriteSalonsColumn();