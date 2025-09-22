const { Translate } = require('@google-cloud/translate').v2;

class TranslationService {
    constructor() {
        // Google Translate API key environment variable orqali olinadi
        this.translate = new Translate({
            key: process.env.GOOGLE_TRANSLATE_API_KEY
        });
        
        // Qo'llab-quvvatlanadigan tillar
        this.supportedLanguages = {
            uz: 'uz', // O'zbek tili
            ru: 'ru', // Rus tili
            en: 'en'  // Ingliz tili
        };
    }

    /**
     * Matnni berilgan tilga tarjima qilish
     * @param {string} text - Tarjima qilinadigan matn
     * @param {string} targetLanguage - Maqsadli til kodi (uz, ru, en)
     * @param {string} sourceLanguage - Manba til kodi (ixtiyoriy)
     * @returns {Promise<Object>} - Tarjima natijasi
     */
    async translateText(text, targetLanguage, sourceLanguage = null) {
        try {
            if (!text || text.trim() === '') {
                return {
                    success: false,
                    error: 'Tarjima qilinadigan matn bo\'sh bo\'lishi mumkin emas'
                };
            }

            if (!this.supportedLanguages[targetLanguage]) {
                return {
                    success: false,
                    error: `Qo'llab-quvvatlanmaydigan til: ${targetLanguage}. Mavjud tillar: ${Object.keys(this.supportedLanguages).join(', ')}`
                };
            }

            const options = {
                to: targetLanguage
            };

            if (sourceLanguage && this.supportedLanguages[sourceLanguage]) {
                options.from = sourceLanguage;
            }

            const [translation] = await this.translate.translate(text, options);

            return {
                success: true,
                data: {
                    originalText: text,
                    translatedText: translation,
                    sourceLanguage: sourceLanguage || 'auto-detected',
                    targetLanguage: targetLanguage
                }
            };
        } catch (error) {
            console.error('Tarjima xatoligi:', error);
            return {
                success: false,
                error: error.message || 'Tarjima jarayonida xatolik yuz berdi'
            };
        }
    }

    /**
     * Matnni barcha qo'llab-quvvatlanadigan tillarga tarjima qilish
     * @param {string} text - Tarjima qilinadigan matn
     * @param {string} sourceLanguage - Manba til kodi (ixtiyoriy)
     * @returns {Promise<Object>} - Barcha tillar uchun tarjima natijalari
     */
    async translateToAllLanguages(text, sourceLanguage = null) {
        try {
            if (!text || text.trim() === '') {
                return {
                    success: false,
                    error: 'Tarjima qilinadigan matn bo\'sh bo\'lishi mumkin emas'
                };
            }

            const translations = {};
            const errors = [];

            // Har bir til uchun tarjima qilish
            for (const [langCode, langValue] of Object.entries(this.supportedLanguages)) {
                try {
                    const result = await this.translateText(text, langCode, sourceLanguage);
                    if (result.success) {
                        translations[langCode] = result.data.translatedText;
                    } else {
                        errors.push(`${langCode}: ${result.error}`);
                    }
                } catch (error) {
                    errors.push(`${langCode}: ${error.message}`);
                }
            }

            return {
                success: Object.keys(translations).length > 0,
                data: {
                    originalText: text,
                    translations: translations,
                    sourceLanguage: sourceLanguage || 'auto-detected'
                },
                errors: errors.length > 0 ? errors : null
            };
        } catch (error) {
            console.error('Barcha tillarga tarjima xatoligi:', error);
            return {
                success: false,
                error: error.message || 'Tarjima jarayonida xatolik yuz berdi'
            };
        }
    }

    /**
     * Tilni aniqlash
     * @param {string} text - Tahlil qilinadigan matn
     * @returns {Promise<Object>} - Aniqlangan til ma'lumotlari
     */
    async detectLanguage(text) {
        try {
            if (!text || text.trim() === '') {
                return {
                    success: false,
                    error: 'Tahlil qilinadigan matn bo\'sh bo\'lishi mumkin emas'
                };
            }

            const [detection] = await this.translate.detect(text);

            return {
                success: true,
                data: {
                    text: text,
                    language: detection.language,
                    confidence: detection.confidence
                }
            };
        } catch (error) {
            console.error('Til aniqlash xatoligi:', error);
            return {
                success: false,
                error: error.message || 'Til aniqlashda xatolik yuz berdi'
            };
        }
    }

    /**
     * Qo'llab-quvvatlanadigan tillar ro'yxatini olish
     * @returns {Object} - Qo'llab-quvvatlanadigan tillar
     */
    getSupportedLanguages() {
        return {
            success: true,
            data: this.supportedLanguages
        };
    }
}

module.exports = new TranslationService();