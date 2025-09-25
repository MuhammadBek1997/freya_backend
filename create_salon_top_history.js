const { Pool } = require('pg');

async function createSalonTopHistoryTable() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔧 salon_top_history jadvalini yaratish boshlandi...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS salon_top_history (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
                admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
                action VARCHAR(20) NOT NULL CHECK (action IN ('top', 'untop')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ salon_top_history jadvali muvaffaqiyatli yaratildi!');

    } catch (error) {
        console.error('❌ Xatolik yuz berdi:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

createSalonTopHistoryTable();