const { Pool } = require('pg');

// Production database connection
const pool = new Pool({
  connectionString: 'postgres://uab908oh973b26:p56ddf6329de8d93abf0e7a3eefe45d1879ec32502036a51c391715d124b133f3@cduf3or326qj7m.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d4gg4be05g458l',
  ssl: {
    rejectUnauthorized: false
  }
});

async function deleteNullSalonPosts() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking for posts with null salon_id...');
    
    // First, check how many posts have null salon_id
    const checkQuery = `
      SELECT 
        id, 
        title, 
        admin_id, 
        salon_id,
        created_at
      FROM posts 
      WHERE salon_id IS NULL
      ORDER BY created_at DESC;
    `;
    
    const checkResult = await client.query(checkQuery);
    console.log(`\n📊 Found ${checkResult.rows.length} posts with null salon_id:`);
    
    if (checkResult.rows.length === 0) {
      console.log('✅ No posts with null salon_id found. Database is clean!');
      return;
    }
    
    // Display the posts that will be deleted
    checkResult.rows.forEach((post, index) => {
      console.log(`${index + 1}. Post ID: ${post.id}`);
      console.log(`   Title: ${post.title}`);
      console.log(`   Admin ID: ${post.admin_id}`);
      console.log(`   Salon ID: ${post.salon_id}`);
      console.log(`   Created: ${post.created_at}`);
      console.log('   ---');
    });
    
    console.log(`\n🗑️  Deleting ${checkResult.rows.length} posts with null salon_id...`);
    
    // Delete posts with null salon_id
    const deleteQuery = `
      DELETE FROM posts 
      WHERE salon_id IS NULL;
    `;
    
    const deleteResult = await client.query(deleteQuery);
    console.log(`✅ Successfully deleted ${deleteResult.rowCount} posts with null salon_id`);
    
    // Verify deletion
    console.log('\n🔍 Verifying deletion...');
    const verifyResult = await client.query(checkQuery);
    console.log(`📊 Posts with null salon_id remaining: ${verifyResult.rows.length}`);
    
    if (verifyResult.rows.length === 0) {
      console.log('✅ All posts with null salon_id have been successfully removed!');
    } else {
      console.log('⚠️  Some posts with null salon_id still remain');
    }
    
    // Show remaining posts count
    const totalPostsQuery = 'SELECT COUNT(*) as total FROM posts';
    const totalResult = await client.query(totalPostsQuery);
    console.log(`\n📈 Total posts remaining in database: ${totalResult.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
deleteNullSalonPosts()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  });