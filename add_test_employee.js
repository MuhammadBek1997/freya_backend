const { pool } = require('./config/database');
require('dotenv').config();

async function addTestEmployee() {
    try {
        // Avval salon qo'shamiz
        const salonResult = await pool.query(`
            INSERT INTO salons (salon_name, salon_phone, salon_description, is_active)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `, ['Test Salon', '+998901234567', 'Test salon for employee login', true]);
        
        const salonId = salonResult.rows[0].id;
        console.log('Salon yaratildi:', salonId);
        
        // Endi employee qo'shamiz
        const employeeResult = await pool.query(`
            INSERT INTO employees (salon_id, name, surname, username, password, email, profession, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [salonId, 'Test', 'Employee', 'testemployee', 'password123', 'test@employee.com', 'Sartarosh', true]);
        
        console.log('Employee yaratildi:', employeeResult.rows[0]);
        
        process.exit(0);
    } catch (error) {
        console.error('Xato:', error);
        process.exit(1);
    }
}

addTestEmployee();