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

// GET /salons/:salonId/employees - Salon bo'yicha xodimlarni olish
router.get('/salons/:salonId/employees', checkPrivateSalon, getEmployeesBySalonId);

// GET /employees/list - Barcha xodimlarni olish
router.get('/employees/list', getAllEmployees);

// GET /employees/:id - Xodimni ID bo'yicha olish
router.get('/employees/:id', getEmployeeById);

// POST /employees - Yangi xodim yaratish
router.post('/employees', verifyAdmin, createEmployee);

// PUT /employees/:id - Xodim ma'lumotlarini yangilash
router.put('/employees/:id', verifyAdmin, updateEmployee);

// DELETE /employees/:id - Xodimni o'chirish
router.delete('/employees/:id', verifyAdmin, deleteEmployee);

// POST /employees/:id/comments - Xodimga izoh qo'shish
router.post('/employees/:id/comments', verifyAdmin, addEmployeeComment);

// POST /employees/:id/posts - Xodimga post qo'shish
router.post('/employees/:id/posts', verifyAdmin, addEmployeePost);

// PUT /employees/:id/waiting-status - Xodim kutish holatini yangilash
router.put('/employees/:id/waiting-status', verifyAdmin, updateEmployeeWaitingStatus);

// PUT /employees/bulk-waiting-status - Xodimlar kutish holatini ommaviy yangilash
router.put('/employees/bulk-waiting-status', verifyAdmin, bulkUpdateEmployeeWaitingStatus);

module.exports = router;