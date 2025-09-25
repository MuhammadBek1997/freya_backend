const fs = require('fs').promises;
const path = require('path');
const pool = require('../config/database');

// Sodda tarjima funksiyasi
async function translateSalonData(data, targetLanguage) {
    const translations = {
        'en': {
            'Freya Beauty Salon': 'Freya Beauty Salon',
            'Go\'zallik saloni': 'Beauty Salon',
            'Zamonaviy go\'zallik saloni': 'Modern Beauty Salon',
            'Professional xizmatlar': 'Professional Services',
            'Sifatli xizmat': 'Quality Service',
            'Eng yaxshi mutaxassislar': 'Best Specialists',
            'Salon': 'Salon',
            'Salon haqida malumot': 'Information about salon',
            'Yangi salon': 'New Salon',
            'Test salon': 'Test Salon',
            'Ikkinchi salon': 'Second Salon',
            'Tarjima Test Salon': 'Translation Test Salon',
            'Bu tarjima test uchun salon': 'This is a salon for translation testing',
            'string': 'Description',
            'Ayollar': 'Women',
            'Erkaklar': 'Men',
            'Bolalar': 'Children'
        },
        'ru': {
            'Freya Beauty Salon': 'Салон красоты Freya',
            'Go\'zallik saloni': 'Салон красоты',
            'Zamonaviy go\'zallik saloni': 'Современный салон красоты',
            'Professional xizmatlar': 'Профессиональные услуги',
            'Sifatli xizmat': 'Качественный сервис',
            'Eng yaxshi mutaxassislar': 'Лучшие специалисты',
            'Salon': 'Салон',
            'Salon haqida malumot': 'Информация о салоне',
            'Yangi salon': 'Новый салон',
            'Test salon': 'Тестовый салон',
            'Ikkinchi salon': 'Второй салон',
            'Tarjima Test Salon': 'Тестовый салон для перевода',
            'Bu tarjima test uchun salon': 'Это салон для тестирования перевода',
            'string': 'Описание',
            'Ayollar': 'Женщины',
            'Erkaklar': 'Мужчины',
            'Bolalar': 'Дети'
        }
    };

    const langTranslations = translations[targetLanguage] || {};
    
    // salon_types tarjimasi
    let translatedSalonTypes = [];
    if (data.salon_types && Array.isArray(data.salon_types)) {
        translatedSalonTypes = data.salon_types.map(type => {
            if (typeof type === 'object' && type.name) {
                return {
                    ...type,
                    name: langTranslations[type.name] || type.name
                };
            } else if (typeof type === 'string') {
                return langTranslations[type] || type;
            }
            return type;
        });
    }
    
    // Maydonlarni tarjima qilish
    const translatedName = data.name || data.salon_name;
    const translatedDescription = data.description || data.salon_description;
    const translatedTitle = data.salon_title;
    
    return {
        name: langTranslations[translatedName] || translatedName,
        description: langTranslations[translatedDescription] || translatedDescription,
        salon_title: langTranslations[translatedTitle] || translatedTitle,
        salon_types: translatedSalonTypes
    };
}

class SalonTranslationService {
    constructor() {
        this.localesPath = path.join(__dirname, '../locales');
        this.supportedLanguages = ['uz', 'en', 'ru'];
    }

