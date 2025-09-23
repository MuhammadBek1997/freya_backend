const { pool } = require('./config/database');

async function createEmployeeCommentsTable() {
    try {
        console.log('Creating employee_comments table...');
        
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS employee_comments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                employee_id UUID NOT NULL,
                user_id UUID,
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
            );
        `;
        
        await pool.query(createTableQuery);
        console.log('employee_comments table created successfully');
        
        // Create indexes
        const createIndexes = `
            CREATE INDEX IF NOT EXISTS idx_employee_comments_employee_id ON employee_comments(employee_id);
            CREATE INDEX IF NOT EXISTS idx_employee_comments_user_id ON employee_comments(user_id);
            CREATE INDEX IF NOT EXISTS idx_employee_comments_rating ON employee_comments(rating);
        `;
        
        await pool.query(createIndexes);
        console.log('Indexes created successfully');
        
    } catch (error) {
        console.error('Error creating employee_comments table:', error);
    } finally {
        await pool.end();
    }
}

createEmployeeCommentsTable();