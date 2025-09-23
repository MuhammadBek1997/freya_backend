const { pool } = require('../config/database');

const createEmployeeTranslationsTable = async () => {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS employee_translations (
                id SERIAL PRIMARY KEY,
                employee_id UUID NOT NULL,
                language VARCHAR(5) NOT NULL,
                name VARCHAR(255),
                surname VARCHAR(255),
                profession VARCHAR(255),
                bio TEXT,
                specialization TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
                UNIQUE(employee_id, language)
            );
        `;
        
        await pool.query(createTableQuery);
        console.log('Employee translations table created successfully');
        
        // Index yaratish
        const createIndexQuery = `
            CREATE INDEX IF NOT EXISTS idx_employee_translations_employee_id 
            ON employee_translations(employee_id);
            
            CREATE INDEX IF NOT EXISTS idx_employee_translations_language 
            ON employee_translations(language);
        `;
        
        await pool.query(createIndexQuery);
        console.log('Indexes created successfully');
        
    } catch (error) {
        console.error('Error creating employee_translations table:', error);
    } finally {
        await pool.end();
    }
};

createEmployeeTranslationsTable();