const { Pool } = require('pg');

// Load environment variables
require('dotenv').config();

// Production database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function addSalonSaleToProduction() {
    try {
        console.log('🚀 PRODUCTION: Adding salon_sale column to salons table...\n');

        // Check if salon_sale column already exists
        const checkColumnQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'salons' AND column_name = 'salon_sale'
        `;
        const columnExists = await pool.query(checkColumnQuery);

        if (columnExists.rows.length > 0) {
            console.log('✅ salon_sale column already exists in production');
        } else {
            // Add salon_sale column
            await pool.query(`
                ALTER TABLE salons
                ADD COLUMN salon_sale JSONB DEFAULT '{"amount": "", "date": ""}'
            `);
            console.log('✅ salon_sale column added successfully to production');
        }

        // Update existing salons with default salon_sale values
        console.log('\n📝 Updating existing salons with default salon_sale values...');
        const updateResult = await pool.query(`
            UPDATE salons 
            SET salon_sale = '{"amount": "", "date": ""}'::jsonb
            WHERE salon_sale IS NULL
        `);
        console.log(`✅ Updated ${updateResult.rowCount} salons with default salon_sale values`);

        // First check what columns exist in salons table
        const columnsCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'salons'
            ORDER BY column_name
        `);
        
        console.log('📋 Available columns in salons table:');
        columnsCheck.rows.forEach(col => console.log(`   - ${col.column_name}`));
        
        // Get all salons to verify (using only existing columns)
        const salonsResult = await pool.query(`
            SELECT id, salon_name, salon_sale, is_active
            FROM salons
            ORDER BY id
        `);

        console.log('\n📍 PRODUCTION SALONS WITH SALON_SALE:');
        console.log(`Total salons: ${salonsResult.rows.length}\n`);
        
        salonsResult.rows.forEach((salon, index) => {
            const salonName = salon.salon_name || 'Unknown';
            console.log(`${index + 1}. ${salonName}`);
            console.log(`   ID: ${salon.id}`);
            console.log(`   Sale: ${JSON.stringify(salon.salon_sale)}`);
            console.log(`   Active: ${salon.is_active}`);
            console.log('');
        });

        // Verify column structure
        const columnInfo = await pool.query(`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns 
            WHERE table_name = 'salons' AND column_name = 'salon_sale'
        `);

        if (columnInfo.rows.length > 0) {
            console.log('📋 SALON_SALE COLUMN INFO:');
            console.log(`   Column: ${columnInfo.rows[0].column_name}`);
            console.log(`   Type: ${columnInfo.rows[0].data_type}`);
            console.log(`   Default: ${columnInfo.rows[0].column_default}`);
        }

        console.log('\n🎉 Production migration completed successfully!');
        console.log('✅ All salons now have salon_sale parameter');

    } catch (error) {
        console.error('❌ Error in production migration:', error);
        console.error('Error details:', error.message);
    } finally {
        await pool.end();
    }
}

// Run the production migration
addSalonSaleToProduction();