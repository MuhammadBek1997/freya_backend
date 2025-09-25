const { pool } = require('./config/database');

async function checkSalonTopHistoryStructure() {
    try {
        console.log('Checking salon_top_history table structure...');
        
        // Check if table exists
        const tableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'salon_top_history'
            );
        `);
        
        if (!tableExists.rows[0].exists) {
            console.log('salon_top_history table does not exist. Creating...');
            await pool.query(`
                CREATE TABLE salon_top_history (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    salon_id UUID NOT NULL REFERENCES salons(id),
                    admin_id UUID NOT NULL REFERENCES admins(id),
                    action VARCHAR(20) NOT NULL DEFAULT 'activate',
                    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    end_date TIMESTAMP,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('salon_top_history table created successfully');
        } else {
            console.log('salon_top_history table exists. Checking structure...');
            
            // Get table structure
            const structure = await pool.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'salon_top_history'
                ORDER BY ordinal_position;
            `);
            
            console.log('Current table structure:');
            structure.rows.forEach(row => {
                console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
            });
            
            // Check if action column exists
            const actionColumn = structure.rows.find(row => row.column_name === 'action');
            if (!actionColumn) {
                console.log('Adding missing action column...');
                await pool.query(`
                    ALTER TABLE salon_top_history 
                    ADD COLUMN action VARCHAR(20) NOT NULL DEFAULT 'activate';
                `);
                console.log('action column added successfully');
            }
        }
        
        console.log('salon_top_history table structure check completed');
        
    } catch (error) {
        console.error('Error checking salon_top_history structure:', error);
    } finally {
        await pool.end();
    }
}

checkSalonTopHistoryStructure();