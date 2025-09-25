const express = require('express');
const router = express.Router();
const {
    getAllSchedules,
    getScheduleById,
    createSchedule,
    updateSchedule,
    deleteSchedule
} = require('../controllers/scheduleController');
const { verifyAdmin } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/schedules:
 *   get:
 *     summary: Barcha jadvallarni olish
 *     description: Tizimda mavjud bo'lgan barcha jadvallarni olish
 *     tags: [Schedules]
 *     responses:
 *       200:
 *         description: Jadvallar muvaffaqiyatli olindi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Schedule'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/schedules', getAllSchedules);



/**
 * @swagger
 * /api/schedules/{id}:
 *   get:
 *     summary: Jadvalni ID bo'yicha olish
 *     description: Berilgan ID bo'yicha bitta jadval ma'lumotlarini olish
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Jadval ID raqami
 *     responses:
 *       200:
 *         description: Jadval muvaffaqiyatli topildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Schedule'
 *       404:
 *         description: Jadval topilmadi
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
router.get('/schedules/:id', getScheduleById);

/**
 * @swagger
 * /api/schedules:
 *   post:
 *     summary: Yangi jadval yaratish
 *     description: Yangi jadval yaratish (faqat admin)
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - salon_id
 *               - employee_id
 *               - date
 *               - start_time
 *               - end_time
 *             properties:
 *               salon_id:
 *                 type: integer
 *                 description: Salon ID raqami
 *                 example: 1
 *               employee_id:
 *                 type: integer
 *                 description: Xodim ID raqami
 *                 example: 1
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Jadval sanasi
 *                 example: "2024-01-15"
 *               start_time:
 *                 type: string
 *                 format: time
 *                 description: Boshlanish vaqti
 *                 example: "09:00"
 *               end_time:
 *                 type: string
 *                 format: time
 *                 description: Tugash vaqti
 *                 example: "17:00"
 *               is_available:
 *                 type: boolean
 *                 description: Mavjudlik holati
 *                 example: true
 *     responses:
 *       201:
 *         description: Jadval muvaffaqiyatli yaratildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Schedule'
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Autentifikatsiya xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Ruxsat yo'q (admin emas)
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
router.post('/schedules', verifyAdmin, createSchedule);

/**
 * @swagger
 * /api/schedules/{id}:
 *   put:
 *     summary: Jadval ma'lumotlarini yangilash
 *     description: Mavjud jadval ma'lumotlarini yangilash (faqat admin)
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Jadval ID raqami
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               salon_id:
 *                 type: integer
 *                 description: Salon ID raqami
 *                 example: 1
 *               employee_id:
 *                 type: integer
 *                 description: Xodim ID raqami
 *                 example: 1
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Jadval sanasi
 *                 example: "2024-01-15"
 *               start_time:
 *                 type: string
 *                 format: time
 *                 description: Boshlanish vaqti
 *                 example: "09:00"
 *               end_time:
 *                 type: string
 *                 format: time
 *                 description: Tugash vaqti
 *                 example: "17:00"
 *               is_available:
 *                 type: boolean
 *                 description: Mavjudlik holati
 *                 example: true
 *     responses:
 *       200:
 *         description: Jadval muvaffaqiyatli yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Schedule'
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Autentifikatsiya xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Ruxsat yo'q (admin emas)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Jadval topilmadi
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
router.put('/schedules/:id', verifyAdmin, updateSchedule);

/**
 * @swagger
 * /api/schedules/{id}:
 *   delete:
 *     summary: Jadvalni o'chirish
 *     description: Mavjud jadvalni o'chirish (faqat admin)
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Jadval ID raqami
 *     responses:
 *       200:
 *         description: Jadval muvaffaqiyatli o'chirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Jadval muvaffaqiyatli o'chirildi"
 *       401:
 *         description: Autentifikatsiya xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Ruxsat yo'q (admin emas)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Jadval topilmadi
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
router.delete('/schedules/:id', verifyAdmin, deleteSchedule);

module.exports = router;