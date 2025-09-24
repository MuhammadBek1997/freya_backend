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
 * /api/salons/{salonId}/employees:
 *   get:
 *     summary: Salon bo'yicha xodimlarni olish
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: salonId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Salon ID si
 *       - $ref: '#/components/parameters/AcceptLanguageHeader'
 *     responses:
 *       200:
 *         description: Xodimlar ro'yxati muvaffaqiyatli qaytarildi
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
 *       404:
 *         description: Salon topilmadi
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
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguageHeader'
 *     responses:
 *       200:
 *         description: Barcha xodimlar ro'yxati
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
 *           format: uuid
 *         description: Xodim ID si
 *       - $ref: '#/components/parameters/AcceptLanguageHeader'
 *     responses:
 *       200:
 *         description: Xodim ma'lumotlari
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
 *             type: object
 *             required:
 *               - salon_id
 *               - name
 *               - position
 *             properties:
 *               salon_id:
 *                 type: string
 *                 format: uuid
 *                 description: Salon ID si
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               name:
 *                 type: string
 *                 description: Xodim ismi
 *                 example: "Aziza Karimova"
 *               position:
 *                 type: string
 *                 description: Lavozimi
 *                 example: "Sartarosh"
 *               phone:
 *                 type: string
 *                 description: Telefon raqami
 *                 example: "+998901234567"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email manzili
 *                 example: "aziza@salon.com"
 *               specialization:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Mutaxassisligi
 *                 example: ["Soch kesish", "Soch bo'yash"]
 *               rating:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 5
 *                 description: Reyting
 *                 example: 4.5
 *               is_active:
 *                 type: boolean
 *                 description: Faol holati
 *                 example: true
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
 *                   example: "Xodim muvaffaqiyatli yaratildi"
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
 *           format: uuid
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
 *                 description: Xodim ismi
 *                 example: "Aziza Karimova"
 *               position:
 *                 type: string
 *                 description: Lavozimi
 *                 example: "Sartarosh"
 *               phone:
 *                 type: string
 *                 description: Telefon raqami
 *                 example: "+998901234567"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email manzili
 *                 example: "aziza@salon.com"
 *               specialization:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Mutaxassisligi
 *                 example: ["Soch kesish", "Soch bo'yash"]
 *               rating:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 5
 *                 description: Reyting
 *                 example: 4.5
 *               is_active:
 *                 type: boolean
 *                 description: Faol holati
 *                 example: true
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
 *                   example: "Xodim ma'lumotlari yangilandi"
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Xodim topilmadi
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
 *           format: uuid
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
 *                   example: "Xodim muvaffaqiyatli o'chirildi"
 *       404:
 *         description: Xodim topilmadi
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
 */
router.delete('/employees/:id', verifyAdmin, deleteEmployee);

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
 *           type: string
 *           format: uuid
 *         description: Xodim ID si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *                 description: Izoh matni
 *                 example: "Juda yaxshi xodim, mijozlar mamnun"
 *               rating:
 *                 type: number
 *                 format: float
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Baho
 *                 example: 5
 *     responses:
 *       201:
 *         description: Izoh muvaffaqiyatli qo'shildi
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
 */
router.post('/employees/:id/comments', verifyAdmin, addEmployeeComment);

/**
 * @swagger
 * /api/employees/{id}/posts:
 *   post:
 *     summary: Xodimga post qo'shish
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Xodim ID si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: Post sarlavhasi
 *                 example: "Yangi xizmat"
 *               content:
 *                 type: string
 *                 description: Post mazmuni
 *                 example: "Endi biz yangi xizmat taklif qilamiz..."
 *               image_url:
 *                 type: string
 *                 format: uri
 *                 description: Rasm URL manzili
 *                 example: "https://example.com/image.jpg"
 *     responses:
 *       201:
 *         description: Post muvaffaqiyatli qo'shildi
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
 */
router.post('/employees/:id/posts', verifyAdmin, addEmployeePost);

/**
 * @swagger
 * /api/employees/{id}/waiting-status:
 *   put:
 *     summary: Xodim kutish holatini yangilash
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *                 description: Kutish holati
 *                 example: true
 *     responses:
 *       200:
 *         description: Kutish holati muvaffaqiyatli yangilandi
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
 */
router.put('/employees/:id/waiting-status', verifyAdmin, updateEmployeeWaitingStatus);

/**
 * @swagger
 * /api/employees/bulk-waiting-status:
 *   put:
 *     summary: Xodimlar kutish holatini ommaviy yangilash
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
 *                   format: uuid
 *                 description: Xodimlar ID lari ro'yxati
 *                 example: ["123e4567-e89b-12d3-a456-426614174000", "987fcdeb-51a2-43d1-9f12-123456789abc"]
 *               is_waiting:
 *                 type: boolean
 *                 description: Kutish holati
 *                 example: false
 *     responses:
 *       200:
 *         description: Xodimlar kutish holati muvaffaqiyatli yangilandi
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
 *                   example: "Xodimlar kutish holati yangilandi"
 *                 updated_count:
 *                   type: integer
 *                   example: 2
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/employees/bulk-waiting-status', verifyAdmin, bulkUpdateEmployeeWaitingStatus);

module.exports = router;