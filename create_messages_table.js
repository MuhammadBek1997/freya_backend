const { pool } = require('./config/database');
require('dotenv').config();

async function createMessagesTable() {
  try {
    console.log('Messages table yaratilmoqda...');
    
    // Create messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          sender_id UUID NOT NULL,
          sender_type VARCHAR(20) NOT NULL, -- 'user', 'employee', 'admin'
          receiver_id UUID NOT NULL,
          receiver_type VARCHAR(20) NOT NULL, -- 'user', 'employee', 'admin' 
          message_text TEXT NOT NULL,
          message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'file'
          file_url VARCHAR(255),
          is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Messages table yaratildi');
    
    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, sender_type);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id, receiver_type);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
    `);
    
    console.log('Messages table indexlari yaratildi');
    
    // Create chat_rooms table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_rooms (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          room_name VARCHAR(100),
          room_type VARCHAR(20) DEFAULT 'private', -- 'private', 'group'
          created_by UUID NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Chat_rooms table yaratildi');
    
    // Create chat_participants table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_participants (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
          participant_id UUID NOT NULL,
          participant_type VARCHAR(20) NOT NULL, -- 'user', 'employee', 'admin'
          joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          left_at TIMESTAMP,
          UNIQUE(room_id, participant_id, participant_type)
      );
    `);
    
    console.log('Chat_participants table yaratildi');
    
    console.log('Barcha chat table lari muvaffaqiyatli yaratildi!');
    process.exit(0);
  } catch (error) {
    console.error('Xatolik:', error);
    process.exit(1);
  }
}

createMessagesTable();