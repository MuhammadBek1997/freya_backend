const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('PostgreSQL database ulanish xatosi:', err);
    process.exit(-1);
  } else {
    console.log('PostgreSQL database ga ulanish muvaffaqiyatli');
    release();
    
    // Initialize tables
    initializeTables();
  }
});

// Initialize database tables
async function initializeTables() {
  try {
    // Users table
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      phone VARCHAR(20) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(100),
      first_name VARCHAR(50),
      last_name VARCHAR(50),
      username VARCHAR(50) UNIQUE,
      registration_step INTEGER DEFAULT 1,
      verification_code VARCHAR(10),
      verification_expires_at TIMESTAMP,
      is_verified BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      phone_verified BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Employees table
    await pool.query(`CREATE TABLE IF NOT EXISTS employees (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) UNIQUE,
      email VARCHAR(255),
      position VARCHAR(255),
      salon_id UUID,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // User chats table
    await pool.query(`CREATE TABLE IF NOT EXISTS user_chats (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sender_id UUID NOT NULL,
      sender_type VARCHAR(20) NOT NULL,
      receiver_id UUID NOT NULL,
      receiver_type VARCHAR(20) NOT NULL,
      message_text TEXT NOT NULL,
      message_type VARCHAR(20) DEFAULT 'text',
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Salons table
    await pool.query(`CREATE TABLE IF NOT EXISTS salons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      address TEXT,
      phone VARCHAR(20),
      email VARCHAR(255),
      working_hours JSONB,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Schedules table
    await pool.query(`CREATE TABLE IF NOT EXISTS schedules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      employee_id UUID NOT NULL,
      salon_id UUID NOT NULL,
      date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      is_available BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (salon_id) REFERENCES salons(id)
    )`);

    // Messages table
    await pool.query(`CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sender_id UUID NOT NULL,
      sender_type VARCHAR(20) NOT NULL,
      receiver_id UUID NOT NULL,
      receiver_type VARCHAR(20) NOT NULL,
      content TEXT NOT NULL,
      message_type VARCHAR(20) DEFAULT 'text',
      file_url TEXT,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Salon translations table
    await pool.query(`CREATE TABLE IF NOT EXISTS salon_translations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      salon_id UUID NOT NULL,
      language VARCHAR(5) NOT NULL,
      name VARCHAR(255),
      description TEXT,
      address TEXT,
      salon_title VARCHAR(255),
      salon_orient VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
      UNIQUE(salon_id, language)
    )`);

    console.log('Database tables initialized');
  } catch (error) {
    console.error('Database tables yaratishda xatolik:', error);
  }
}

// Query function with logging
const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executed:', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Get a client from the pool
const getClient = async () => {
  return await pool.connect();
};

module.exports = {
  query,
  getClient,
  pool
};