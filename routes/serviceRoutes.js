const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middleware/authMiddleware');
const {
    getAllServices,
    getServiceById,
    createService,
    updateService,
    deleteService
} = require('../controllers/serviceController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Service:
 *       type: object
 *       required:
 *         - name
 *         - title
 *         - price
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Service ID raqami
 *         salon_id:
 *           type: string
 *           format: uuid
 *           description: Salon ID raqami
 *         name:
 *           type: string
 *           description: Xizmat nomi (zanyatiya)
 *         title:
 *           type: string
 *           description: Xizmat sarlavhasi (titul)
 *         description:
 *           type: string
 *           description: Xizmat tavsifi
 *         price:
 *           type: number
 *           format: decimal
 *           description: Xizmat narxi
 *         duration:
 *           type: integer
 *           description: Xizmat davomiyligi (daqiqalarda)
 *         is_active:
 *           type: boolean
 *           description: Faollik holati
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Yaratilgan vaqt
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Yangilangan vaqt
 */

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Barcha xizmatlarni olish
 *     description: Barcha xizmatlar ro'yxatini olish (admin uchun)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Sahifa raqami
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Sahifadagi elementlar soni
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Qidiruv so'zi
 *     responses:
 *       200:
 *         description: Xizmatlar ro'yxati
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
 *                     $ref: '#/components/schemas/Service'
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
 */
router.get('/services', verifyAdmin, getAllServices);

/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     summary: Xizmatni ID bo'yicha olish
 *     description: Bitta xizmat ma'lumotlarini olish
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Xizmat ID raqami
 *     responses:
 *       200:
 *         description: Xizmat ma'lumotlari
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Service'
 *       404:
 *         description: Xizmat topilmadi
 */
router.get('/services/:id', verifyAdmin, getServiceById);

/**
 * @swagger
 * /api/services:
 *   post:
 *     summary: Yangi xizmat yaratish
 *     description: Yangi xizmat qo'shish (admin uchun)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - title
 *               - price
 *             properties:
 *               salon_id:
 *                 type: string
 *                 format: uuid
 *                 description: Salon ID raqami
 *               name:
 *                 type: string
 *                 description: Xizmat nomi (zanyatiya)
 *               title:
 *                 type: string
 *                 description: Xizmat sarlavhasi (titul)
 *               description:
 *                 type: string
 *                 description: Xizmat tavsifi
 *               price:
 *                 type: number
 *                 format: decimal
 *                 description: Xizmat narxi
 *               duration:
 *                 type: integer
 *                 description: Xizmat davomiyligi (daqiqalarda)
 *     responses:
 *       201:
 *         description: Xizmat muvaffaqiyatli yaratildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Service'
 */
router.post('/services', verifyAdmin, createService);

/**
 * @swagger
 * /api/services/{id}:
 *   put:
 *     summary: Xizmatni yangilash
 *     description: Mavjud xizmat ma'lumotlarini yangilash
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Xizmat ID raqami
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Xizmat nomi (zanyatiya)
 *               title:
 *                 type: string
 *                 description: Xizmat sarlavhasi (titul)
 *               description:
 *                 type: string
 *                 description: Xizmat tavsifi
 *               price:
 *                 type: number
 *                 format: decimal
 *                 description: Xizmat narxi
 *               duration:
 *                 type: integer
 *                 description: Xizmat davomiyligi (daqiqalarda)
 *               is_active:
 *                 type: boolean
 *                 description: Faollik holati
 *     responses:
 *       200:
 *         description: Xizmat muvaffaqiyatli yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Service'
 */
router.put('/services/:id', verifyAdmin, updateService);

/**
 * @swagger
 * /api/services/{id}:
 *   delete:
 *     summary: Xizmatni o'chirish
 *     description: Xizmatni o'chirish (admin uchun)
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Xizmat ID raqami
 *     responses:
 *       200:
 *         description: Xizmat muvaffaqiyatli o'chirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.delete('/services/:id', verifyAdmin, deleteService);

module.exports = router;