require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('./config/database');

(async () => {
    try {
        const hash = await bcrypt.hash('admin123', 10);
        const result = await pool.query('UPDATE admins SET password_hash = $1', [hash]);
        console.log('Barcha adminlar paroli yangilandi:', result.rowCount);
        process.exit(0);
    } catch(err) {
        console.error('Xato:', err.message);
        process.exit(1);
    }
})();