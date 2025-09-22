const acceptLanguage = require('accept-language-parser');
const i18next = require('../config/i18n');

/**
 * Language detection middleware
 * Detects user's preferred language from various sources
 */
const languageDetection = (req, res, next) => {
  let detectedLanguage = 'en'; // default language

  try {
    // 1. Check for language in query parameters
    if (req.query.lang || req.query.lng) {
      detectedLanguage = req.query.lang || req.query.lng;
    }
    // 2. Check for language in headers
    else if (req.headers['accept-language']) {
      const languages = acceptLanguage.parse(req.headers['accept-language']);
      if (languages.length > 0) {
        // Get the most preferred language
        const preferredLang = languages[0].code;
        // Map common language codes
        const langMap = {
          'uz': 'uz',
          'ru': 'ru',
          'en': 'en',
          'uz-UZ': 'uz',
          'ru-RU': 'ru',
          'en-US': 'en',
          'en-GB': 'en'
        };
        detectedLanguage = langMap[preferredLang] || preferredLang.split('-')[0] || 'en';
      }
    }
    // 3. Check for language in cookies
    else if (req.cookies && req.cookies.language) {
      detectedLanguage = req.cookies.language;
    }
    // 4. Check for language in custom header
    else if (req.headers['x-language']) {
      detectedLanguage = req.headers['x-language'];
    }

    // Validate language (ensure it's supported)
    const supportedLanguages = ['en', 'uz', 'ru'];
    if (!supportedLanguages.includes(detectedLanguage)) {
      detectedLanguage = 'en';
    }

    // Set language in request object
    req.language = detectedLanguage;
    req.t = i18next.getFixedT(detectedLanguage);

    // Set language in response headers
    res.setHeader('Content-Language', detectedLanguage);

    next();
  } catch (error) {
    console.error('Language detection error:', error);
    req.language = 'en';
    req.t = i18next.getFixedT('en');
    next();
  }
};

/**
 * Response localization helper
 * Adds localized response methods to res object
 */
const responseLocalization = (req, res, next) => {
  // Add localized success response method
  res.successLocalized = (data, messageKey = 'success.general', statusCode = 200) => {
    const message = req.t ? req.t(messageKey) : messageKey;
    return res.status(statusCode).json({
      success: true,
      message: message,
      data: data,
      language: req.language || 'en'
    });
  };

  // Add localized error response method
  res.errorLocalized = (messageKey = 'error.general', statusCode = 500, details = null) => {
    const message = req.t ? req.t(messageKey) : messageKey;
    return res.status(statusCode).json({
      success: false,
      message: message,
      error: details,
      language: req.language || 'en'
    });
  };

  // Add localized validation error response method
  res.validationErrorLocalized = (errors, messageKey = 'error.validation') => {
    const message = req.t ? req.t(messageKey) : messageKey;
    return res.status(400).json({
      success: false,
      message: message,
      errors: errors,
      language: req.language || 'en'
    });
  };

  next();
};

/**
 * Set language cookie middleware
 */
const setLanguageCookie = (req, res, next) => {
  if (req.language && req.language !== req.cookies?.language) {
    res.cookie('language', req.language, {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
  }
  next();
};

module.exports = {
  languageDetection,
  responseLocalization,
  setLanguageCookie
};