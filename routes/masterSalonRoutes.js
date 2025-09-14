const express = require('express');
const router = express.Router();
const {
    getAllMasterSalons,
    getMasterSalonById,
    createMasterSalon,
    updateMasterSalon,
    deleteMasterSalon,
    addMasterSalonComment,
    getMasterSalonComments
} = require('../controllers/masterSalonController');
const { verifyAdmin } = require('../middleware/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     MasterSalon:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Master Salon ID
 *         master_salon_name:
 *           type: string
 *           description: Master salon nomi
 *         master_salon_phone:
 *           type: string
 *           description: Master salon telefon raqami
 *         master_salon_add_phone:
 *           type: string
 *           description: Qo'shimcha telefon raqami
 *         master_salon_instagram:
 *           type: string
 *           description: Instagram profili
 *         master_salon_rating:
 *           type: string
 *           description: Master salon reytingi
 *         master_salon_description:
 *           type: string
 *           description: Master salon tavsifi
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
 *         is_active:
 *           type: boolean
 *           description: Faol holat
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Yaratilgan vaqt
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Yangilangan vaqt
 *     MasterSalonInput:
 *       type: object
 *       required:
 *         - master_salon_name
 *         - master_salon_phone
 *       properties:
 *         master_salon_name:
 *           type: string
 *           description: Master salon nomi
 *         master_salon_phone:
 *           type: string
 *           description: Master salon telefon raqami
 *         master_salon_add_phone:
 *           type: string
 *           description: Qo'shimcha telefon raqami
 *         master_salon_instagram:
 *           type: string
 *           description: Instagram profili
 *         master_salon_rating:
 *           type: string
 *           description: Master salon reytingi
 *         master_salon_description:
 *           type: string
 *           description: Master salon tavsifi
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

// POST /api/masterSalons - Create master salon
router.post('/', createMasterSalon);

/**
 * @swagger
 * /api/masterSalons:
 *   get:
 *     summary: Barcha master salonlarni olish
 *     tags: [Master Salons]
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
 *                     $ref: '#/components/schemas/MasterSalon'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/masterSalons - Get all master salons
router.get('/', getAllMasterSalons);

/**
 * @swagger
 * /api/masterSalons/{id}:
 *   get:
 *     summary: ID bo'yicha master salonni olish
 *     tags: [Master Salons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Master Salon ID
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
 *                   $ref: '#/components/schemas/MasterSalon'
 *       404:
 *         description: Master salon topilmadi
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
// GET /api/masterSalons/:id - Get master salon by ID
router.get('/:id', getMasterSalonById);

/**
 * @swagger
 * /api/masterSalons:
 *   post:
 *     summary: Yangi master salon yaratish
 *     tags: [Master Salons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MasterSalonInput'
 *     responses:
 *       201:
 *         description: Master salon muvaffaqiyatli yaratildi
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
 *                   example: Master salon muvaffaqiyatli yaratildi
 *                 data:
 *                   $ref: '#/components/schemas/MasterSalon'
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

/**
 * @swagger
 * /api/masterSalons/{id}:
 *   put:
 *     summary: Master salonni yangilash
 *     tags: [Master Salons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Master Salon ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MasterSalonInput'
 *     responses:
 *       200:
 *         description: Master salon muvaffaqiyatli yangilandi
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
 *                   example: Master salon muvaffaqiyatli yangilandi
 *                 data:
 *                   $ref: '#/components/schemas/MasterSalon'
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
 *         description: Master salon topilmadi
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
// PUT /api/masterSalons/:id - Update master salon
router.put('/:id', updateMasterSalon);

/**
 * @swagger
 * /api/masterSalons/{id}:
 *   delete:
 *     summary: Master salonni o'chirish
 *     tags: [Master Salons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Master Salon ID
 *     responses:
 *       200:
 *         description: Master salon muvaffaqiyatli o'chirildi
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
 *                   example: Master salon muvaffaqiyatli o'chirildi
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Master salon topilmadi
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
// DELETE /api/masterSalons/:id - Delete master salon
router.delete('/:id', deleteMasterSalon);

/**
 * @swagger
 * /api/masterSalons/{id}/comments:
 *   get:
 *     summary: Master salon kommentlarini olish
 *     tags: [Master Salons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Master salon ID si
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
 *         description: Har sahifadagi kommentlar soni
 *     responses:
 *       200:
 *         description: Kommentlar muvaffaqiyatli olindi
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
 *                     comments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: string
 *                           text:
 *                             type: string
 *                           rating:
 *                             type: number
 *                           date:
 *                             type: string
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               username:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalComments:
 *                           type: integer
 *                         hasNextPage:
 *                           type: boolean
 *                         hasPrevPage:
 *                           type: boolean
 *       404:
 *         description: Master salon topilmadi
 *   post:
 *     summary: Master salonga komment qo'shish
 *     tags: [Master Salons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Master salon ID si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - text
 *               - rating
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Foydalanuvchi ID si
 *               text:
 *                 type: string
 *                 description: Komment matni
 *               rating:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 5
 *                 description: Baho (0-5)
 *     responses:
 *       201:
 *         description: Komment muvaffaqiyatli qo'shildi
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 *       404:
 *         description: Master salon topilmadi
 */
router.get('/:id/comments', getMasterSalonComments);
router.post('/:id/comments', verifyAdmin, addMasterSalonComment);

module.exports = router;