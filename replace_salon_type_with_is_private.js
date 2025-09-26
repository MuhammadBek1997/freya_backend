const { Pool } = require('pg');

// Production database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function replaceSalonTypeWithIsPrivate() {
    try {
        console.log('🔧 Replacing salon_type with is_private boolean field...\n');
        
        // Check current salon_type values
        const currentSalons = await pool.query(`
            SELECT id, name, salon_type 
            FROM salons 
            ORDER BY created_at
        `);
        
        console.log('📍 CURRENT SALONS WITH SALON_TYPE:');
        currentSalons.rows.forEach((salon, index) => {
            console.log(`${index + 1}. ${salon.name} - Type: ${salon.salon_type}`);
        });
        
        // Check if is_private column already exists
        const columnCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'salons' AND column_name = 'is_private'
        `);
        
        if (columnCheck.rows.length === 0) {
            // Add is_private column
            await pool.query(`
                ALTER TABLE salons 
                ADD COLUMN is_private BOOLEAN DEFAULT false
            `);
            console.log('\n✅ is_private column added successfully');
        } else {
            console.log('\n✅ is_private column already exists');
        }
        
        // Update is_private based on salon_type
        console.log('\n🔄 Updating is_private values based on salon_type:');
        
        // Set is_private = true for private salons, false for corporate
        await pool.query(`
            UPDATE salons 
            SET is_private = CASE 
                WHEN salon_type = 'private' THEN true 
                WHEN salon_type = 'corporate' THEN false 
                ELSE false 
            END
        `);
        
        console.log('✅ Updated is_private values');
        
        // Show updated results
        const updatedSalons = await pool.query(`
            SELECT id, name, salon_type, is_private 
            FROM salons 
            ORDER BY created_at
        `);
        
        console.log('\n📍 UPDATED SALONS:');
        const privateCount = updatedSalons.rows.filter(s => s.is_private === true).length;
        const corporateCount = updatedSalons.rows.filter(s => s.is_private === false).length;
        
        updatedSalons.rows.forEach((salon, index) => {
            const type = salon.is_private ? 'Private' : 'Corporate';
            console.log(`${index + 1}. ${salon.name} - is_private: ${salon.is_private} (${type})`);
        });
        
        console.log(`\n📊 Summary:`);
        console.log(`   Private salons (is_private = true): ${privateCount}`);
        console.log(`   Corporate salons (is_private = false): ${corporateCount}`);
        console.log(`   Total salons: ${updatedSalons.rows.length}`);
        
        // Now drop the salon_type column
        console.log('\n🗑️ Removing salon_type column...');
        await pool.query(`
            ALTER TABLE salons 
            DROP COLUMN IF EXISTS salon_type
        `);
        console.log('✅ salon_type column removed');
        
        // Final check
        const finalSalons = await pool.query(`
            SELECT id, name, is_private 
            FROM salons 
            ORDER BY created_at
        `);
        
        console.log('\n📍 FINAL SALONS (only with is_private):');
        finalSalons.rows.forEach((salon, index) => {
            const type = salon.is_private ? 'Private' : 'Corporate';
            console.log(`${index + 1}. ${salon.name} - is_private: ${salon.is_private} (${type})`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
        console.log('\n🔚 Database connection closed');
    }
}

replaceSalonTypeWithIsPrivate();