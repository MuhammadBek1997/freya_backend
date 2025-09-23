const { pool } = require('../config/database');

// Schedule uchun tarjima olish
const getScheduleByLanguage = async (scheduleId, language) => {
    try {
        const query = `
            SELECT * FROM schedule_translations 
            WHERE schedule_id = $1 AND language = $2
        `;
        const result = await pool.query(query, [scheduleId, language]);
        
        if (result.rows.length > 0) {
            return result.rows[0];
        }
        
        return null;
    } catch (error) {
        console.error('Error getting schedule translation:', error);
        return null;
    }
};

// Schedule tarjimasini saqlash
const saveScheduleTranslation = async (scheduleId, language, translatedData) => {
    try {
        const query = `
            INSERT INTO schedule_translations (schedule_id, language, name, title, description)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (schedule_id, language) 
            DO UPDATE SET 
                name = EXCLUDED.name,
                title = EXCLUDED.title,
                description = EXCLUDED.description,
                updated_at = CURRENT_TIMESTAMP
        `;
        
        await pool.query(query, [
            scheduleId,
            language,
            translatedData.name,
            translatedData.title,
            translatedData.description
        ]);
        
        return true;
    } catch (error) {
        console.error('Error saving schedule translation:', error);
        return false;
    }
};

// Schedule'ni tarjima qilish va saqlash
const translateAndStoreSchedule = async (scheduleId, originalData) => {
    try {
        const languages = ['en', 'ru', 'uz'];
        
        for (const language of languages) {
            if (language === 'uz') {
                // O'zbek tili uchun original ma'lumotlarni saqlash
                await saveScheduleTranslation(scheduleId, language, {
                    name: originalData.name,
                    title: originalData.title,
                    description: originalData.description
                });
            } else {
                // Boshqa tillar uchun tarjima (hozircha original ma'lumotlarni saqlaymiz)
                // Kelajakda Google Translate API yoki boshqa tarjima xizmati qo'shilishi mumkin
                await saveScheduleTranslation(scheduleId, language, {
                    name: originalData.name,
                    title: originalData.title,
                    description: originalData.description
                });
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error translating and storing schedule:', error);
        return false;
    }
};

// Barcha schedule'larni yangilash
const updateScheduleTranslations = async () => {
    try {
        const schedulesQuery = 'SELECT * FROM schedules WHERE is_active = true';
        const schedules = await pool.query(schedulesQuery);
        
        for (const schedule of schedules.rows) {
            await translateAndStoreSchedule(schedule.id, {
                name: schedule.name,
                title: schedule.title,
                description: schedule.description
            });
        }
        
        console.log(`Updated translations for ${schedules.rows.length} schedules`);
        return true;
    } catch (error) {
        console.error('Error updating schedule translations:', error);
        return false;
    }
};

module.exports = {
    getScheduleByLanguage,
    saveScheduleTranslation,
    translateAndStoreSchedule,
    updateScheduleTranslations
};