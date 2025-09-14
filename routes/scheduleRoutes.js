const express = require('express');
const router = express.Router();
const {
    getAllSchedules,
    getSchedulesBySalonId,
    getScheduleById,
    createSchedule,
    updateSchedule,
    deleteSchedule
} = require('../controllers/scheduleController');
const { verifyAdmin } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Schedules
 *   description: Jadval boshqaruvi API
 */

/**
 * @swagger
 * /api/schedules:
 *   get:
 *     summary: Barcha jadvallarni olish
 *     tags: [Schedules]
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
 *         description: Jadvallar ro'yxati
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
 *                     $ref: '#/components/schemas/Schedule'
 *                 pagination:
 *                   type: object
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
 * /api/schedules/salon/{salonId}:
 *   get:
 *     summary: Salon bo'yicha jadvallarni olish
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: salonId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Salon ID
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
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Boshlanish sanasi
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Tugash sanasi
 *     responses:
 *       200:
 *         description: Salon jadvallar ro'yxati
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
 *                     $ref: '#/components/schemas/Schedule'
 *                 pagination:
 *                   type: object
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/schedules/salon/:salonId', getSchedulesBySalonId);

/**
 * @swagger
 * /api/schedules/{id}:
 *   get:
 *     summary: ID bo'yicha jadval olish
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Jadval ID
 *     responses:
 *       200:
 *         description: Jadval ma'lumotlari
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Schedule'
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
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [salon_id, name, date, price]
 *             properties:
 *               salon_id:
 *                 type: string
 *                 format: uuid
 *                 description: Salon ID
 *               name:
 *                 type: string
 *                 description: Jadval nomi
 *               title:
 *                 type: string
 *                 description: Jadval sarlavhasi
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Jadval sanasi
 *               repeat:
 *                 type: boolean
 *                 default: false
 *                 description: Takrorlash
 *               repeat_value:
 *                 type: integer
 *                 description: Takrorlash qiymati (kunlarda)
 *               employee_list:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Xodimlar ro'yxati
 *               price:
 *                 type: number
 *                 format: decimal
 *                 description: Narx
 *               full_pay:
 *                 type: number
 *                 format: decimal
 *                 description: To'liq to'lov
 *               deposit:
 *                 type: number
 *                 format: decimal
 *                 description: Oldindan to'lov
 *     responses:
 *       201:
 *         description: Jadval muvaffaqiyatli yaratildi
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
 *                   $ref: '#/components/schemas/Schedule'
 *       400:
 *         description: Noto'g'ri so'rov
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Avtorizatsiya xatosi
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
router.post('/schedules', verifyAdmin, createSchedule);

/**
 * @swagger
 * /api/schedules/{id}:
 *   put:
 *     summary: Jadval yangilash
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Jadval ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Jadval nomi
 *               title:
 *                 type: string
 *                 description: Jadval sarlavhasi
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Jadval sanasi
 *               repeat:
 *                 type: boolean
 *                 description: Takrorlash
 *               repeat_value:
 *                 type: integer
 *                 description: Takrorlash qiymati (kunlarda)
 *               employee_list:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Xodimlar ro'yxati
 *               price:
 *                 type: number
 *                 format: decimal
 *                 description: Narx
 *               full_pay:
 *                 type: number
 *                 format: decimal
 *                 description: To'liq to'lov
 *               deposit:
 *                 type: number
 *                 format: decimal
 *                 description: Oldindan to'lov
 *     responses:
 *       200:
 *         description: Jadval muvaffaqiyatli yangilandi
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
 *                   $ref: '#/components/schemas/Schedule'
 *       400:
 *         description: Noto'g'ri so'rov
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Avtorizatsiya xatosi
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
 *     summary: Jadval o'chirish
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Jadval ID
 *     responses:
 *       200:
 *         description: Jadval muvaffaqiyatli o'chirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Avtorizatsiya xatosi
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