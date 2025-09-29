const { pool } = require('./config/database');

async function createPaymentCardsTable() {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS payment_cards (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                card_number_encrypted TEXT NOT NULL,
                card_holder_name VARCHAR(255) NOT NULL,
                expiry_month VARCHAR(2) NOT NULL,
                expiry_year VARCHAR(4) NOT NULL,
                phone_number VARCHAR(20) NOT NULL,
                is_default BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        await pool.query(createTableQuery);
        console.log('payment_cards jadvali muvaffaqiyatli yaratildi');

        // Index qo'shamiz
        const createIndexQuery = `
            CREATE INDEX IF NOT EXISTS idx_payment_cards_user_id ON payment_cards(user_id);
        `;
        
        await pool.query(createIndexQuery);
        console.log('payment_cards jadvali uchun index yaratildi');

        process.exit(0);
    } catch (error) {
        console.error('Xatolik:', error);
        process.exit(1);
    }
}

createPaymentCardsTable();