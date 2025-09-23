const { pool } = require('../config/database');

const createUserTranslationsTable = async () => {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS user_translations (
                id SERIAL PRIMARY KEY,
                user_id UUID NOT NULL,
                language VARCHAR(5) NOT NULL,
                name VARCHAR(255),
                surname VARCHAR(255),
                bio TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(user_id, language)
            );
        `;
        
        await pool.query(createTableQuery);
        console.log('User translations table created successfully');
        
        // Index yaratish
        const createIndexQuery = `
            CREATE INDEX IF NOT EXISTS idx_user_translations_user_id 
            ON user_translations(user_id);
            
            CREATE INDEX IF NOT EXISTS idx_user_translations_language 
            ON user_translations(language);
        `;
        
        await pool.query(createIndexQuery);
        console.log('Indexes created successfully');
        
    } catch (error) {
        console.error('Error creating user_translations table:', error);
    } finally {
        await pool.end();
    }
};

createUserTranslationsTable();