const { pool } = require('./config/database');

async function debugUserAppointments() {
  try {
    const testUserId = '40a74a5f-b736-4c12-82f2-65a3ec8cee79';
    
    console.log('Testing with user_id:', testUserId);
    
    // Test the exact query from getUserAppointments
    const query = `
      SELECT a.*, s.day_of_week, s.start_time, s.end_time,
             e.name as employee_name
      FROM appointments a
      LEFT JOIN schedules s ON a.schedule_id = s.id
      LEFT JOIN employees e ON a.employee_id = e.id
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC
    `;
    
    console.log('Executing query:', query);
    console.log('With params:', [testUserId]);
    
    const result = await pool.query(query, [testUserId]);
    
    console.log('Query result:');
    console.log('Rows found:', result.rows.length);
    console.log('Data:', result.rows);
    
    // Also check if there are any appointments at all
    const allAppointments = await pool.query('SELECT user_id, user_name, id FROM appointments');
    console.log('\nAll appointments in database:');
    console.log(allAppointments.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugUserAppointments();