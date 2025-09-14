const express = require('express');
const router = express.Router();
const {
    getAllEmployees,
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
const { verifyAdmin } = require('../middleware/authMiddleware');
const { checkPrivateSalon } = require('../middleware/privateSalonMiddleware');

/**
 * @swagger
 * tags:
 *   name: Employees
 *   description: Xodimlar boshqaruvi API
 */

/**
 * @swagger
 * /api/employees/salons/{salonId}/employees:
 *   get:
 *     summary: Salon bo'yicha xodimlarni olish
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: salonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Salon ID
 *     responses:
 *       200:
 *         description: Xodimlar ro'yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Employee'
 *       403:
 *         description: Private salonda xodimlar bo'limiga ruxsat yo'q
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
router.get('/salons/:salonId/employees', checkPrivateSalon, getEmployeesBySalonId);

/**
 * @swagger
 * /api/employees/list:
 *   get:
 *     summary: Barcha xodimlarni olish
 *     tags: [Employees]
 *     responses:
 *       200:
 *         description: Xodimlar ro'yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Employee'
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/employees/list', getAllEmployees);

/**
 * @swagger
 * /api/employees/{id}:
 *   get:
 *     summary: Xodimni ID bo'yicha olish
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Xodim ID
 *     responses:
 *       200:
 *         description: Xodim ma'lumotlari
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
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
 *             $ref: '#/components/schemas/Employee'
 *     responses:
 *       201:
 *         description: Xodim muvaffaqiyatli yaratildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
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
router.post('/employees', verifyAdmin, createEmployee);

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
 *           type: string
 *         description: Xodim ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Employee'
 *     responses:
 *       200:
 *         description: Xodim muvaffaqiyatli yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
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
router.put('/employees/:id', verifyAdmin, updateEmployee);

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
 *           type: string
 *         description: Xodim ID
 *     responses:
 *       200:
 *         description: Xodim muvaffaqiyatli o'chirildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
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
router.delete('/employees/:id', verifyAdmin, deleteEmployee);

router.post('/employees/:id/comments', verifyAdmin, addEmployeeComment);
router.post('/employees/:id/posts', verifyAdmin, addEmployeePost);
router.put('/employees/:id/waiting-status', verifyAdmin, updateEmployeeWaitingStatus);
router.put('/employees/bulk-waiting-status', verifyAdmin, bulkUpdateEmployeeWaitingStatus);

module.exports = router;