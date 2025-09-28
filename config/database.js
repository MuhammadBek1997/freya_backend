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

    // Users table for user registration
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      phone VARCHAR(20) UNIQUE NOT NULL,
      email VARCHAR(100),
      password_hash VARCHAR(255) NOT NULL,
      username VARCHAR(100),
      registration_step INTEGER DEFAULT 1,
      verification_code VARCHAR(6),
      verification_expires_at TIMESTAMP,
      is_verified BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

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
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      email VARCHAR(100),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Employees table
    await pool.query(`CREATE TABLE IF NOT EXISTS employees (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      surname VARCHAR(100),
      phone VARCHAR(20),
      email VARCHAR(100) UNIQUE,
      profession VARCHAR(100),
      username VARCHAR(50) UNIQUE,
      employee_password VARCHAR(255),
      avatar_url VARCHAR(255),
      bio TEXT,
      experience_years INTEGER DEFAULT 0,
      rating DECIMAL(3,2) DEFAULT 0,
      position VARCHAR(255),
      is_waiting BOOLEAN DEFAULT true,
      is_active BOOLEAN DEFAULT true,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Schedules table
    await pool.query(`CREATE TABLE IF NOT EXISTS schedules (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      title VARCHAR(255),
      date DATE NOT NULL,
      repeat VARCHAR(50),
      repeat_value INTEGER,
      employee_list JSONB DEFAULT '[]',
      price DECIMAL(10,2) NOT NULL,
      full_pay DECIMAL(10,2),
      deposit DECIMAL(10,2),
      is_active BOOLEAN DEFAULT true,
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

    // Database tables initialized
  } catch (error) {
    console.error('Database tables yaratishda xatolik:', error);
  }
}

// Query function
const query = async (text, params = []) => {
  try {
    const result = await pool.query(text, params);
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