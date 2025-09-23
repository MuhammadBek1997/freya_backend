const { pool } = require('../config/database');

class EmployeeTranslationService {
    constructor() {
        this.supportedLanguages = ['en', 'uz', 'ru'];
    }

    // Employee ma'lumotlarini tilga qarab olish
    async getEmployeeByLanguage(employeeId, language = 'uz') {
        try {
            console.log(`Getting translation for employee ${employeeId} in language ${language}`);
            const lang = this.supportedLanguages.includes(language) ? language : 'uz';
            console.log(`Final language to use: ${lang}`);
            
            // Database'dan tarjimani olish
            const query = `
                SELECT name, surname, profession, bio, specialization 
                FROM employee_translations 
                WHERE employee_id = $1 AND language = $2
            `;
            
            console.log(`Executing query with params: [${employeeId}, ${lang}]`);
            const result = await pool.query(query, [employeeId, lang]);
            
            console.log(`Database query result for employee ${employeeId}:`, result.rows);
            
            if (result.rows.length > 0) {
                console.log(`Found translation in database:`, result.rows[0]);
                return result.rows[0];
            }
            
            return null;
        } catch (error) {
            console.error('Get employee by language error:', error);
            return null;
        }
    }

    // Employee tarjimalarini saqlash
    async saveEmployeeTranslation(employeeId, language, name, surname, profession, bio, specialization) {
        try {
            const query = `
                INSERT INTO employee_translations (employee_id, language, name, surname, profession, bio, specialization)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (employee_id, language)
                DO UPDATE SET 
                    name = EXCLUDED.name,
                    surname = EXCLUDED.surname,
                    profession = EXCLUDED.profession,
                    bio = EXCLUDED.bio,
                    specialization = EXCLUDED.specialization,
                    updated_at = CURRENT_TIMESTAMP
            `;
            
            await pool.query(query, [employeeId, language, name, surname, profession, bio, specialization]);
            console.log(`Employee translation saved for ${employeeId} in ${language}`);
        } catch (error) {
            console.error('Save employee translation error:', error);
            throw error;
        }
    }

    // Employee ma'lumotlarini barcha tillarga tarjima qilish va saqlash
    async translateAndStoreEmployee(employeeData, employeeId) {
        try {
            const translations = {};

            // Manual tarjimalar
            const manualTranslations = {
                // Umumiy kasblar
                'Sartarosh': {
                    en: 'Hairdresser',
                    ru: 'Парикмахер',
                    uz: 'Sartarosh'
                },
                'Kosmetolog': {
                    en: 'Cosmetologist',
                    ru: 'Косметолог',
                    uz: 'Kosmetolog'
                },
                'Massajchi': {
                    en: 'Massage Therapist',
                    ru: 'Массажист',
                    uz: 'Massajchi'
                },
                'Manikürchi': {
                    en: 'Manicurist',
                    ru: 'Мастер маникюра',
                    uz: 'Manikürchi'
                },
                'Pedikyurchi': {
                    en: 'Pedicurist',
                    ru: 'Мастер педикюра',
                    uz: 'Pedikyurchi'
                },
                'Stilist': {
                    en: 'Stylist',
                    ru: 'Стилист',
                    uz: 'Stilist'
                },
                'Vizajist': {
                    en: 'Makeup Artist',
                    ru: 'Визажист',
                    uz: 'Vizajist'
                },
                'Barber': {
                    en: 'Barber',
                    ru: 'Барбер',
                    uz: 'Barber'
                }
            };

            // Har bir til uchun tarjima qilish
            for (const lang of this.supportedLanguages) {
                let translatedData;
                
                if (lang === 'uz') {
                    // Uzbek uchun original ma'lumotni saqlaymiz
                    translatedData = {
                        name: employeeData.name,
                        surname: employeeData.surname,
                        profession: employeeData.profession,
                        bio: employeeData.bio || '',
                        specialization: employeeData.specialization || ''
                    };
                } else {
                    // Boshqa tillar uchun manual tarjima
                    translatedData = {
                        name: employeeData.name, // Ismlar odatda tarjima qilinmaydi
                        surname: employeeData.surname,
                        profession: manualTranslations[employeeData.profession]?.[lang] || employeeData.profession,
                        bio: employeeData.bio || '',
                        specialization: employeeData.specialization || ''
                    };
                }

                translations[lang] = translatedData;

                // Database'ga saqlash
                await this.saveEmployeeTranslation(
                    employeeId, 
                    lang, 
                    translatedData.name, 
                    translatedData.surname,
                    translatedData.profession,
                    translatedData.bio,
                    translatedData.specialization
                );
            }

            return translations;
        } catch (error) {
            console.error('Translation and storage error:', error);
            throw error;
        }
    }

    // Employee tarjimalarini yangilash
    async updateEmployeeTranslations(employeeId, employeeData) {
        try {
            return await this.translateAndStoreEmployee(employeeData, employeeId);
        } catch (error) {
            console.error('Update employee translations error:', error);
            throw error;
        }
    }
}

module.exports = new EmployeeTranslationService();