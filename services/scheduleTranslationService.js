const fs = require('fs').promises;
const path = require('path');
const pool = require('../config/database');

// Sodda tarjima funksiyasi
async function translateScheduleData(data, targetLanguage) {
    const translations = {
        'en': {
            'Soch kesish': 'Haircut',
            'Soch bo\'yash': 'Hair Coloring',
            'Manikur': 'Manicure',
            'Pedikur': 'Pedicure',
            'Massaj': 'Massage',
            'Kosmetik xizmat': 'Cosmetic Service',
            'Yuz parvarishi': 'Facial Care',
            'Professional xizmat': 'Professional Service',
            'Sifatli xizmat': 'Quality Service'
        },
        'ru': {
            'Soch kesish': 'Стрижка',
            'Soch bo\'yash': 'Окрашивание волос',
            'Manikur': 'Маникюр',
            'Pedikur': 'Педикюр',
            'Massaj': 'Массаж',
            'Kosmetik xizmat': 'Косметическая услуга',
            'Yuz parvarishi': 'Уход за лицом',
            'Professional xizmat': 'Профессиональная услуга',
            'Sifatli xizmat': 'Качественная услуга'
        }
    };

    const langTranslations = translations[targetLanguage] || {};
    
    return {
        title: langTranslations[data.title] || data.title,
        description: langTranslations[data.description] || data.description,
        service_name: langTranslations[data.service_name] || data.service_name,
        notes: langTranslations[data.notes] || data.notes
    };
}

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

class ScheduleTranslationService {
    constructor() {
        this.supportedLanguages = ['uz', 'en', 'ru'];
    }

    async readLocaleFile(language) {
        try {
            const filePath = path.join(__dirname, '..', 'locales', `${language}.json`);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.log(`Creating new locale file for ${language}`);
            return { schedules: {} };
        }
    }

    async writeLocaleFile(language, data) {
        try {
            const localesDir = path.join(__dirname, '..', 'locales');
            await fs.mkdir(localesDir, { recursive: true });
            
            const filePath = path.join(localesDir, `${language}.json`);
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        } catch (error) {
            console.error(`Error writing locale file for ${language}:`, error);
        }
    }

    async translateAndStoreSchedule(scheduleData, scheduleId) {
        try {
            const translations = {};

            for (const lang of this.supportedLanguages) {
                let translatedData;
                
                if (lang === 'uz') {
                    translatedData = {
                        title: scheduleData.title,
                        description: scheduleData.description,
                        service_name: scheduleData.service_name,
                        notes: scheduleData.notes
                    };
                } else {
                    translatedData = await translateScheduleData(scheduleData, lang);
                }

                translations[lang] = translatedData;

                await saveScheduleTranslation(scheduleId, lang, translatedData.title, translatedData.description, translatedData.service_name, translatedData.notes);

                const localeData = await this.readLocaleFile(lang);
                if (!localeData.schedules) {
                    localeData.schedules = {};
                }
                localeData.schedules[scheduleId] = translatedData;
                await this.writeLocaleFile(lang, localeData);
            }

            return translations;
        } catch (error) {
            console.error('Translation and storage error:', error);
            throw error;
        }
    }

    async getScheduleByLanguage(scheduleId, language = 'uz') {
        try {
            const lang = this.supportedLanguages.includes(language) ? language : 'uz';
            
            const query = `
                SELECT title, description, service_name, notes 
                FROM schedule_translations 
                WHERE schedule_id = $1 AND language = $2
            `;
            
            const result = await pool.query(query, [scheduleId, lang]);
            
            if (result.rows.length > 0) {
                return result.rows[0];
            }
            
            const localeData = await this.readLocaleFile(lang);
            return localeData.schedules[scheduleId] || null;
        } catch (error) {
            console.error('Get schedule by language error:', error);
            return null;
        }
    }

    async updateScheduleTranslations(scheduleId, scheduleData) {
        try {
            return await this.translateAndStoreSchedule(scheduleData, scheduleId);
        } catch (error) {
            console.error('Update schedule translations error:', error);
            throw error;
        }
    }
}

module.exports = new ScheduleTranslationService();