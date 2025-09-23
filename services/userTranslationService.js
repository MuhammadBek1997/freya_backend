const { pool } = require('../config/database');

class UserTranslationService {
    
    async getUserByLanguage(userId, language) {
        try {
            console.log(`Getting translation for user ${userId} in language ${language}`);
            
            // Avval translation jadvalidan qidiramiz
            const result = await pool.query(`
                SELECT ut.name, ut.surname, ut.bio,
                       u.email, u.phone, u.avatar_url, u.is_active, u.created_at
                FROM user_translations ut
                JOIN users u ON u.id = ut.user_id
                WHERE ut.user_id = $1 AND ut.language = $2
            `, [userId, language]);
            
            if (result.rows.length > 0) {
                console.log(`Found translation in database:`, result.rows[0]);
                return result.rows[0];
            }
            
            // Agar translation topilmasa, original ma'lumotni qaytaramiz
            const originalResult = await pool.query(`
                SELECT * FROM users WHERE id = $1
            `, [userId]);
            
            return originalResult.rows[0] || null;
        } catch (error) {
            console.error('Get user translation error:', error);
            return null;
        }
    }

    async saveUserTranslation(userId, language, name, surname, bio) {
        try {
            await pool.query(`
                INSERT INTO user_translations (user_id, language, name, surname, bio)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (user_id, language) 
                DO UPDATE SET 
                    name = EXCLUDED.name,
                    surname = EXCLUDED.surname,
                    bio = EXCLUDED.bio,
                    updated_at = CURRENT_TIMESTAMP
            `, [userId, language, name, surname, bio]);
            
            console.log(`User translation saved for ${userId} in ${language}`);
        } catch (error) {
            console.error('Save user translation error:', error);
        }
    }

    async translateAndStoreUser(userData, userId) {
        try {
            const translations = {};
            
            // Manual translations for common terms
            const manualTranslations = {
                'Mijoz': {
                    'uz': 'Mijoz',
                    'en': 'Customer',
                    'ru': 'Клиент'
                },
                'Foydalanuvchi': {
                    'uz': 'Foydalanuvchi',
                    'en': 'User',
                    'ru': 'Пользователь'
                }
            };

            const languages = ['uz', 'en', 'ru'];
            
            for (const lang of languages) {
                const translatedData = {
                    name: userData.name || 'Foydalanuvchi',
                    surname: userData.surname || '',
                    bio: userData.bio || ''
                };

                // Manual translation qo'llash
                if (manualTranslations[translatedData.name] && manualTranslations[translatedData.name][lang]) {
                    translatedData.name = manualTranslations[translatedData.name][lang];
                }

                translations[lang] = translatedData;

                // Ma'lumotni saqlash
                await this.saveUserTranslation(
                    userId,
                    lang,
                    translatedData.name,
                    translatedData.surname,
                    translatedData.bio
                );
            }

            return translations;
        } catch (error) {
            console.error('Translation and storage error:', error);
            return {};
        }
    }

    async updateUserTranslations(userId, userData) {
        try {
            return await this.translateAndStoreUser(userData, userId);
        } catch (error) {
            console.error('Update user translations error:', error);
            return {};
        }
    }
}

module.exports = new UserTranslationService();