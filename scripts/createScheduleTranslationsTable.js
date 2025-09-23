const { pool } = require('../config/database');

const createScheduleTranslationsTable = async () => {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS schedule_translations (
                id SERIAL PRIMARY KEY,
                schedule_id UUID NOT NULL,
                language VARCHAR(5) NOT NULL,
                name VARCHAR(255),
                title VARCHAR(255),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
                UNIQUE(schedule_id, language)
            );
        `;
        
        await pool.query(createTableQuery);
        console.log('Schedule translations table created successfully');
        
        // Index yaratish
        const createIndexQuery = `
            CREATE INDEX IF NOT EXISTS idx_schedule_translations_schedule_id 
            ON schedule_translations(schedule_id);
            
            CREATE INDEX IF NOT EXISTS idx_schedule_translations_language 
            ON schedule_translations(language);
        `;
        
        await pool.query(createIndexQuery);
        console.log('Indexes created successfully');
        
    } catch (error) {
        console.error('Error creating schedule_translations table:', error);
    } finally {
        await pool.end();
    }
};

createScheduleTranslationsTable();