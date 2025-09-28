const { Pool } = require('pg');

// Load environment variables
require('dotenv').config();

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function addSalonSaleColumn() {
    try {
        console.log('🔧 Adding salon_sale column to salons table...\n');

        // Check if salon_sale column already exists
        const checkColumnQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'salons' AND column_name = 'salon_sale'
        `;
        const columnExists = await pool.query(checkColumnQuery);

        if (columnExists.rows.length > 0) {
            console.log('✅ salon_sale column already exists');
        } else {
            // Add salon_sale column
            await pool.query(`
                ALTER TABLE salons
                ADD COLUMN salon_sale JSONB DEFAULT '{"amount": "", "date": ""}'
            `);
            console.log('✅ salon_sale column added successfully');
        }

        // Update existing salons with default salon_sale values
        console.log('\nUpdating existing salons with default salon_sale values...');
        const updateResult = await pool.query(`
            UPDATE salons 
            SET salon_sale = '{"amount": "", "date": ""}'::jsonb
            WHERE salon_sale IS NULL
        `);
        console.log(`✅ Updated ${updateResult.rowCount} salons with default salon_sale values`);

        // Check current salons
        const salonsResult = await pool.query(`
            SELECT id, salon_name, salon_sale, is_active
            FROM salons
            ORDER BY id
            LIMIT 5
        `);

        console.log('\n📍 CURRENT SALONS (first 5):');
        salonsResult.rows.forEach((salon, index) => {
            console.log(`${index + 1}. ${salon.salon_name || 'Unknown'} - Sale: ${JSON.stringify(salon.salon_sale)} - Active: ${salon.is_active}`);
        });

        console.log(`\n📊 Total salons: ${salonsResult.rows.length}`);

    } catch (error) {
        console.error('❌ Error adding salon_sale column:', error);
    } finally {
        await pool.end();
    }
}

// Run the migration
addSalonSaleColumn();