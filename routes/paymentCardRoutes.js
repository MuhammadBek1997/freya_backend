const express = require('express');
const router = express.Router();
const {
    addPaymentCard,
    getUserPaymentCards,
    updatePaymentCard,
    deletePaymentCard,
    setDefaultCard,
    sendCardVerificationCode,
    verifyAndAddCard,
    getPaymentCardStats,
    validateCardForMobile,
    getSupportedCardTypes
} = require('../controllers/paymentCardController');
const { verifyUser } = require('../middleware/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentCard:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         card_holder_name:
 *           type: string
 *         expiry_month:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         expiry_year:
 *           type: integer
 *         card_type:
 *           type: string
 *           enum: [visa, mastercard, uzcard, humo, unknown]
 *         phone_number:
 *           type: string
 *         is_default:
 *           type: boolean
 *         last_four_digits:
 *           type: string
 *         is_active:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *     
 *     AddPaymentCardRequest:
 *       type: object
 *       required:
 *         - card_number
 *         - card_holder_name
 *         - expiry_month
 *         - expiry_year
 *         - phone_number
 *       properties:
 *         card_number:
 *           type: string
 *           description: "16-19 digit card number"
 *         card_holder_name:
 *           type: string
 *         expiry_month:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         expiry_year:
 *           type: integer
 *         phone_number:
 *           type: string
 *         is_default:
 *           type: boolean
 *           default: false
 */

/**
 * @swagger
 * /api/payment-cards/send-verification:
 *   post:
 *     summary: Send SMS verification code for payment card
 *     tags: [Payment Cards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - card_number
 *               - phone_number
 *             properties:
 *               card_number:
 *                 type: string
 *                 description: Payment card number
 *               phone_number:
 *                 type: string
 *                 description: Phone number to send verification code
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/send-verification', verifyUser, sendCardVerificationCode);

/**
 * @swagger
 * /api/payment-cards/verify-and-add:
 *   post:
 *     summary: Verify SMS code and add payment card
 *     tags: [Payment Cards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - card_number
 *               - card_holder_name
 *               - expiry_month
 *               - expiry_year
 *               - phone_number
 *               - verification_code
 *               - verification_key
 *             properties:
 *               card_number:
 *                 type: string
 *               card_holder_name:
 *                 type: string
 *               expiry_month:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *               expiry_year:
 *                 type: integer
 *               phone_number:
 *                 type: string
 *               verification_code:
 *                 type: string
 *               verification_key:
 *                 type: string
 *               is_default:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Payment card verified and added successfully
 *       400:
 *         description: Invalid input data or verification code
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/verify-and-add', verifyUser, verifyAndAddCard);

/**
 * @swagger
 * /api/payment-cards:
 *   post:
 *     summary: Add a new payment card
 *     tags: [Payment Cards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddPaymentCardRequest'
 *     responses:
 *       201:
 *         description: Payment card added successfully
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
 *                   $ref: '#/components/schemas/PaymentCard'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', verifyUser, addPaymentCard);

/**
 * @swagger
 * /api/payment-cards:
 *   get:
 *     summary: Get user's payment cards
 *     tags: [Payment Cards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's payment cards
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PaymentCard'
 *       401:
 *         description: Unauthorized
 */
router.get('/', verifyUser, getUserPaymentCards);

/**
 * @swagger
 * /api/payment-cards/{card_id}:
 *   put:
 *     summary: Update payment card
 *     tags: [Payment Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: card_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               card_holder_name:
 *                 type: string
 *               expiry_month:
 *                 type: integer
 *               expiry_year:
 *                 type: integer
 *               phone_number:
 *                 type: string
 *               is_default:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Card updated successfully
 *       404:
 *         description: Card not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:card_id', verifyUser, updatePaymentCard);

/**
 * @swagger
 * /api/payment-cards/{card_id}:
 *   delete:
 *     summary: Delete payment card
 *     tags: [Payment Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: card_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Card deleted successfully
 *       404:
 *         description: Card not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:card_id', verifyUser, deletePaymentCard);

/**
 * @swagger
 * /api/payment-cards/{card_id}/set-default:
 *   patch:
 *     summary: Set card as default
 *     tags: [Payment Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: card_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Default card set successfully
 *       404:
 *         description: Card not found
 *       401:
 *         description: Unauthorized
 */
router.patch('/:card_id/set-default', verifyUser, setDefaultCard);

/**
 * @swagger
 * /api/payment-cards/stats:
 *   get:
 *     summary: Foydalanuvchining payment card statistikasini olish (Mobile uchun)
 *     tags: [Payment Cards - Mobile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment card statistikasi muvaffaqiyatli olingan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_cards:
 *                       type: integer
 *                     has_default_card:
 *                       type: boolean
 *                     card_types:
 *                       type: object
 *                       properties:
 *                         visa:
 *                           type: integer
 *                         mastercard:
 *                           type: integer
 *                         uzcard:
 *                           type: integer
 *                         humo:
 *                           type: integer
 */
router.get('/stats', verifyUser, getPaymentCardStats);

/**
 * @swagger
 * /api/payment-cards/validate:
 *   post:
 *     summary: Karta raqamini real-time validatsiya qilish (Mobile uchun)
 *     tags: [Payment Cards - Mobile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - card_number
 *             properties:
 *               card_number:
 *                 type: string
 *                 description: Karta raqami
 *                 example: "4111111111111111"
 *     responses:
 *       200:
 *         description: Karta validatsiyasi muvaffaqiyatli
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     is_valid:
 *                       type: boolean
 *                     card_type:
 *                       type: string
 *                     last_four_digits:
 *                       type: string
 *                     formatted_number:
 *                       type: string
 */
router.post('/validate', verifyUser, validateCardForMobile);

/**
 * @swagger
 * /api/payment-cards/supported-types:
 *   get:
 *     summary: Qo'llab-quvvatlanadigan karta turlarini olish (Mobile uchun)
 *     tags: [Payment Cards - Mobile]
 *     responses:
 *       200:
 *         description: Qo'llab-quvvatlanadigan karta turlari
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                       name:
 *                         type: string
 *                       pattern:
 *                         type: string
 *                       icon:
 *                         type: string
 *                       color:
 *                         type: string
 */
router.get('/supported-types', getSupportedCardTypes);

module.exports = router;