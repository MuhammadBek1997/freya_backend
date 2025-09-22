const { query } = require('./config/database');

async function checkUser() {
  try {
    const userId = 'ad88400b-2ce7-4116-9322-cf017f20d89e';
    console.log('Checking user with ID:', userId);
    
    const result = await query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    console.log('Query result:', result);
    console.log('Number of rows:', result.rows ? result.rows.length : 0);
    
    if (result.rows && result.rows.length > 0) {
      console.log('User found:', result.rows[0]);
    } else {
      console.log('User not found');
      
      // Let's see all users
      const allUsers = await query('SELECT * FROM users LIMIT 5');
      console.log('All users (first 5):', allUsers.rows);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUser();