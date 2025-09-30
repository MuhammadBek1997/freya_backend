const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkMessagesStructure() {
  const client = await pool.connect();
  
  try {
    console.log('📋 Messages jadvalining strukturasi:\n');
    
    const structure = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'messages' 
      ORDER BY ordinal_position
    `);
    
    structure.rows.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable} - Default: ${col.column_default || 'None'}`);
    });
    
    console.log('\n📊 Mavjud messages:');
    const messages = await client.query(`
      SELECT id, sender_id, sender_type, receiver_id, receiver_type, content, created_at, is_read
      FROM messages 
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    if (messages.rows.length > 0) {
      messages.rows.forEach((msg, index) => {
        console.log(`${index + 1}. ${msg.content.substring(0, 50)}...`);
        console.log(`   From: ${msg.sender_id} (${msg.sender_type})`);
        console.log(`   To: ${msg.receiver_id} (${msg.receiver_type})`);
        console.log(`   Date: ${msg.created_at}`);
        console.log(`   Read: ${msg.is_read}`);
        console.log('');
      });
    } else {
      console.log('Hech qanday habar topilmadi');
    }
    
    const count = await client.query('SELECT COUNT(*) as count FROM messages');
    console.log(`\nJami habarlar: ${count.rows[0].count} ta`);
    
  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkMessagesStructure();