const { pool } = require('./config/database');

async function createEmployeeTranslationsTable() {
    try {
        console.log('Checking if employee_translations table exists...');
        
        // Check if table exists
        const checkTableQuery = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'employee_translations'
            );
        `;
        
        const tableExists = await pool.query(checkTableQuery);
        
        if (tableExists.rows[0].exists) {
            console.log('Employee_translations table already exists');
        } else {
            console.log('Creating employee_translations table...');
            
            const createTableQuery = `
                CREATE TABLE employee_translations (
                    id SERIAL PRIMARY KEY,
                    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
                    language VARCHAR(5) NOT NULL DEFAULT 'uz',
                    name VARCHAR(100),
                    surname VARCHAR(100),
                    profession VARCHAR(100),
                    bio TEXT,
                    specialization TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(employee_id, language)
                );
            `;
            
            await pool.query(createTableQuery);
            console.log('Employee_translations table created successfully');
            
            // Create index for better performance
            const createIndexQuery = `
                CREATE INDEX idx_employee_translations_employee_id_language 
                ON employee_translations(employee_id, language);
            `;
            
            await pool.query(createIndexQuery);
            console.log('Index created successfully');
        }
        
        // Check table structure
        const structureQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'employee_translations'
            ORDER BY ordinal_position;
        `;
        
        const structure = await pool.query(structureQuery);
        console.log('\nEmployee_translations table structure:');
        structure.rows.forEach(row => {
            console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
        });
        
    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        process.exit(0);
    }
}

createEmployeeTranslationsTable();