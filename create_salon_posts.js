require('dotenv').config();
const { Pool } = require('pg');

// Production database connection
const pool = new Pool({
    connectionString: 'postgres://uab908oh973b26:p56ddf6329de8d93abf0e7a3eefe45d1879ec32502036a51c391715d124b133f3@cduf3or326qj7m.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d4gg4be05g458l',
    ssl: { rejectUnauthorized: false }
});

async function createSalonPosts() {
    try {
        console.log('🔗 Connecting to production database...');
        
        // Test connection
        await pool.query('SELECT NOW()');
        console.log('✅ Connected to production database');

        // Get admins and their salons
        const adminsQuery = `
            SELECT a.id as admin_id, a.username, a.salon_id, s.name as salon_name
            FROM admins a
            LEFT JOIN salons s ON a.salon_id = s.id
            ORDER BY a.id
        `;
        
        const admins = await pool.query(adminsQuery);
        console.log(`📊 Found ${admins.rows.length} admins`);

        // Sample posts for each salon
        const postTemplates = [
            {
                title: "Yangi soch turmagi xizmatlari",
                description: "Bizning salonimizda eng zamonaviy soch turmagi xizmatlari mavjud. Professional ustalar tomonidan bajariladi.",
                media_files: [
                    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500",
                    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500",
                    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=500"
                ]
            },
            {
                title: "Spa va relaksatsiya xizmatlari",
                description: "Tanangiz va ruhingiz uchun mukammal dam olish. Eng yaxshi spa xizmatlari bilan tanishing.",
                media_files: [
                    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500",
                    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500",
                    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500"
                ]
            },
            {
                title: "Manikür va pedikür xizmatlari",
                description: "Qo'l va oyoqlaringiz uchun professional parvarish. Eng sifatli materiallar va ustalik.",
                media_files: [
                    "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500",
                    "https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=500",
                    "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=500"
                ]
            },
            {
                title: "Kosmetologiya xizmatlari",
                description: "Yuzingiz uchun professional parvarish. Zamonaviy usullar va sifatli mahsulotlar.",
                media_files: [
                    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500",
                    "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=500",
                    "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=500"
                ]
            },
            {
                title: "Maxsus aksiya va chegirmalar",
                description: "Bizning salonimizda doimiy aksiyalar va chegirmalar mavjud. Imkoniyatni boy bermang!",
                media_files: [
                    "https://images.unsplash.com/photo-1522337094846-8a818192de1f?w=500",
                    "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=500",
                    "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=500"
                ]
            }
        ];

        console.log('📝 Creating posts for each admin...');
        
        for (let i = 0; i < admins.rows.length; i++) {
            const admin = admins.rows[i];
            const postTemplate = postTemplates[i % postTemplates.length];
            
            console.log(`\n👤 Creating post for ${admin.username} (Salon: ${admin.salon_name})`);
            
            // Create post with admin_id but salon_id as null initially (to test the fix script)
            const result = await pool.query(`
                INSERT INTO posts (title, description, media_files, admin_id, salon_id)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, title, admin_id, salon_id
            `, [
                postTemplate.title,
                postTemplate.description,
                JSON.stringify(postTemplate.media_files),
                admin.admin_id,
                null  // Intentionally setting to null to test the fix script
            ]);

            console.log(`✅ Created post: "${result.rows[0].title}" (ID: ${result.rows[0].id}, Admin ID: ${result.rows[0].admin_id}, Salon ID: ${result.rows[0].salon_id})`);
        }

        // Show all created posts
        const allPosts = await pool.query(`
            SELECT p.id, p.title, p.admin_id, p.salon_id, a.username, a.salon_id as admin_salon_id, s.name as salon_name
            FROM posts p
            LEFT JOIN admins a ON p.admin_id = a.id
            LEFT JOIN salons s ON a.salon_id = s.id
            ORDER BY p.id
        `);

        console.log('\n=== All Posts ===');
        allPosts.rows.forEach(post => {
            console.log(`- Post ID: ${post.id}, Title: "${post.title}"`);
            console.log(`  Admin: ${post.username} (ID: ${post.admin_id})`);
            console.log(`  Post salon_id: ${post.salon_id}, Admin salon_id: ${post.admin_salon_id}`);
            console.log(`  Salon: ${post.salon_name}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error creating salon posts:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run the function
createSalonPosts()
    .then(() => {
        console.log('✅ Salon posts creation completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Failed to create salon posts:', error);
        process.exit(1);
    });