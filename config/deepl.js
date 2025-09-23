const { Translator } = require('deepl-node');

// DeepL API konfiguratsiyasi
const DEEPL_API_KEY = process.env.DEEPL_API_KEY || '350821e4-d235-457e-a54e-6e3e55ebe1f6:fx';

// DeepL translator instance yaratish
const translator = new Translator(DEEPL_API_KEY);

// Qo'llab-quvvatlanadigan tillar
const SUPPORTED_LANGUAGES = {
    'uz': 'UZ', // Uzbek (DeepL'da mavjud emas, lekin biz original sifatida ishlatamiz)
    'en': 'EN-US', // English (US)
    'ru': 'RU'  // Russian
};

// Matn tarjima qilish funksiyasi
const translateText = async (text, targetLang, sourceLang = 'auto') => {
    try {
        // Agar target language uzbek bo'lsa, original matnni qaytaramiz
        if (targetLang === 'uz' || targetLang === 'UZ') {
            return text;
        }

        // Agar matn bo'sh bo'lsa
        if (!text || text.trim() === '') {
            return text;
        }

        // DeepL API orqali tarjima qilish
        const result = await translator.translateText(
            text, 
            sourceLang === 'auto' ? null : sourceLang, 
            SUPPORTED_LANGUAGES[targetLang] || targetLang
        );

        return result.text;
    } catch (error) {
        console.error('DeepL translation error:', error);
        // Xato bo'lsa, original matnni qaytaramiz
        return text;
    }
};

// Obyektni tarjima qilish (nested objects uchun)
const translateObject = async (obj, targetLang, sourceLang = 'auto') => {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    const translated = {};

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            translated[key] = await translateText(value, targetLang, sourceLang);
        } else if (Array.isArray(value)) {
            translated[key] = await Promise.all(
                value.map(async (item) => {
                    if (typeof item === 'string') {
                        return await translateText(item, targetLang, sourceLang);
                    } else if (typeof item === 'object') {
                        return await translateObject(item, targetLang, sourceLang);
                    }
                    return item;
                })
            );
        } else if (typeof value === 'object' && value !== null) {
            translated[key] = await translateObject(value, targetLang, sourceLang);
        } else {
            translated[key] = value;
        }
    }

    return translated;
};

// Salon ma'lumotlarini tarjima qilish
const translateSalonData = async (salonData, targetLang) => {
    try {
        // Tarjima qilinadigan maydonlar
        const fieldsToTranslate = [
            'name',
            'description',
            'salon_name',
            'salon_description', 
            'salon_title',
            'salon_orient',
            'location'
        ];

        const translatedData = { ...salonData };

        // Asosiy maydonlarni tarjima qilish
        for (const field of fieldsToTranslate) {
            if (salonData[field]) {
                translatedData[field] = await translateText(salonData[field], targetLang);
            }
        }

        // Array maydonlarini tarjima qilish
        if (salonData.salon_types && Array.isArray(salonData.salon_types)) {
            translatedData.salon_types = await Promise.all(
                salonData.salon_types.map(type => translateText(type, targetLang))
            );
        }

        if (salonData.salon_additionals && Array.isArray(salonData.salon_additionals)) {
            translatedData.salon_additionals = await Promise.all(
                salonData.salon_additionals.map(additional => translateText(additional, targetLang))
            );
        }

        if (salonData.salon_comfort && Array.isArray(salonData.salon_comfort)) {
            translatedData.salon_comfort = await Promise.all(
                salonData.salon_comfort.map(comfort => translateText(comfort, targetLang))
            );
        }

        // Comments array'ini tarjima qilish
        if (salonData.comments && Array.isArray(salonData.comments)) {
            translatedData.comments = await Promise.all(
                salonData.comments.map(async (comment) => {
                    if (typeof comment === 'object') {
                        return await translateObject(comment, targetLang);
                    }
                    return await translateText(comment, targetLang);
                })
            );
        }

        return translatedData;
    } catch (error) {
        console.error('Salon data translation error:', error);
        return salonData; // Xato bo'lsa original ma'lumotni qaytaramiz
    }
};

module.exports = {
    translator,
    translateText,
    translateObject,
    translateSalonData,
    SUPPORTED_LANGUAGES
};