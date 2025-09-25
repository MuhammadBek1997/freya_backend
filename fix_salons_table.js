const { Pool } = require('pg');

async function fixSalonsTable() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔧 Salonlar jadvaliga is_top ustunini qo\'shish boshlandi...');

        // Add is_top column to salons table
        await pool.query(`
            ALTER TABLE salons 
            ADD COLUMN IF NOT EXISTS is_top BOOLEAN DEFAULT FALSE;
        `);

        console.log('✅ is_top ustuni muvaffaqiyatli qo\'shildi!');

        // Check current table structure
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'salons' 
            ORDER BY ordinal_position;
        `);

        console.log('\n📋 Salonlar jadvali tuzilishi:');
        result.rows.forEach(row => {
            console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
        });

    } catch (error) {
        console.error('❌ Xatolik yuz berdi:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

fixSalonsTable();