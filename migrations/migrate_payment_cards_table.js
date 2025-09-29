const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migratePaymentCardsTable() {
    const client = await pool.connect();
    
    try {
        console.log('Starting payment cards table migration...');
        
        // Create payment_cards table
        await client.query(`
            CREATE TABLE IF NOT EXISTS payment_cards (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                card_number_encrypted VARCHAR(255) NOT NULL,
                card_holder_name VARCHAR(100) NOT NULL,
                expiry_month INTEGER NOT NULL CHECK (expiry_month >= 1 AND expiry_month <= 12),
                expiry_year INTEGER NOT NULL CHECK (expiry_year >= EXTRACT(YEAR FROM CURRENT_DATE)),
                card_type VARCHAR(20),
                phone_number VARCHAR(20) NOT NULL,
                is_default BOOLEAN DEFAULT false,
                is_active BOOLEAN DEFAULT true,
                last_four_digits VARCHAR(4) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, card_number_encrypted)
            );
        `);
        
        // Create indexes
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_payment_cards_user_id ON payment_cards(user_id);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_payment_cards_active ON payment_cards(is_active);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_payment_cards_default ON payment_cards(is_default);
        `);
        
        console.log('Payment cards table migration completed successfully!');
        
    } catch (error) {
        console.error('Error during payment cards table migration:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    migratePaymentCardsTable()
        .then(() => {
            console.log('Migration completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { migratePaymentCardsTable };