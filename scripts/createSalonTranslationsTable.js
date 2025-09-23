const pool = require('../config/database');

async function createSalonTranslationsTable() {
    try {
        console.log('🔧 Salon translations jadvalini yaratish...');
        
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS salon_translations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                salon_id UUID NOT NULL,
                language VARCHAR(5) NOT NULL,
                name VARCHAR(255),
                description TEXT,
                address TEXT,
                salon_title VARCHAR(255),
                salon_orient JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
                UNIQUE(salon_id, language)
            );
        `;
        
        await pool.query(createTableQuery);
        console.log('✅ Salon translations jadvali muvaffaqiyatli yaratildi');
        
        // Index yaratish
        const createIndexQuery = `
            CREATE INDEX IF NOT EXISTS idx_salon_translations_salon_id ON salon_translations(salon_id);
            CREATE INDEX IF NOT EXISTS idx_salon_translations_language ON salon_translations(language);
        `;
        
        await pool.query(createIndexQuery);
        console.log('✅ Salon translations jadvali uchun indexlar yaratildi');
        
    } catch (error) {
        console.error('❌ Salon translations jadvalini yaratishda xatolik:', error);
    } finally {
        process.exit(0);
    }
}

createSalonTranslationsTable();