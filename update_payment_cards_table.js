const { pool } = require('./config/database');

async function updatePaymentCardsTable() {
    try {
        // card_type ustunini qo'shamiz
        await pool.query(`
            ALTER TABLE payment_cards 
            ADD COLUMN IF NOT EXISTS card_type VARCHAR(50);
        `);
        console.log('card_type ustuni qo\'shildi');

        // last_four_digits ustunini qo'shamiz
        await pool.query(`
            ALTER TABLE payment_cards 
            ADD COLUMN IF NOT EXISTS last_four_digits VARCHAR(4);
        `);
        console.log('last_four_digits ustuni qo\'shildi');

        console.log('payment_cards jadvali muvaffaqiyatli yangilandi');
        process.exit(0);
    } catch (error) {
        console.error('Xatolik:', error);
        process.exit(1);
    }
}

updatePaymentCardsTable();