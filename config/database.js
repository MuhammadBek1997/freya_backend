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
    // Enable UUID extension
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Salons table
    await pool.query(`CREATE TABLE IF NOT EXISTS salons (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      salon_name VARCHAR(255) NOT NULL,
      salon_phone VARCHAR(20),
      salon_add_phone VARCHAR(20),
      salon_instagram VARCHAR(100),
      salon_rating DECIMAL(3,2) DEFAULT 0,
      comments JSONB DEFAULT '[]',
      salon_payment JSONB DEFAULT '[]',
      salon_description TEXT,
      salon_types JSONB DEFAULT '[]',
      private_salon BOOLEAN DEFAULT false,
      is_private BOOLEAN DEFAULT false,
      work_schedule JSONB DEFAULT '[]',
      salon_title VARCHAR(255),
      salon_additionals JSONB DEFAULT '[]',
      sale_percent INTEGER DEFAULT 0,
      sale_limit INTEGER DEFAULT 0,
      location JSONB DEFAULT '{"lat": 41, "long": 64}',
      salon_orient VARCHAR(255),
      salon_photos JSONB DEFAULT '[]',
      salon_comfort JSONB DEFAULT '[]',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Admins table
    await pool.query(`CREATE TABLE IF NOT EXISTS admins (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      email VARCHAR(100),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

      phone VARCHAR(20),
      email VARCHAR(255),
      position VARCHAR(255),
      is_waiting BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Schedules table
    await pool.query(`CREATE TABLE IF NOT EXISTS schedules (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
      salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      is_available BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Salon translations table
    await pool.query(`CREATE TABLE IF NOT EXISTS salon_translations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
      language VARCHAR(5) NOT NULL,
      name VARCHAR(255),
      description TEXT,
      address TEXT,
      salon_title VARCHAR(255),
      salon_orient VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(salon_id, language)
    )`);

    // Employee translations table
    await pool.query(`CREATE TABLE IF NOT EXISTS employee_translations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
      language VARCHAR(5) NOT NULL,
      name VARCHAR(255),
      position VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, language)
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