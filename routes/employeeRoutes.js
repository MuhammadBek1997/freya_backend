const express = require('express');
const router = express.Router();
const {
    getEmployeesBySalonId,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    addEmployeeComment,
    addEmployeePost,
    updateEmployeeWaitingStatus,
    bulkUpdateEmployeeWaitingStatus
} = require('../controllers/employeeController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Employee:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Xodim ID si
 *         salon_id:
 *           type: integer
 *           description: Salon ID si
 *         name:
 *           type: string
 *           description: Xodim ismi
 *         surname:
 *           type: string
 *           description: Xodim familiyasi
 *         phone:
 *           type: string
 *           description: Telefon raqami
 *         email:
 *           type: string
 *           description: Email manzili
 *         profession:
 *           type: string
 *           description: Kasbi
 *         username:
 *           type: string
 *           description: Foydalanuvchi nomi
 *         rating:
 *           type: number
 *           description: O'rtacha reyting
 *         is_waiting:
 *           type: boolean
 *           default: true
 *           description: Kutish holati
 *         comments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EmployeeComment'
 *         posts:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EmployeePost'
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     EmployeeInput:
 *       type: object
 *       required:
 *         - salon_id
 *         - name
 *         - surname
 *         - phone
 *         - email
 *         - profession
 *         - username
 *         - password
 *       properties:
 *         salon_id:
 *           type: integer
 *           description: Salon ID si
 *         name:
 *           type: string
 *           description: Xodim ismi
 *         surname:
 *           type: string
 *           description: Xodim familiyasi
 *         phone:
 *           type: string
 *           description: Telefon raqami
 *         email:
 *           type: string
 *           format: email
 *           description: Email manzili
 *         profession:
 *           type: string
 *           description: Kasbi
 *         username:
 *           type: string
 *           description: Foydalanuvchi nomi
 *         password:
 *           type: string
 *           description: Parol
 *         is_waiting:
 *           type: boolean
 *           default: true
 *           description: Kutish holati
 *     EmployeeComment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         employee_id:
 *           type: integer
 *         user_id:
 *           type: integer
 *         username:
 *           type: string
 *         full_name:
 *           type: string
 *         text:
 *           type: string
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         created_at:
 *           type: string
 *           format: date-time
 *     EmployeePost:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         employee_id:
 *           type: integer
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         media:
 *           type: array
 *           items:
 *             type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *     CommentInput:
 *       type: object
 *       required:
 *         - text
 *         - rating
 *       properties:
 *         text:
 *           type: string
 *           description: Izoh matni
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Reyting (1-5)
 *     PostInput:
 *       type: object
 *       required:
 *         - title
 *         - description
 *       properties:
 *         title:
 *           type: string
 *           description: Post sarlavhasi
 *         description:
 *           type: string
 *           description: Post tavsifi
 *         media:
 *           type: array
 *           items:
 *             type: string
 *           description: Media fayl yo'llari
 */

/**
 * @swagger
 * /api/salons/{salonId}/employees:
 *   get:
 *     summary: Salon xodimlarini olish
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: salonId
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Qidiruv so'zi
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
 *                     $ref: '#/components/schemas/Employee'
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
 */
router.get('/salons/:salonId/employees', getEmployeesBySalonId);

/**
 * @swagger
 * /api/employees/{id}:
 *   get:
 *     summary: Xodim ma'lumotlarini ID bo'yicha olish
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Xodim ID si
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
 *                   $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Xodim topilmadi
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
router.get('/employees/:id', getEmployeeById);

/**
 * @swagger
 * /api/employees:
 *   post:
 *     summary: Yangi xodim yaratish
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeInput'
 *     responses:
 *       201:
 *         description: Xodim muvaffaqiyatli yaratildi
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
 *                   example: Xodim muvaffaqiyatli yaratildi
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
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
router.post('/employees', authMiddleware.verifyAdmin, createEmployee);

/**
 * @swagger
 * /api/employees/{id}:
 *   put:
 *     summary: Xodim ma'lumotlarini yangilash
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Xodim ID si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               surname:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               profession:
 *                 type: string
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Xodim ma'lumotlari muvaffaqiyatli yangilandi
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
 *                   example: Xodim ma'lumotlari muvaffaqiyatli yangilandi
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
 *         description: Xodim topilmadi
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
router.put('/employees/:id', authMiddleware.verifyAdmin, updateEmployee);

/**
 * @swagger
 * /api/employees/{id}:
 *   delete:
 *     summary: Xodimni o'chirish
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Xodim ID si
 *     responses:
 *       200:
 *         description: Xodim muvaffaqiyatli o'chirildi
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
 *                   example: Xodim muvaffaqiyatli o'chirildi
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Xodim topilmadi
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
router.delete('/employees/:id', authMiddleware.verifyAdmin, deleteEmployee);

/**
 * @swagger
 * /api/employees/{id}/comments:
 *   post:
 *     summary: Xodimga izoh qo'shish
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Xodim ID si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentInput'
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
 *                   $ref: '#/components/schemas/EmployeeComment'
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
 *         description: Xodim topilmadi
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
router.post('/employees/:id/comments', authMiddleware.verifyUser, addEmployeeComment);

/**
 * @swagger
 * /api/employees/{id}/posts:
 *   post:
 *     summary: Xodim uchun post qo'shish
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Xodim ID si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostInput'
 *     responses:
 *       201:
 *         description: Post muvaffaqiyatli qo'shildi
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
 *                   example: Post muvaffaqiyatli qo'shildi
 *                 data:
 *                   $ref: '#/components/schemas/EmployeePost'
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
 *         description: Xodim topilmadi
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
router.post('/employees/:id/posts', authMiddleware.verifyAdmin, addEmployeePost);

/**
 * @swagger
 * /api/employees/{id}/waiting-status:
 *   patch:
 *     summary: Xodimning kutish holatini yangilash
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Xodim ID si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_waiting
 *             properties:
 *               is_waiting:
 *                 type: boolean
 *                 description: Kutish holati (true/false)
 *     responses:
 *       200:
 *         description: Xodim holati muvaffaqiyatli yangilandi
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
 *                     id:
 *                       type: string
 *                     is_waiting:
 *                       type: boolean
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 *       404:
 *         description: Xodim topilmadi
 */
router.patch('/employees/:id/waiting-status', authMiddleware.verifyAdmin, updateEmployeeWaitingStatus);

/**
 * @swagger
 * /api/employees/bulk-waiting-status:
 *   patch:
 *     summary: Bir necha xodimning kutish holatini yangilash
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employee_ids
 *               - is_waiting
 *             properties:
 *               employee_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Xodimlar ID lari ro'yxati
 *               is_waiting:
 *                 type: boolean
 *                 description: Kutish holati (true/false)
 *     responses:
 *       200:
 *         description: Xodimlar holati muvaffaqiyatli yangilandi
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
 *                     updated_count:
 *                       type: integer
 *                     employee_ids:
 *                       type: array
 *                       items:
 *                         type: string
 *                     is_waiting:
 *                       type: boolean
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 */
router.patch('/employees/bulk-waiting-status', authMiddleware.verifyAdmin, bulkUpdateEmployeeWaitingStatus);

module.exports = router;