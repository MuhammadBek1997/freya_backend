require('dotenv').config();
const { Pool } = require('pg');

// Production database connection
const pool = new Pool({
    connectionString: 'postgres://uab908oh973b26:p56ddf6329de8d93abf0e7a3eefe45d1879ec32502036a51c391715d124b133f3@cduf3or326qj7m.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d4gg4be05g458l',
    ssl: { rejectUnauthorized: false }
});

async function checkFinalPosts() {
    try {
        console.log('🔗 Connecting to production database...');
        
        // Test connection
        await pool.query('SELECT NOW()');
        console.log('✅ Connected to production database');

        // Get all posts with their admin and salon info
        const postsQuery = `
            SELECT 
                p.id,
                p.title,
                p.salon_id,
                p.admin_id,
                p.created_at,
                a.username as admin_username,
                a.salon_id as admin_salon_id,
                s.name as salon_name
            FROM posts p
            LEFT JOIN admins a ON p.admin_id = a.id
            LEFT JOIN salons s ON p.salon_id = s.id
            ORDER BY p.id;
        `;
        
        const posts = await pool.query(postsQuery);
        
        console.log(`\n=== All Posts in Production Database (${posts.rows.length} total) ===`);
        
        posts.rows.forEach(post => {
            console.log(`\n📝 Post ID: ${post.id}`);
            console.log(`   Title: "${post.title}"`);
            console.log(`   Post salon_id: ${post.salon_id}`);
            console.log(`   Admin: ${post.admin_username} (ID: ${post.admin_id})`);
            console.log(`   Admin salon_id: ${post.admin_salon_id}`);
            console.log(`   Salon: ${post.salon_name}`);
            console.log(`   Created: ${post.created_at}`);
            console.log(`   ✅ Salon IDs match: ${post.salon_id === post.admin_salon_id ? 'YES' : 'NO'}`);
        });

        // Summary
        const correctPosts = posts.rows.filter(p => p.salon_id === p.admin_salon_id);
        const incorrectPosts = posts.rows.filter(p => p.salon_id !== p.admin_salon_id);
        
        console.log(`\n=== Summary ===`);
        console.log(`✅ Posts with correct salon_id: ${correctPosts.length}`);
        console.log(`❌ Posts with incorrect salon_id: ${incorrectPosts.length}`);
        console.log(`📊 Total posts: ${posts.rows.length}`);

    } catch (error) {
        console.error('❌ Error checking final posts:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run the function
checkFinalPosts()
    .then(() => {
        console.log('\n✅ Final posts check completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Failed to check final posts:', error);
        process.exit(1);
    });