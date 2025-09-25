const { pool } = require('./config/database');

async function checkLatestAppointment() {
  try {
    const query = `
      SELECT id, user_id, user_name, application_number, status, created_at 
      FROM appointments 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const result = await pool.query(query);
    
    if (result.rows.length > 0) {
      const row = result.rows[0];
      console.log('Latest appointment:', row);
      
      // Check if user_id matches our test user
      const testUserId = '40a74a5f-b736-4c12-82f2-65a3ec8cee79';
      if (row.user_id === testUserId) {
        console.log('✅ User ID matches our test user');
      } else {
        console.log('❌ User ID does not match. Expected:', testUserId, 'Got:', row.user_id);
      }
    } else {
      console.log('No appointments found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkLatestAppointment();