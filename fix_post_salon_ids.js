const { Client } = require('pg');

async function fixPostSalonIds() {
    // Use production DATABASE_URL directly
    const client = new Client({
        connectionString: 'postgres://uab908oh973b26:p56ddf6329de8d93abf0e7a3eefe45d1879ec32502036a51c391715d124b133f3@cduf3or326qj7m.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d4gg4be05g458l',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to production database');

        // First, check what tables exist
        console.log('\n=== Available Tables ===');
        const tablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `;
        
        const tablesResult = await client.query(tablesQuery);
        console.log('Available tables:');
        tablesResult.rows.forEach(row => {
            console.log(`- ${row.table_name}`);
        });

        // Check if posts table exists
        const postsTableExists = tablesResult.rows.some(row => row.table_name === 'posts');
        
        if (!postsTableExists) {
            console.log('\n❌ Posts table does not exist in production database!');
            console.log('This might be a different database or the posts table was not created yet.');
            return;
        }

        console.log('\n✅ Posts table found! Proceeding with salon_id fixes...');

        // First, check current posts and their admin salon_ids
        console.log('\n=== Current Posts and Admin Salon IDs ===');
        const postsQuery = `
            SELECT 
                p.id as post_id,
                p.title,
                p.salon_id as current_salon_id,
                p.admin_id,
                a.username as admin_username,
                a.salon_id as admin_salon_id,
                s.name as salon_name
            FROM posts p
            LEFT JOIN admins a ON p.admin_id = a.id
            LEFT JOIN salons s ON a.salon_id = s.id
            ORDER BY p.created_at DESC;
        `;
        
        const postsResult = await client.query(postsQuery);
        
        console.log(`Found ${postsResult.rows.length} posts:`);
        postsResult.rows.forEach(row => {
            console.log(`\nPost ID: ${row.post_id}`);
            console.log(`Title: ${row.title}`);
            console.log(`Current salon_id: ${row.current_salon_id}`);
            console.log(`Admin: ${row.admin_username} (${row.admin_id})`);
            console.log(`Admin's salon_id: ${row.admin_salon_id}`);
            console.log(`Salon name: ${row.salon_name}`);
            console.log(`Needs update: ${row.current_salon_id !== row.admin_salon_id ? 'YES' : 'NO'}`);
            console.log('---');
        });

        // Update posts where salon_id doesn't match admin's salon_id
        console.log('\n=== Updating Posts ===');
        const updateQuery = `
            UPDATE posts 
            SET salon_id = a.salon_id
            FROM admins a
            WHERE posts.admin_id = a.id 
            AND (posts.salon_id IS NULL OR posts.salon_id != a.salon_id)
            RETURNING posts.id, posts.title, posts.salon_id;
        `;
        
        const updateResult = await client.query(updateQuery);
        
        if (updateResult.rows.length > 0) {
            console.log(`Updated ${updateResult.rows.length} posts:`);
            updateResult.rows.forEach(row => {
                console.log(`- Post "${row.title}" (ID: ${row.id}) -> salon_id: ${row.salon_id}`);
            });
        } else {
            console.log('No posts needed updating.');
        }

        // Verify the results
        console.log('\n=== Verification ===');
        const verifyResult = await client.query(postsQuery);
        
        const mismatched = verifyResult.rows.filter(row => 
            row.current_salon_id !== row.admin_salon_id
        );
        
        if (mismatched.length === 0) {
            console.log('✅ All posts now have correct salon_id matching their admin\'s salon_id');
        } else {
            console.log(`❌ ${mismatched.length} posts still have mismatched salon_id:`);
            mismatched.forEach(row => {
                console.log(`- Post "${row.title}": salon_id=${row.current_salon_id}, admin_salon_id=${row.admin_salon_id}`);
            });
        }

        // Show final summary
        console.log('\n=== Final Summary ===');
        const summaryQuery = `
            SELECT 
                COUNT(*) as total_posts,
                COUNT(CASE WHEN p.salon_id IS NOT NULL THEN 1 END) as posts_with_salon_id,
                COUNT(CASE WHEN p.salon_id IS NULL THEN 1 END) as posts_without_salon_id
            FROM posts p;
        `;
        
        const summaryResult = await client.query(summaryQuery);
        const summary = summaryResult.rows[0];
        
        console.log(`Total posts: ${summary.total_posts}`);
        console.log(`Posts with salon_id: ${summary.posts_with_salon_id}`);
        console.log(`Posts without salon_id: ${summary.posts_without_salon_id}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.end();
    }
}

fixPostSalonIds();