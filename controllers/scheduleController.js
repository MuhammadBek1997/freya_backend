const { pool } = require('../config/database');

// Get all schedules
const getAllSchedules = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `SELECT * FROM schedules WHERE 1=1`;
        const params = [];
        
        if (search) {
            query += ` AND (client_name ILIKE $1 OR service_name ILIKE $2)`;
            params.push(`%${search}%`, `%${search}%`);
        }
        
        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const schedules = await pool.query(query, params);
        
        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM schedules WHERE 1=1`;
        const countParams = [];
        
        if (search) {
            countQuery += ` AND (client_name ILIKE $1 OR service_name ILIKE $2)`;
            countParams.push(`%${search}%`, `%${search}%`);
        }
        
        const totalResult = await pool.query(countQuery, countParams);
        const total = totalResult.rows[0].total;

        res.json({
            success: true,
            message: 'Jadvallar muvaffaqiyatli olindi',
            data: schedules.rows,
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

// Get schedule by ID
const getScheduleById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `SELECT * FROM schedules WHERE id = $1`;
        const schedule = await pool.query(query, [id]);
        
        if (schedule.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Jadval topilmadi'
            });
        }

        res.json({
            success: true,
            message: 'Jadval ma\'lumotlari muvaffaqiyatli olindi',
            data: schedule.rows[0]
        });
    } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Jadval ma\'lumotlarini olishda xatolik yuz berdi'
        });
    }
};

// Create schedule
const createSchedule = async (req, res) => {
    try {
        const {
            salon_id,
            name,
            title,
            date,
            repeat = false,
            repeat_value = null,
            employee_list = [],
            price,
            full_pay = null,
            deposit = null,
            is_active = true
        } = req.body;

        // Validate required fields
        if (!salon_id || !name || !date || !price) {
            return res.status(400).json({
                success: false,
                message: 'Majburiy maydonlar: salon_id, name, date, price'
            });
        }

        const query = `
            INSERT INTO schedules (
                salon_id, name, title, date, repeat, repeat_value,
                employee_list, price, full_pay, deposit, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;

        const result = await pool.query(query, [
            salon_id, name, title, date, repeat, repeat_value,
            employee_list, price, full_pay, deposit, is_active
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
        const {
            client_name,
            client_phone,
            service_name,
            service_price,
            appointment_date,
            appointment_time,
            status,
            notes
        } = req.body;

        const query = `
            UPDATE schedules SET
                client_name = $1,
                client_phone = $2,
                service_name = $3,
                service_price = $4,
                appointment_date = $5,
                appointment_time = $6,
                status = $7,
                notes = $8,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $9
            RETURNING *
        `;

        const result = await pool.query(query, [
            client_name, client_phone, service_name, service_price,
            appointment_date, appointment_time, status, notes, id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Jadval topilmadi'
            });
        }

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

// Delete schedule
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
    getScheduleById,
    createSchedule,
    updateSchedule,
    deleteSchedule
};