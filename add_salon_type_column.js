const { Pool } = require('pg');

// Production database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function addSalonTypeColumn() {
    try {
        console.log('🔧 Adding salon_type column to salons table...\n');
        
        // Check if column already exists
        const columnCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'salons' AND column_name = 'salon_type'
        `);
        
        if (columnCheck.rows.length > 0) {
            console.log('✅ salon_type column already exists');
        } else {
            // Add salon_type column
            await pool.query(`
                ALTER TABLE salons 
                ADD COLUMN salon_type VARCHAR(20) DEFAULT 'private' CHECK (salon_type IN ('private', 'corporate'))
            `);
            console.log('✅ salon_type column added successfully');
        }
        
        // Check current salons
        const salonsResult = await pool.query(`
            SELECT id, name, salon_type, is_active 
            FROM salons 
            ORDER BY created_at
        `);
        
        console.log('\n📍 CURRENT SALONS:');
        salonsResult.rows.forEach((salon, index) => {
            console.log(`${index + 1}. ${salon.name} - Type: ${salon.salon_type} - Active: ${salon.is_active}`);
        });
        
        console.log(`\n📊 Total salons: ${salonsResult.rows.length}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
        console.log('\n🔚 Database connection closed');
    }
}

addSalonTypeColumn();