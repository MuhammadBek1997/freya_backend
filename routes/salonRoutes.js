const express = require('express');
const router = express.Router();
const {
    createSalon,
    getAllSalons,
    getSalonById,
    updateSalon,
    deleteSalon,
    addSalonComment,
    getSalonComments
} = require('../controllers/salonController');
const { verifyAdmin } = require('../middleware/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     SalonInput:
 *       type: object
 *       required:
 *         - salon_name
 *         - salon_phone
 *       properties:
 *         salon_name:
 *           type: string
 *           description: Salon nomi
 *         salon_phone:
 *           type: string
 *           description: Salon telefon raqami
 *         salon_add_phone:
 *           type: string
 *           description: Qo'shimcha telefon raqami
 *         salon_instagram:
 *           type: string
 *           description: Instagram profili
 *         salon_rating:
 *           type: string
 *           description: Salon reytingi
 *         salon_description:
 *           type: string
 *           description: Salon tavsifi
 *         salon_format:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               selected:
 *                 type: boolean
 *               format:
 *                 type: string
 *                 enum: [corporative, private]
 *           description: Salon formati
 */

/**
 * @swagger
 * /api/salons:
 *   get:
 *     summary: Barcha salonlarni olish
 *     tags: [Salons]
 *     responses:
 *       200:
 *         description: Muvaffaqiyatli javob
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Salon'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Public routes
router.get('/', getAllSalons); // Get all salons with pagination and search
/**
 * @swagger
 * /api/salons/{id}:
 *   get:
 *     summary: ID bo'yicha salonni olish
 *     tags: [Salons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Salon ID
 *     responses:
 *       200:
 *         description: Muvaffaqiyatli javob
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Salon'
 *       404:
 *         description: Salon topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getSalonById); // Get salon by ID

/**
 * @swagger
 * /api/salons:
 *   post:
 *     summary: Yangi salon yaratish
 *     tags: [Salons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SalonInput'
 *     responses:
 *       201:
 *         description: Salon muvaffaqiyatli yaratildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Salon muvaffaqiyatli yaratildi
 *                 data:
 *                   $ref: '#/components/schemas/Salon'
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Protected routes (require admin authentication)
router.post('/', createSalon); // Create new salon (temporarily public for testing)
/**
 * @swagger
 * /api/salons/{id}:
 *   put:
 *     summary: Salonni yangilash
 *     tags: [Salons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Salon ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SalonInput'
 *     responses:
 *       200:
 *         description: Salon muvaffaqiyatli yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Salon muvaffaqiyatli yangilandi
 *                 data:
 *                   $ref: '#/components/schemas/Salon'
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Salon topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', verifyAdmin, updateSalon); // Update salon
/**
 * @swagger
 * /api/salons/{id}:
 *   delete:
 *     summary: Salonni o'chirish
 *     tags: [Salons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Salon ID
 *     responses:
 *       200:
 *         description: Salon muvaffaqiyatli o'chirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Salon muvaffaqiyatli o'chirildi
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Salon topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', verifyAdmin, deleteSalon); // Delete salon (soft delete)

/**
 * @swagger
 * /api/salons/{id}/comments:
 *   get:
 *     summary: Salon izohlarini olish
 *     tags: [Salons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Salon ID si
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Sahifa raqami
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Sahifadagi elementlar soni
 *     responses:
 *       200:
 *         description: Muvaffaqiyatli javob
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       salon_id:
 *                         type: integer
 *                       user_id:
 *                         type: integer
 *                       username:
 *                         type: string
 *                       full_name:
 *                         type: string
 *                       text:
 *                         type: string
 *                       rating:
 *                         type: integer
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       404:
 *         description: Salon topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Salonga izoh qo'shish
 *     tags: [Salons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Salon ID si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - rating
 *             properties:
 *               text:
 *                 type: string
 *                 description: Izoh matni
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Reyting (1-5)
 *     responses:
 *       201:
 *         description: Izoh muvaffaqiyatli qo'shildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Izoh muvaffaqiyatli qo'shildi
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     salon_id:
 *                       type: integer
 *                     user_id:
 *                       type: integer
 *                     text:
 *                       type: string
 *                     rating:
 *                       type: integer
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Salon topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/comments', getSalonComments);
router.post('/:id/comments', verifyAdmin, addSalonComment);

module.exports = router;