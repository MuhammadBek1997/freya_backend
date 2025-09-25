const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware.verifyUser);

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Yangi appointment yaratish
 *     description: Foydalanuvchi uchun yangi appointment yaratadi. Schedule ID orqali salon va employee ma'lumotlari avtomatik aniqlanadi.
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AppointmentCreate'
 *     responses:
 *       201:
 *         description: Appointment muvaffaqiyatli yaratildi
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
 *                   example: 'Appointment muvaffaqiyatli yaratildi'
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Noto'g'ri ma'lumotlar
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
 *         description: Schedule topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', appointmentController.createAppointment);

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Barcha appointmentlarni olish
 *     description: Admin va employee uchun barcha appointmentlarni ko'rish imkoniyati
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Appointmentlar ro'yxati
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
 *                     $ref: '#/components/schemas/Appointment'
 *       401:
 *         description: Avtorizatsiya xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', appointmentController.getAllAppointments);

/**
 * @swagger
 * /api/appointments/my-appointments:
 *   get:
 *     summary: Foydalanuvchining appointmentlari
 *     description: Joriy foydalanuvchining barcha appointmentlarini olish
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Foydalanuvchi appointmentlari
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
 *                     $ref: '#/components/schemas/Appointment'
 *       401:
 *         description: Avtorizatsiya xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/my-appointments', appointmentController.getUserAppointments);

/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: ID bo'yicha appointment olish
 *     description: Berilgan ID bo'yicha appointmentni olish
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Appointment ID si
 *     responses:
 *       200:
 *         description: Appointment ma'lumotlari
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *       404:
 *         description: Appointment topilmadi
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
 */
router.get('/:id', appointmentController.getAppointmentById);

/**
 * @swagger
 * /api/appointments/{id}:
 *   put:
 *     summary: Appointmentni yangilash
 *     description: Foydalanuvchi o'z appointmentini yangilashi mumkin
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Appointment ID si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone_number:
 *                 type: string
 *                 example: '+998901234567'
 *               application_date:
 *                 type: string
 *                 format: date
 *                 example: '2024-01-15'
 *               application_time:
 *                 type: string
 *                 example: '10:00'
 *               notes:
 *                 type: string
 *                 example: 'Qisqa soch kesish'
 *     responses:
 *       200:
 *         description: Appointment muvaffaqiyatli yangilandi
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
 *                   example: 'Appointment muvaffaqiyatli yangilandi'
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *       404:
 *         description: Appointment topilmadi
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
 */
router.put('/:id', appointmentController.updateAppointment);

/**
 * @swagger
 * /api/appointments/{id}/status:
 *   put:
 *     summary: Appointment statusini yangilash
 *     description: Admin va employee appointment statusini o'zgartirishi mumkin
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Appointment ID si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ['pending', 'accepted', 'cancelled', 'done', 'ignored']
 *                 example: 'accepted'
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Status muvaffaqiyatli yangilandi
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
 *                   example: 'Status muvaffaqiyatli yangilandi'
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *       404:
 *         description: Appointment topilmadi
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
 */
router.put('/:id/status', appointmentController.updateAppointmentStatus);

/**
 * @swagger
 * /api/appointments/{id}/cancel:
 *   put:
 *     summary: Appointmentni bekor qilish
 *     description: Foydalanuvchi o'z appointmentini bekor qilishi mumkin
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Appointment ID si
 *     responses:
 *       200:
 *         description: Appointment bekor qilindi
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
 *                   example: 'Appointment bekor qilindi'
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *       404:
 *         description: Appointment topilmadi
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
 */
router.put('/:id/cancel', appointmentController.cancelAppointment);

/**
 * @swagger
 * /api/appointments/{id}:
 *   delete:
 *     summary: Appointmentni o'chirish
 *     description: Foydalanuvchi o'z appointmentini o'chirishi mumkin
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Appointment ID si
 *     responses:
 *       200:
 *         description: Appointment o'chirildi
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
 *                   example: "Appointment o'chirildi"
 *       404:
 *         description: Appointment topilmadi
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
 */
router.delete('/:id', appointmentController.deleteAppointment);

module.exports = router;