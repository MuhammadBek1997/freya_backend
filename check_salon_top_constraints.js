const { pool } = require('./config/database');

async function checkSalonTopConstraints() {
    try {
        console.log('Checking salon_top_history table constraints...');
        
        // Check table constraints
        const constraints = await pool.query(`
            SELECT 
                tc.constraint_name,
                tc.constraint_type,
                cc.check_clause
            FROM information_schema.table_constraints tc
            LEFT JOIN information_schema.check_constraints cc 
                ON tc.constraint_name = cc.constraint_name
            WHERE tc.table_name = 'salon_top_history'
            AND tc.table_schema = 'public';
        `);
        
        console.log('Table constraints:');
        constraints.rows.forEach(row => {
            console.log(`- ${row.constraint_name}: ${row.constraint_type}`);
            if (row.check_clause) {
                console.log(`  Check clause: ${row.check_clause}`);
            }
        });
        
        // Check column details
        const columns = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'salon_top_history'
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        
        console.log('\nColumn details:');
        columns.rows.forEach(row => {
            console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
        });
        
    } catch (error) {
        console.error('Error checking constraints:', error);
    } finally {
        await pool.end();
    }
}

checkSalonTopConstraints();