    // JSON faylni o'qish
    async readLocaleFile(language) {
        try {
            const filePath = path.join(this.localesPath, `${language}.json`);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error reading ${language}.json:`, error);
            return { salons: {}, common: {}, salon: {} };
        }
    }

    // JSON faylga yozish
    async writeLocaleFile(language, data) {
        try {
            const filePath = path.join(this.localesPath, `${language}.json`);
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error(`Error writing ${language}.json:`, error);
            return false;
        }
    }

    // Salon ma'lumotlarini barcha tillarga tarjima qilish va saqlash
    async translateAndStoreSalon(salonData, salonId) {
        try {
            const translations = {};

            // Har bir til uchun tarjima qilish
            for (const lang of this.supportedLanguages) {
                let translatedData;
                
                // salon_types ni to'g'ri formatda olish
                const salonTypes = Array.isArray(salonData.salon_types) ? salonData.salon_types : [];

                if (lang === 'uz') {
                    // O'zbek tili uchun original ma'lumotlarni ishlatamiz
                    translatedData = {
                        name: salonData.name || salonData.salon_name,
                        description: salonData.description || salonData.salon_description,
                        salon_title: salonData.salon_title,
                        salon_types: salonTypes
                    };
                } else {
                    // Boshqa tillar uchun tarjima qilamiz
                    translatedData = await translateSalonData({
                        name: salonData.name || salonData.salon_name,
                        description: salonData.description || salonData.salon_description,
                        salon_title: salonData.salon_title,
                        salon_types: salonTypes
                    }, lang);
                }

                translations[lang] = translatedData;

                // Database'ga saqlash
                await this.saveSalonTranslation(salonId, lang, translatedData.name, translatedData.description, translatedData.salon_title, translatedData.salon_types);

                // JSON faylga ham saqlash (backup uchun)
                const localeData = await this.readLocaleFile(lang);
                localeData.salons[salonId] = translatedData;
                await this.writeLocaleFile(lang, localeData);
            }

            return translations;
        } catch (error) {
            console.error('Translation and storage error:', error);
            throw error;
        }
    }

    // Database'ga tarjima saqlash
    async saveSalonTranslation(salonId, language, name, description, salon_title, salon_types = []) {
        try {
            const query = `
                INSERT INTO salon_translations (salon_id, language, name, description, salon_title, salon_types)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (salon_id, language) 
                DO UPDATE SET 
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    salon_title = EXCLUDED.salon_title,
                    salon_types = EXCLUDED.salon_types,
                    updated_at = CURRENT_TIMESTAMP
            `;
            
            await pool.query(query, [salonId, language, name, description, salon_title, JSON.stringify(salon_types)]);
        } catch (error) {
            console.error('Error saving salon translation:', error);
            throw error;
        }
    }

    // Salon ma'lumotlarini tilga qarab olish
    async getSalonByLanguage(salonId, language = 'uz') {
        try {
            // Agar til qo'llab-quvvatlanmasa, uzbek tilini qaytaramiz
            const lang = this.supportedLanguages.includes(language) ? language : 'uz';
            
            // Database'dan tarjimani olish
            const query = `
                SELECT name, description, salon_title 
                FROM salon_translations 
                WHERE salon_id = $1 AND language = $2
            `;
            
            const result = await pool.query(query, [salonId, lang]);
            
            if (result.rows.length > 0) {
                return result.rows[0];
            }
            
            // Database'da topilmasa, JSON fayldan olish (fallback)
            const localeData = await this.readLocaleFile(lang);
            const jsonResult = localeData.salons[salonId] || null;
            return jsonResult;
        } catch (error) {
            console.error('Get salon by language error:', error);
            return null;
        }
    }

    // Barcha salonlarni tilga qarab olish
    async getAllSalonsByLanguage(language = 'uz') {
        try {
            const lang = this.supportedLanguages.includes(language) ? language : 'uz';
            
            const localeData = await this.readLocaleFile(lang);
            return localeData.salons || {};
        } catch (error) {
            console.error('Get all salons by language error:', error);
            return {};
        }
    }

    // Salon ma'lumotlarini yangilash
    async updateSalonTranslations(salonId, updatedData) {
        try {
            const translations = {};

            // Har bir til uchun yangilash
            for (const lang of this.supportedLanguages) {
                let translatedData;
                
                if (lang === 'uz') {
                    translatedData = {
                        ...updatedData,
                        salon_types: updatedData.salon_types || []
                    };
                } else {
                    translatedData = await translateSalonData({
                        ...updatedData,
                        salon_types: updatedData.salon_types || []
                    }, lang);
                }

                translations[lang] = translatedData;

                // Database'ga saqlash
                await this.saveSalonTranslation(salonId, lang, translatedData.name, translatedData.description, translatedData.salon_title, translatedData.salon_types);

                // JSON faylni yangilash
                const localeData = await this.readLocaleFile(lang);
                if (localeData.salons[salonId]) {
                    localeData.salons[salonId] = { ...localeData.salons[salonId], ...translatedData };
                } else {
                    localeData.salons[salonId] = translatedData;
                }
                await this.writeLocaleFile(lang, localeData);
            }

            return translations;
        } catch (error) {
            console.error('Update salon translations error:', error);
            throw error;
        }
    }

    // Salon ma'lumotlarini o'chirish
    async deleteSalonTranslations(salonId) {
        try {
            for (const lang of this.supportedLanguages) {
                const localeData = await this.readLocaleFile(lang);
                if (localeData.salons[salonId]) {
                    delete localeData.salons[salonId];
                    await this.writeLocaleFile(lang, localeData);
                }
            }
            return true;
        } catch (error) {
            console.error('Delete salon translations error:', error);
            return false;
        }
    }

    // Salon ma'lumotlarini qidirish (tilga qarab)
    async searchSalonsByLanguage(searchTerm, language = 'uz') {
        try {
            const lang = this.supportedLanguages.includes(language) ? language : 'uz';
            const allSalons = await this.getAllSalonsByLanguage(lang);
            
            const searchResults = {};
            const searchLower = searchTerm.toLowerCase();

            for (const [salonId, salonData] of Object.entries(allSalons)) {
                // Salon nomida, tavsifida yoki joylashuvida qidirish
                const searchableFields = [
                    salonData.salon_name,
                    salonData.salon_description,
                    salonData.location,
                    salonData.salon_title
                ].filter(Boolean);

                const found = searchableFields.some(field => 
                    field.toLowerCase().includes(searchLower)
                );

                if (found) {
                    searchResults[salonId] = salonData;
                }
            }

            return searchResults;
        } catch (error) {
            console.error('Search salons by language error:', error);
            return {};
        }
    }

    // Statistika olish
    async getTranslationStats() {
        try {
            const stats = {};
            
            for (const lang of this.supportedLanguages) {
                const localeData = await this.readLocaleFile(lang);
                stats[lang] = {
                    salonCount: Object.keys(localeData.salons || {}).length,
                    lastUpdated: new Date().toISOString()
                };
            }

            return stats;
        } catch (error) {
            console.error('Get translation stats error:', error);
            return {};
        }
    }
}

module.exports = new SalonTranslationService();