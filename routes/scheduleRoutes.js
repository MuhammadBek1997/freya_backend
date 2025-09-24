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

// GET /schedules - Barcha jadvallarni olish
router.get('/schedules', getAllSchedules);

// GET /schedules/salon/:salonId - Salon bo'yicha jadvallarni olish
router.get('/schedules/salon/:salonId', getSchedulesBySalonId);

// GET /schedules/:id - Jadvalni ID bo'yicha olish
router.get('/schedules/:id', getScheduleById);

// POST /schedules - Yangi jadval yaratish
router.post('/schedules', verifyAdmin, createSchedule);

// PUT /schedules/:id - Jadval ma'lumotlarini yangilash
router.put('/schedules/:id', verifyAdmin, updateSchedule);

// DELETE /schedules/:id - Jadvalni o'chirish
router.delete('/schedules/:id', verifyAdmin, deleteSchedule);

module.exports = router;