const { pool } = require('../config/database');

const createAppointmentTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS appointments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                application_number VARCHAR(20) UNIQUE NOT NULL,
                user_id UUID NOT NULL,
                user_name VARCHAR(255) NOT NULL,
                phone_number VARCHAR(20) NOT NULL,
                application_date DATE NOT NULL,
                application_time TIME NOT NULL,
                schedule_id UUID NOT NULL,
                employee_id UUID,
                service_name VARCHAR(255),
                service_price DECIMAL(10,2),
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'cancelled', 'accepted', 'ignored', 'done')),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
            );
        `;

        await pool.query(query);
        console.log('Appointments table yaratildi');

        // Index'lar yaratish
        await pool.query('CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_appointments_schedule_id ON appointments(schedule_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_appointments_application_date ON appointments(application_date)');
        
        console.log('Appointments table index\'lari yaratildi');

        // Application number uchun sequence yaratish
        await pool.query(`
            CREATE SEQUENCE IF NOT EXISTS appointment_number_seq 
            START WITH 1000 
            INCREMENT BY 1;
        `);
        
        console.log('Appointment number sequence yaratildi');

    } catch (error) {
        console.error('Appointment table yaratishda xatolik:', error);
        throw error;
    }
};

module.exports = createAppointmentTable;

// Agar to'g'ridan-to'g'ri ishga tushirilsa
if (require.main === module) {
    createAppointmentTable()
        .then(() => {
            console.log('Migration muvaffaqiyatli bajarildi');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration xatolik:', error);
            process.exit(1);
        });
}