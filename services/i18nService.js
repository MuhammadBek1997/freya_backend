const axios = require('axios');

class I18nService {
  constructor() {
    this.apiKey = process.env.I18N_DEV_API_KEY;
    this.baseURL = 'https://api.i18n.dev/v1'; // Assuming this is the base URL
  }

  /**
   * Translate text using I18n.dev API
   * @param {string} text - Text to translate
   * @param {string} targetLang - Target language code
   * @param {string} sourceLang - Source language code (optional)
   * @returns {Promise<string>} Translated text
   */
  async translateText(text, targetLang, sourceLang = 'auto') {
    try {
      const response = await axios.post(`${this.baseURL}/translate`, {
        text: text,
        target_language: targetLang,
        source_language: sourceLang
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.translated_text || response.data.translation;
    } catch (error) {
      console.error('Translation error:', error.response?.data || error.message);
      throw new Error('Translation failed');
    }
  }

  /**
   * Translate multiple texts at once
   * @param {Array<string>} texts - Array of texts to translate
   * @param {string} targetLang - Target language code
   * @param {string} sourceLang - Source language code (optional)
   * @returns {Promise<Array<string>>} Array of translated texts
   */
  async translateBatch(texts, targetLang, sourceLang = 'auto') {
    try {
      const response = await axios.post(`${this.baseURL}/translate/batch`, {
        texts: texts,
        target_language: targetLang,
        source_language: sourceLang
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.translations || response.data.translated_texts;
    } catch (error) {
      console.error('Batch translation error:', error.response?.data || error.message);
      throw new Error('Batch translation failed');
    }
  }

  /**
   * Get supported languages
   * @returns {Promise<Array>} Array of supported language codes
   */
  async getSupportedLanguages() {
    try {
      // Return static supported languages instead of calling external API
      const supportedLanguages = [
        { code: 'uz', name: 'O\'zbek' },
        { code: 'ru', name: 'Русский' },
        { code: 'en', name: 'English' }
      ];
      
      return supportedLanguages;
    } catch (error) {
      console.error('Get languages error:', error.message);
      throw new Error('Failed to get supported languages');
    }
  }

  /**
   * Detect language of text
   * @param {string} text - Text to detect language for
   * @returns {Promise<string>} Detected language code
   */
  async detectLanguage(text) {
    try {
      const response = await axios.post(`${this.baseURL}/detect`, {
        text: text
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.language || response.data.detected_language;
    } catch (error) {
      console.error('Language detection error:', error.response?.data || error.message);
      throw new Error('Language detection failed');
    }
  }

  /**
   * Translate object with nested properties
   * @param {Object} obj - Object to translate
   * @param {string} targetLang - Target language code
   * @param {string} sourceLang - Source language code (optional)
   * @returns {Promise<Object>} Translated object
   */
  async translateObject(obj, targetLang, sourceLang = 'auto') {
    const translateValue = async (value) => {
      if (typeof value === 'string') {
        return await this.translateText(value, targetLang, sourceLang);
      } else if (Array.isArray(value)) {
        return await Promise.all(value.map(translateValue));
      } else if (typeof value === 'object' && value !== null) {
        const translatedObj = {};
        for (const [key, val] of Object.entries(value)) {
          translatedObj[key] = await translateValue(val);
        }
        return translatedObj;
      }
      return value;
    };

    return await translateValue(obj);
  }
}

module.exports = new I18nService();