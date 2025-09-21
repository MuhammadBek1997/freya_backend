const { Pool } = require('pg');
require('dotenv').config();

// Heroku database connection
// You need to get the actual DATABASE_URL from Heroku dashboard
// For now, we'll try to connect using the environment variable
const pool = new Pool({
  connectionString: process.env.HEROKU_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Always use SSL for Heroku
});

async function fixHerokuSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Checking Heroku database schema...');
    
    // Check if salons table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'salons'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Salons table does not exist. Creating...');
      
      // Create salons table with correct schema
      await client.query(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        CREATE TABLE salons (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          salon_logo VARCHAR(255),
          salon_name VARCHAR(200) NOT NULL,
          salon_phone VARCHAR(20),
          salon_add_phone VARCHAR(20),
          salon_instagram VARCHAR(100),
          salon_rating DECIMAL(3,2) DEFAULT 0,
          comments JSONB DEFAULT '[]',
          salon_payment JSONB,
          salon_description TEXT,
          salon_types JSONB DEFAULT '[]',
          private_salon BOOLEAN DEFAULT false,
          work_schedule JSONB DEFAULT '[]',
          salon_title VARCHAR(200),
          salon_additionals JSONB DEFAULT '[]',
          sale_percent INTEGER DEFAULT 0,
          sale_limit INTEGER DEFAULT 0,
          location JSONB,
          salon_orient JSONB,
          salon_photos JSONB DEFAULT '[]',
          salon_comfort JSONB DEFAULT '[]',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Salons table created successfully');
    } else {
      console.log('✅ Salons table exists');
      
      // Check if created_at column exists
      const columnCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'salons' 
          AND column_name = 'created_at'
        );
      `);
      
      if (!columnCheck.rows[0].exists) {
        console.log('❌ created_at column missing. Adding...');
        await client.query(`
          ALTER TABLE salons 
          ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        `);
        console.log('✅ created_at and updated_at columns added');
      } else {
        console.log('✅ created_at column exists');
      }
    }
    
    // Insert test data if table is empty
    const countResult = await client.query('SELECT COUNT(*) FROM salons');
    const count = parseInt(countResult.rows[0].count);
    
    if (count === 0) {
      console.log('📝 Inserting test salon data...');
      
      await client.query(`
        INSERT INTO salons (salon_name, salon_phone, salon_description, salon_rating, location) VALUES
        ('Beauty Palace', '+998901234567', 'Luxury beauty salon with professional services', 4.8, '{"address": "Tashkent, Yunusobod"}'),
        ('Glamour Studio', '+998907654321', 'Modern salon for hair and beauty treatments', 4.6, '{"address": "Tashkent, Chilonzor"}'),
        ('Elite Salon', '+998909876543', 'Premium salon with experienced stylists', 4.9, '{"address": "Tashkent, Mirzo Ulugbek"}');
      `);
      
      console.log('✅ Test data inserted successfully');
    } else {
      console.log(`✅ Salons table has ${count} records`);
    }
    
    console.log('🎉 Heroku database schema fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing schema:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the fix
if (require.main === module) {
  fixHerokuSchema()
    .then(() => {
      console.log('✅ Schema fix completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Schema fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixHerokuSchema };