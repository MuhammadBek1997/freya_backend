const express = require('express');
const router = express.Router();
const i18nService = require('../services/i18nService');

/**
 * @swagger
 * components:
 *   schemas:
 *     TranslationRequest:
 *       type: object
 *       required:
 *         - text
 *         - targetLanguage
 *       properties:
 *         text:
 *           type: string
 *           description: Text to translate
 *         targetLanguage:
 *           type: string
 *           description: Target language code (en, uz, ru)
 *         sourceLanguage:
 *           type: string
 *           description: Source language code (optional, auto-detect if not provided)
 *     
 *     BatchTranslationRequest:
 *       type: object
 *       required:
 *         - texts
 *         - targetLanguage
 *       properties:
 *         texts:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of texts to translate
 *         targetLanguage:
 *           type: string
 *           description: Target language code (en, uz, ru)
 *         sourceLanguage:
 *           type: string
 *           description: Source language code (optional, auto-detect if not provided)
 *     
 *     LanguageDetectionRequest:
 *       type: object
 *       required:
 *         - text
 *       properties:
 *         text:
 *           type: string
 *           description: Text to detect language for
 */

/**
 * @swagger
 * /api/i18n/translate:
 *   post:
 *     summary: Translate text using I18n.dev API
 *     tags: [I18n]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TranslationRequest'
 *     responses:
 *       200:
 *         description: Translation successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     originalText:
 *                       type: string
 *                     translatedText:
 *                       type: string
 *                     sourceLanguage:
 *                       type: string
 *                     targetLanguage:
 *                       type: string
 *                 language:
 *                   type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Translation failed
 */
router.post('/translate', async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage = 'auto' } = req.body;

    if (!text || !targetLanguage) {
      return res.validationErrorLocalized(
        { text: 'Text is required', targetLanguage: 'Target language is required' },
        'error.validation'
      );
    }

    const translatedText = await i18nService.translateText(text, targetLanguage, sourceLanguage);

    return res.successLocalized({
      originalText: text,
      translatedText: translatedText,
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage
    }, 'success.created');

  } catch (error) {
    console.error('Translation error:', error);
    return res.errorLocalized('error.general', 500, error.message);
  }
});

/**
 * @swagger
 * /api/i18n/translate/batch:
 *   post:
 *     summary: Translate multiple texts at once
 *     tags: [I18n]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BatchTranslationRequest'
 *     responses:
 *       200:
 *         description: Batch translation successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     originalTexts:
 *                       type: array
 *                       items:
 *                         type: string
 *                     translatedTexts:
 *                       type: array
 *                       items:
 *                         type: string
 *                     sourceLanguage:
 *                       type: string
 *                     targetLanguage:
 *                       type: string
 *                 language:
 *                   type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Translation failed
 */
router.post('/translate/batch', async (req, res) => {
  try {
    const { texts, targetLanguage, sourceLanguage = 'auto' } = req.body;

    if (!texts || !Array.isArray(texts) || texts.length === 0 || !targetLanguage) {
      return res.validationErrorLocalized(
        { 
          texts: 'Texts array is required and must not be empty', 
          targetLanguage: 'Target language is required' 
        },
        'error.validation'
      );
    }

    const translatedTexts = await i18nService.translateBatch(texts, targetLanguage, sourceLanguage);

    return res.successLocalized({
      originalTexts: texts,
      translatedTexts: translatedTexts,
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage
    }, 'success.created');

  } catch (error) {
    console.error('Batch translation error:', error);
    return res.errorLocalized('error.general', 500, error.message);
  }
});

/**
 * @swagger
 * /api/i18n/detect:
 *   post:
 *     summary: Detect language of text
 *     tags: [I18n]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LanguageDetectionRequest'
 *     responses:
 *       200:
 *         description: Language detection successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                     detectedLanguage:
 *                       type: string
 *                 language:
 *                   type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Language detection failed
 */
router.post('/detect', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.validationErrorLocalized(
        { text: 'Text is required' },
        'error.validation'
      );
    }

    const detectedLanguage = await i18nService.detectLanguage(text);

    return res.successLocalized({
      text: text,
      detectedLanguage: detectedLanguage
    }, 'success.created');

  } catch (error) {
    console.error('Language detection error:', error);
    return res.errorLocalized('error.general', 500, error.message);
  }
});

/**
 * @swagger
 * /api/i18n/languages:
 *   get:
 *     summary: Get supported languages
 *     tags: [I18n]
 *     responses:
 *       200:
 *         description: Supported languages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     supportedLanguages:
 *                       type: array
 *                       items:
 *                         type: string
 *                 language:
 *                   type: string
 *       500:
 *         description: Failed to get supported languages
 */
router.get('/languages', async (req, res) => {
  try {
    const supportedLanguages = await i18nService.getSupportedLanguages();

    return res.successLocalized({
      supportedLanguages: supportedLanguages
    }, 'success.created');

  } catch (error) {
    console.error('Get languages error:', error);
    return res.errorLocalized('error.general', 500, error.message);
  }
});

/**
 * @swagger
 * /api/i18n/current-language:
 *   get:
 *     summary: Get current detected language
 *     tags: [I18n]
 *     responses:
 *       200:
 *         description: Current language retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     currentLanguage:
 *                       type: string
 *                     supportedLanguages:
 *                       type: array
 *                       items:
 *                         type: string
 *                 language:
 *                   type: string
 */
router.get('/current-language', (req, res) => {
  try {
    const currentLanguage = req.language || 'en';
    const supportedLanguages = ['en', 'uz', 'ru'];

    return res.successLocalized({
      currentLanguage: currentLanguage,
      supportedLanguages: supportedLanguages
    }, 'success.created');

  } catch (error) {
    console.error('Get current language error:', error);
    return res.errorLocalized('error.general', 500, error.message);
  }
});

module.exports = router;