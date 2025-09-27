const { pool } = require('../config/database');

// Get all schedules
const getAllSchedules = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `SELECT * FROM schedules WHERE 1=1`;
        const params = [];
        
        if (search) {
            query += ` AND (name ILIKE $1 OR title ILIKE $2)`;
            params.push(`%${search}%`, `%${search}%`);
        }
        
        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const schedules = await pool.query(query, params);
        
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
            salon_id,
            name,
            title,
            date,
            repeat,
            repeat_value,
            employee_list,
            price,
            full_pay,
            deposit,
            is_active
        } = req.body;

        const query = `
            UPDATE schedules SET
                salon_id = $1,
                name = $2,
                title = $3,
                date = $4,
                repeat = $5,
                repeat_value = $6,
                employee_list = $7,
                price = $8,
                full_pay = $9,
                deposit = $10,
                is_active = $11,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $12
            RETURNING *
        `;

        const result = await pool.query(query, [
            salon_id, name, title, date, repeat, repeat_value,
            employee_list, price, full_pay, deposit, is_active, id
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

// Get schedules grouped by date
const getSchedulesGroupedByDate = async (req, res) => {
    try {
        const query = `SELECT * FROM schedules ORDER BY date, created_at`;
        const schedules = await pool.query(query);
        
        // Group schedules by weekday
        const weekdays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
        const groupedByDate = {};
        
        schedules.rows.forEach(item => {
            const date = new Date(item.date);
            const dayOfWeek = weekdays[date.getDay()];
            
            const newItem = {
                ...item,
                dayOfWeek,
                // Since production DB doesn't have start_time/end_time, we'll use default values
                start_time: "09:00",
                end_time: "18:00",
            };
            
            if (!groupedByDate[dayOfWeek]) {
                groupedByDate[dayOfWeek] = [newItem];
            } else {
                groupedByDate[dayOfWeek].push(newItem);
            }
        });
        
        // Convert to ordered array
        const orderedWeekdays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
        const dayListItems = orderedWeekdays
            .map(day => groupedByDate[day])
            .filter(daySchedules => daySchedules && daySchedules.length > 0);
        
        res.json({
            success: true,
            message: 'Sana bo\'yicha guruhlangan jadvallar muvaffaqiyatli olindi',
            data: dayListItems
        });
    } catch (error) {
        console.error('Error fetching grouped schedules:', error);
        res.status(500).json({
            success: false,
            message: 'Guruhlangan jadvallarni olishda xatolik yuz berdi'
        });
    }
};

module.exports = {
    getAllSchedules,
    getScheduleById,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getSchedulesGroupedByDate
};