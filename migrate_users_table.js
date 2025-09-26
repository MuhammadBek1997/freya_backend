require('dotenv').config({ path: '.env.production' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrateUsersTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Production database ga ulanmoqda...');
    
    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Check if users table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('📋 Eski users table mavjud. Backup yaratmoqda...');
      
      // Create backup table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users_backup AS 
        SELECT * FROM users;
      `);
      
      console.log('🗑️ Eski users table o\'chirmoqda...');
      await client.query('DROP TABLE users CASCADE;');
    }
    
    console.log('🆕 Yangi users table yaratmoqda...');
    
    // Create new users table with correct schema
    await client.query(`
      CREATE TABLE users (
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
      )
    `);
    
    // Create trigger for updated_at
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    await client.query(`
      CREATE TRIGGER update_users_updated_at 
      BEFORE UPDATE ON users 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    
    // Check if backup table exists and restore compatible data
    const backupExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users_backup'
      );
    `);
    
    if (backupExists.rows[0].exists) {
      console.log('📥 Backup table mavjud, lekin bo\'sh table uchun o\'chirmoqda...');
      
      // Just drop the backup table since we don't need to restore anything
      await client.query('DROP TABLE users_backup;');
      console.log('🗑️ Backup table o\'chirildi');
    }
    
    // Verify new table structure
    const newSchema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('✅ Yangi users table schema:');
    newSchema.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}${row.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
    });
    
    console.log('🎉 Migration muvaffaqiyatli yakunlandi!');
    
  } catch (error) {
    console.error('❌ Migration xatosi:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
migrateUsersTable()
  .then(() => {
    console.log('✅ Migration tugadi');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration xatosi:', error);
    process.exit(1);
  });