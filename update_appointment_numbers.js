const { pool } = require('./config/database');

// Generate new application number with 2 letters + 7 digits format
const generateNewApplicationNumber = (index) => {
    // Generate 2 random letters
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomLetters = letters.charAt(Math.floor(Math.random() * letters.length)) + 
                         letters.charAt(Math.floor(Math.random() * letters.length));
    
    // Format: 2 letters + 7 digits (e.g., AB1234567)
    return `${randomLetters}${String(index).padStart(7, '0')}`;
};

async function updateAllAppointmentNumbers() {
    try {
        console.log('Barcha appointmentlar raqamlarini yangilash boshlandi...');
        
        // Get all appointments
        const result = await pool.query('SELECT id, application_number FROM appointments ORDER BY created_at');
        console.log(`Jami ${result.rows.length} ta appointment topildi`);
        
        if (result.rows.length === 0) {
            console.log('Yangilanishi kerak bo\'lgan appointmentlar topilmadi');
            return;
        }
        
        // Update each appointment with new number
        let updatedCount = 0;
        for (let i = 0; i < result.rows.length; i++) {
            const appointment = result.rows[i];
            const newNumber = generateNewApplicationNumber(i + 1);
            
            try {
                await pool.query(
                    'UPDATE appointments SET application_number = $1 WHERE id = $2',
                    [newNumber, appointment.id]
                );
                
                console.log(`✓ ${appointment.application_number} → ${newNumber}`);
                updatedCount++;
            } catch (updateError) {
                console.error(`✗ Xatolik ${appointment.id} ni yangilashda:`, updateError.message);
            }
        }
        
        console.log(`\n✅ Muvaffaqiyatli yangilandi: ${updatedCount}/${result.rows.length} ta appointment`);
        
        // Verify the changes
        console.log('\n--- Yangilangan appointmentlar ---');
        const verifyResult = await pool.query('SELECT id, application_number FROM appointments ORDER BY created_at');
        verifyResult.rows.forEach((row, index) => {
            console.log(`${index + 1}. ${row.application_number}`);
        });
        
    } catch (error) {
        console.error('Umumiy xatolik:', error);
    } finally {
        await pool.end();
    }
}

// Run the update
updateAllAppointmentNumbers();