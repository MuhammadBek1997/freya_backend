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
const { verifySuperAdmin } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Salons
 *   description: Salon boshqaruvi API
 */




/**
 * @swagger
 * /api/salons:
 *   get:
 *     summary: Barcha salonlarni olish
 *     tags: [Salons]
 *     parameters:
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Qidiruv so'zi
 *     responses:
 *       200:
 *         description: Salonlar ro'yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 salons:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Salon'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', getAllSalons);


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
 *           type: integer
 *         description: Salon ID
 *     responses:
 *       200:
 *         description: Salon ma'lumotlari
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Salon'
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
router.get('/:id', getSalonById);


/**
 * @swagger
 * /api/salons:
 *   post:
 *     summary: Yangi salon yaratish
 *     tags: [Salons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - salon_name
 *             properties:
 *               salon_name:
 *                 type: string
 *                 description: Salon nomi
 *               salon_phone:
 *                 type: string
 *                 description: Salon telefon raqami
 *               salon_add_phone:
 *                 type: string
 *                 description: Salon qo'shimcha telefon raqami
 *               salon_instagram:
 *                 type: string
 *                 description: Salon Instagram sahifasi
 *               salon_rating:
 *                 type: number
 *                 description: Salon reytingi
 *               comments:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Salon izohlari
 *               salon_payment:
 *                 type: object
 *                 description: To'lov usullari
 *               salon_description:
 *                 type: string
 *                 description: Salon tavsifi
 *               salon_types:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Salon turlari
 *               private_salon:
 *                 type: boolean
 *                 description: Shaxsiy salon
 *               work_schedule:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Ish jadvali
 *               salon_title:
 *                 type: string
 *                 description: Salon sarlavhasi
 *               salon_additionals:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Qo'shimcha xizmatlar
 *               sale_percent:
 *                 type: integer
 *                 description: Chegirma foizi
 *               sale_limit:
 *                 type: integer
 *                 description: Chegirma limiti
 *               location:
 *                 type: object
 *                 description: Salon joylashuvi
 *               salon_orient:
 *                 type: object
 *                 description: Salon yo'nalishi
 *               salon_photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Salon rasmlari
 *               salon_comfort:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Salon qulayliklari
 *     responses:
 *       201:
 *         description: Salon muvaffaqiyatli yaratildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Salon'
 *       400:
 *         description: Noto'g'ri ma'lumotlar
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
router.post('/', verifySuperAdmin, createSalon);

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
 *           type: integer
 *         description: Salon ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Salon nomi
 *               address:
 *                 type: string
 *                 description: Salon manzili
 *               phone:
 *                 type: string
 *                 description: Salon telefon raqami
 *               description:
 *                 type: string
 *                 description: Salon tavsifi
 *               image_url:
 *                 type: string
 *                 description: Salon rasmi URL
 *     responses:
 *       200:
 *         description: Salon muvaffaqiyatli yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Salon'
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
router.put('/:id', verifySuperAdmin, updateSalon);

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
 *           type: integer
 *         description: Salon ID
 *     responses:
 *       200:
 *         description: Salon muvaffaqiyatli o'chirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
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
router.delete('/:id', verifySuperAdmin, deleteSalon);


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
 *         description: Salon ID
 *     responses:
 *       200:
 *         description: Salon izohlari
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
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

/**
 * @swagger
 * /api/salons/{id}/comments:
 *   post:
 *     summary: Salon uchun izoh qo'shish
 *     tags: [Salons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Salon ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - author_name
 *               - rating
 *             properties:
 *               content:
 *                 type: string
 *                 description: Izoh matni
 *               author_name:
 *                 type: string
 *                 description: Muallif ismi
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Baho (1-5)
 *     responses:
 *       201:
 *         description: Izoh muvaffaqiyatli qo'shildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
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
router.post('/:id/comments', verifySuperAdmin, addSalonComment);

module.exports = router;