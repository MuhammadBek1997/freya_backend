const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');
const path = require('path');

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    lng: 'en', // default language
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    backend: {
      loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json'),
      addPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.missing.json')
    },
    
    detection: {
      order: ['header', 'querystring', 'cookie'],
      caches: ['cookie'],
      lookupHeader: 'accept-language',
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      
      // options for language detection
      checkWhitelist: true
    },
    
    saveMissing: true,
    saveMissingTo: 'fallback',
    
    interpolation: {
      escapeValue: false
    },
    
    resources: {
      en: {
        translation: {
          "welcome": "Welcome",
          "error": {
            "general": "An error occurred",
            "notFound": "Not found",
            "unauthorized": "Unauthorized",
            "forbidden": "Forbidden",
            "validation": "Validation error"
          },
          "success": {
            "created": "Created successfully",
            "updated": "Updated successfully",
            "deleted": "Deleted successfully"
          }
        }
      },
      uz: {
        translation: {
          "welcome": "Xush kelibsiz",
          "error": {
            "general": "Xatolik yuz berdi",
            "notFound": "Topilmadi",
            "unauthorized": "Ruxsat berilmagan",
            "forbidden": "Taqiqlangan",
            "validation": "Tekshirish xatosi"
          },
          "success": {
            "created": "Muvaffaqiyatli yaratildi",
            "updated": "Muvaffaqiyatli yangilandi",
            "deleted": "Muvaffaqiyatli o'chirildi"
          }
        }
      },
      ru: {
        translation: {
          "welcome": "Добро пожаловать",
          "error": {
            "general": "Произошла ошибка",
            "notFound": "Не найдено",
            "unauthorized": "Неавторизован",
            "forbidden": "Запрещено",
            "validation": "Ошибка валидации"
          },
          "success": {
            "created": "Успешно создано",
            "updated": "Успешно обновлено",
            "deleted": "Успешно удалено"
          }
        }
      }
    }
  });

module.exports = i18next;