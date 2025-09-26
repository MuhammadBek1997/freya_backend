const { pool } = require('../config/database');

async function createPostsTable() {
    try {
        console.log('📝 Creating posts table...');

        // Posts table yaratish
        await pool.query(`
            CREATE TABLE IF NOT EXISTS posts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title VARCHAR(255) NOT NULL,
                description TEXT,
                media_files JSONB DEFAULT '[]'::jsonb, -- Video va foto fayllar uchun
                admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
                salon_id UUID REFERENCES salons(id) ON DELETE CASCADE, -- Qaysi salonga tegishli
                is_active BOOLEAN DEFAULT true,
                view_count INTEGER DEFAULT 0,
                like_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Index qo'shish
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_posts_admin_id ON posts(admin_id);
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_posts_salon_id ON posts(salon_id);
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_posts_is_active ON posts(is_active);
        `);

        console.log('✅ Posts table successfully created!');

        // Sample data qo'shish
        const adminResult = await pool.query('SELECT id FROM admins LIMIT 1');
        if (adminResult.rows.length > 0) {
            const adminId = adminResult.rows[0].id;
            
            await pool.query(`
                INSERT INTO posts (title, description, media_files, admin_id) 
                VALUES 
                ($1, $2, $3, $4),
                ($5, $6, $7, $8)
                ON CONFLICT DO NOTHING
            `, [
                'Yangi soch turmagi',
                'Bu yil eng mashhur soch turmaklari haqida ma\'lumot. Professional stilistlarimiz tomonidan tavsiya etiladi.',
                JSON.stringify([
                    { type: 'image', url: '/uploads/images/haircut1.jpg', alt: 'Yangi soch turmagi' },
                    { type: 'video', url: '/uploads/videos/haircut_tutorial.mp4', thumbnail: '/uploads/images/haircut_thumb.jpg' }
                ]),
                adminId,
                'Manikur va pedikur xizmatlari',
                'Professional manikur va pedikur xizmatlarimiz haqida batafsil ma\'lumot. Eng so\'nggi texnologiyalar va sifatli materiallar.',
                JSON.stringify([
                    { type: 'image', url: '/uploads/images/manicure1.jpg', alt: 'Manikur xizmati' },
                    { type: 'image', url: '/uploads/images/pedicure1.jpg', alt: 'Pedikur xizmati' }
                ]),
                adminId
            ]);

            console.log('✅ Sample posts added!');
        }

    } catch (error) {
        console.error('❌ Error creating posts table:', error);
        throw error;
    }
}

// Agar to'g'ridan-to'g'ri ishga tushirilsa
if (require.main === module) {
    createPostsTable()
        .then(() => {
            console.log('✅ Posts table migration completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        });
}

module.exports = createPostsTable;