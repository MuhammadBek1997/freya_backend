const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

// Production database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

async function deleteTestUser() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Production database ga ulanmoqda...');
        
        // Database schema'ni ko'rish
        const schemaQuery = `
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position;
        `;
        const schemaResult = await client.query(schemaQuery);
        
        console.log(`📋 Users table schema:`);
        schemaResult.rows.forEach(column => {
            console.log(`  - ${column.column_name}: ${column.data_type}`);
        });
        
        // Barcha userlarni ko'rish
        const allUsersQuery = 'SELECT id, phone, name, role, is_active, created_at FROM users ORDER BY created_at DESC LIMIT 10';
        const allUsersResult = await client.query(allUsersQuery);
        
        console.log(`📊 Database'dagi oxirgi 10 ta user:`);
        allUsersResult.rows.forEach((user, index) => {
            console.log(`👤 User ${index + 1}:`, {
                id: user.id,
                phone: user.phone,
                name: user.name,
                role: user.role,
                is_active: user.is_active,
                created_at: user.created_at
            });
        });
        
        // Test user ni topish
        const userQuery = 'SELECT * FROM users WHERE phone LIKE $1';
        const userResult = await client.query(userQuery, ['%998990972472%']);
        
        console.log(`📊 Topilgan userlar soni: ${userResult.rows.length}`);
        
        if (userResult.rows.length === 0) {
            console.log('❌ User topilmadi: +998990972472');
            return;
        }
        
        // Barcha topilgan userlarni ko'rsatish
        userResult.rows.forEach((user, index) => {
            console.log(`👤 User ${index + 1}:`, {
                id: user.id,
                phone: user.phone,
                username: user.username,
                email: user.email,
                registration_step: user.registration_step,
                created_at: user.created_at
            });
        });
        
        const user = userResult.rows[0];
        console.log('✅ User topildi:', {
            id: user.id,
            phone: user.phone,
            username: user.username,
            email: user.email,
            registration_step: user.registration_step,
            created_at: user.created_at
        });
        
        // Transaction boshlanishi
        await client.query('BEGIN');
        
        console.log('🗑️ User bilan bog\'liq ma\'lumotlarni o\'chirmoqda...');
        
        // User bilan bog'liq barcha ma'lumotlarni o'chirish
        await client.query('DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $1', [user.id]);
        await client.query('DELETE FROM user_favorites WHERE user_id = $1', [user.id]);
        await client.query('DELETE FROM notifications WHERE user_id = $1', [user.id]);
        await client.query('DELETE FROM user_sessions WHERE user_id = $1', [user.id]);
        await client.query('DELETE FROM chat_participants WHERE participant_id = $1 AND participant_type = $2', [user.id, 'user']);
        
        // Userni o'chirish
        const deleteResult = await client.query('DELETE FROM users WHERE id = $1 RETURNING *', [user.id]);
        
        await client.query('COMMIT');
        
        console.log('✅ User muvaffaqiyatli o\'chirildi:', deleteResult.rows[0]);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Xatolik:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

deleteTestUser();