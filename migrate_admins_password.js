const { pool } = require('./config/database');

async function migrateAdminsPassword() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Admins jadvalini yangilash...');
        
        // Begin transaction
        await client.query('BEGIN');
        
        // Check if password column exists
        const passwordColumn = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'admins' 
            AND column_name = 'password'
        `);
        
        // Check if password_hash column exists
        const passwordHashColumn = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'admins' 
            AND column_name = 'password_hash'
        `);
        
        if (passwordColumn.rows.length > 0 && passwordHashColumn.rows.length === 0) {
            console.log('📝 password ustunini password_hash ga o\'zgartirish...');
            
            // Rename password column to password_hash
            await client.query(`
                ALTER TABLE admins 
                RENAME COLUMN password TO password_hash
            `);
            
            console.log('✅ password ustuni password_hash ga o\'zgartirildi');
        } else if (passwordHashColumn.rows.length > 0) {
            console.log('✅ password_hash ustuni allaqachon mavjud');
        } else {
            console.log('⚠️ Noma\'lum holat: password va password_hash ustunlari topilmadi');
        }
        
        // Commit transaction
        await client.query('COMMIT');
        console.log('✅ Migration muvaffaqiyatli yakunlandi');
        
    } catch (error) {
        // Rollback on error
        await client.query('ROLLBACK');
        console.error('❌ Migration xatosi:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run migration
migrateAdminsPassword()
    .then(() => {
        console.log('🎉 Admins jadval migration yakunlandi!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Migration xatosi:', error);
        process.exit(1);
    });