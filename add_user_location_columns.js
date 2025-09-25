const { pool } = require('./config/database');

async function addUserLocationColumns() {
    try {
        console.log('Adding location columns to users table...');
        
        // Add latitude column
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8)
        `);
        console.log('✓ Added latitude column');
        
        // Add longitude column
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8)
        `);
        console.log('✓ Added longitude column');
        
        // Add location_permission column
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS location_permission BOOLEAN DEFAULT false
        `);
        console.log('✓ Added location_permission column');
        
        // Add address column for text address
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS address TEXT
        `);
        console.log('✓ Added address column');
        
        // Add city column
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS city VARCHAR(100)
        `);
        console.log('✓ Added city column');
        
        // Add country column
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS country VARCHAR(100)
        `);
        console.log('✓ Added country column');
        
        // Add location_updated_at column
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);
        console.log('✓ Added location_updated_at column');
        
        console.log('\\n✅ All location columns added successfully!');
        
        // Verify the changes
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN ('latitude', 'longitude', 'location_permission', 'address', 'city', 'country', 'location_updated_at')
            ORDER BY column_name
        `);
        
        console.log('\\nAdded columns:');
        result.rows.forEach(row => {
            console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        
    } catch (error) {
        console.error('Error adding location columns:', error.message);
        console.error('Error details:', error);
    } finally {
        process.exit(0);
    }
}

addUserLocationColumns();