const { pool } = require('../config/database');
const scheduleTranslationService = require('../services/scheduleTranslationService');

// Get all schedules
const getAllSchedules = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const language = req.language || req.query.current_language || 'uz'; // Language middleware'dan olinadi
        const offset = (page - 1) * limit;

        let query = `
            SELECT s.*, sa.name as salon_name
            FROM schedules s
            LEFT JOIN salons sa ON s.salon_id = sa.id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (search) {
            query += ` AND (s.name ILIKE $1 OR s.title ILIKE $2)`;
            params.push(`%${search}%`, `%${search}%`);
        }
        
        query += ` ORDER BY s.date ASC, s.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const schedules = await pool.query(query, params);
        
        // Schedule'larni tarjima qilingan holatda olish
        const translatedSchedules = await Promise.all(schedules.rows.map(async (schedule) => {
            const translatedSchedule = await scheduleTranslationService.getScheduleByLanguage(schedule.id, language);
            
            if (translatedSchedule) {
                // Tarjima mavjud bo'lsa, name, title, description'ni almashtirish
                schedule.name = translatedSchedule.name;
                schedule.title = translatedSchedule.title;
                schedule.description = translatedSchedule.description;
            }
            
            return schedule;
        }));
        
        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM schedules WHERE 1=1`;
        const countParams = [];
        
        if (search) {
            countQuery += ` AND (name ILIKE $1 OR title ILIKE $2)`;
            countParams.push(`%${search}%`, `%${search}%`);
        }
        
        const totalResult = await pool.query(countQuery, countParams);
        const total = totalResult.rows[0].total;

        res.json({
            success: true,
            data: translatedSchedules,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching schedules:', error);
        res.status(500).json({
            success: false,
            message: 'Jadvallarni olishda xatolik yuz berdi'
        });
    }
};

// Get schedules by salon ID
const getSchedulesBySalonId = async (req, res) => {
    try {
        const { salonId } = req.params;
        const { page = 1, limit = 10, date_from, date_to } = req.query;
        const language = req.language || req.query.current_language || 'uz'; // Language middleware'dan olinadi
        const offset = (page - 1) * limit;

        let query = `
            SELECT s.*
            FROM schedules s
            WHERE s.salon_id = $1
        `;
        
        const params = [salonId];
        
        if (date_from) {
            query += ` AND s.date >= $${params.length + 1}`;
            params.push(date_from);
        }
        
        if (date_to) {
            query += ` AND s.date <= $${params.length + 1}`;
            params.push(date_to);
        }
        
        query += ` ORDER BY s.date ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const schedules = await pool.query(query, params);
        
        // Schedule'larni tarjima qilingan holatda olish
        const translatedSchedules = await Promise.all(schedules.rows.map(async (schedule) => {
            const translatedSchedule = await scheduleTranslationService.getScheduleByLanguage(schedule.id, language);
            
            if (translatedSchedule) {
                // Tarjima mavjud bo'lsa, name, title, description'ni almashtirish
                schedule.name = translatedSchedule.name;
                schedule.title = translatedSchedule.title;
                schedule.description = translatedSchedule.description;
            }
            
            return schedule;
        }));
        
        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM schedules WHERE salon_id = $1`;
        const countParams = [salonId];
        
        if (date_from) {
            countQuery += ` AND date >= $${countParams.length + 1}`;
            countParams.push(date_from);
        }
        
        if (date_to) {
            countQuery += ` AND date <= $${countParams.length + 1}`;
            countParams.push(date_to);
        }
        
        const totalResult = await pool.query(countQuery, countParams);
        const total = totalResult.rows[0].total;

        res.json({
            success: true,
            data: translatedSchedules,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching schedules by salon:', error);
        res.status(500).json({
            success: false,
            message: 'Salon jadvallarini olishda xatolik yuz berdi'
        });
    }
};

// Get schedule by ID
const getScheduleById = async (req, res) => {
    try {
        const { id } = req.params;
        const language = req.language || req.query.current_language || 'uz'; // Language middleware'dan olinadi
        
        const query = `
            SELECT s.*, sa.name as salon_name
            FROM schedules s
            LEFT JOIN salons sa ON s.salon_id = sa.id
            WHERE s.id = $1
        `;
        
        const schedule = await pool.query(query, [id]);
        
        if (schedule.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Jadval topilmadi'
            });
        }
        
        let scheduleData = schedule.rows[0];
        
        // Schedule'ni tarjima qilingan holatda olish
        const translatedSchedule = await scheduleTranslationService.getScheduleByLanguage(scheduleData.id, language);
        
        if (translatedSchedule) {
            // Tarjima mavjud bo'lsa, name, title, description'ni almashtirish
            scheduleData.name = translatedSchedule.name;
            scheduleData.title = translatedSchedule.title;
            scheduleData.description = translatedSchedule.description;
        }
        
        res.json({
            success: true,
            data: scheduleData
        });
    } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Jadval ma\'lumotlarini olishda xatolik yuz berdi'
        });
    }
};

// Create new schedule
const createSchedule = async (req, res) => {
    try {
        const {
            salon_id,
            name,
            title,
            date,
            repeat = false,
            repeat_value,
            employee_list = [],
            price,
            full_pay,
            deposit
        } = req.body;
        
        // Validate required fields
        if (!salon_id || !name || !date || !price) {
            return res.status(400).json({
                success: false,
                message: 'Salon ID, nom, sana va narx majburiy maydonlar'
            });
        }
        
        // Check if salon exists
        const salonCheck = await pool.query('SELECT id FROM salons WHERE id = $1', [salon_id]);
        if (salonCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Salon topilmadi'
            });
        }
        
        const query = `
            INSERT INTO schedules (
                salon_id, name, title, date, repeat, repeat_value, 
                employee_list, price, full_pay, deposit
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        
        const result = await pool.query(query, [
            salon_id, name, title, date, repeat, repeat_value,
            employee_list, price, full_pay, deposit
        ]);
        
        res.status(201).json({
            success: true,
            message: 'Jadval muvaffaqiyatli yaratildi',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Jadval yaratishda xatolik yuz berdi'
        });
    }
};

// Update schedule
const updateSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // Remove id and timestamps from update data
        delete updateData.id;
        delete updateData.created_at;
        delete updateData.updated_at;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Yangilanishi kerak bo\'lgan maydonlar ko\'rsatilmagan'
            });
        }
        
        // Check if schedule exists
        const existingSchedule = await pool.query(
            'SELECT id FROM schedules WHERE id = $1',
            [id]
        );
        
        if (existingSchedule.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Jadval topilmadi'
            });
        }
        
        // Build dynamic update query
        const fields = Object.keys(updateData);
        const values = Object.values(updateData);
        const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        
        const query = `
            UPDATE schedules 
            SET ${setClause}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;
        
        const result = await pool.query(query, [id, ...values]);
        
        res.json({
            success: true,
            message: 'Jadval muvaffaqiyatli yangilandi',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Jadval yangilashda xatolik yuz berdi'
        });
    }
};

// Delete schedule (soft delete)
const deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'DELETE FROM schedules WHERE id = $1 RETURNING id',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Jadval topilmadi'
            });
        }
        
        res.json({
            success: true,
            message: 'Jadval muvaffaqiyatli o\'chirildi'
        });
    } catch (error) {
        console.error('Error deleting schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Jadval o\'chirishda xatolik yuz berdi'
        });
    }
};

module.exports = {
    getAllSchedules,
    getSchedulesBySalonId,
    getScheduleById,
    createSchedule,
    updateSchedule,
    deleteSchedule
};