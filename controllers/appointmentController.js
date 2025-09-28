const { pool } = require('../config/database');

// Generate unique application number
const generateApplicationNumber = async () => {
    try {
        const result = await pool.query('SELECT nextval(\'appointment_number_seq\') as next_val');
        const nextVal = result.rows[0].next_val;
        return `APP${String(nextVal).padStart(6, '0')}`;
    } catch (error) {
        console.error('Error generating application number:', error);
        throw error;
    }
};

// Create new appointment
const createAppointment = async (req, res) => {
    try {
        const {
            schedule_id,
            user_name,
            phone_number,
            application_date,
            application_time,
            service_name,
            service_price,
            notes
        } = req.body;

        const user_id = req.user.id; // JWT token'dan olinadi

        // Validate required fields
        if (!schedule_id || !user_name || !phone_number || !application_date || !application_time) {
            return res.status(400).json({
                success: false,
                message: 'Barcha majburiy maydonlarni to\'ldiring'
            });
        }

        // Check if schedule exists and get salon_id
        const scheduleCheck = await pool.query('SELECT id, employee_list, salon_id FROM schedules WHERE id = $1', [schedule_id]);
        if (scheduleCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Jadval topilmadi'
            });
        }

        const employee_list = scheduleCheck.rows[0].employee_list;
        const salon_id = scheduleCheck.rows[0].salon_id;
        
        // For backward compatibility, if employee_list is not empty, use the first employee
        // Otherwise, set employee_id to null
        const employee_id = employee_list && employee_list.length > 0 ? employee_list[0] : null;

        // Validate that salon exists
        const salonCheck = await pool.query('SELECT id FROM salons WHERE id = $1', [salon_id]);
        if (salonCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Salon topilmadi'
            });
        }

        // Generate application number
        const application_number = await generateApplicationNumber();

        const query = `
            INSERT INTO appointments (
                application_number, user_id, user_name, phone_number,
                application_date, application_time, schedule_id, employee_id,
                service_name, service_price, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;

        const result = await pool.query(query, [
            application_number, user_id, user_name, phone_number,
            application_date, application_time, schedule_id, employee_id,
            service_name, service_price, notes
        ]);

        res.status(201).json({
            success: true,
            message: 'Zayavka muvaffaqiyatli yaratildi',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Zayavka yaratishda xatolik yuz berdi'
        });
    }
};

// Get all appointments
const getAllAppointments = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, user_id } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT a.*, e.name as employee_name
            FROM appointments a
            LEFT JOIN employees e ON a.employee_id = e.id
            WHERE 1=1
        `;
        const params = [];

        // Filter by admin's salon if user is admin
        if (req.user.role === 'admin' && req.user.salon_id) {
            query += ` AND e.salon_id = $${params.length + 1}`;
            params.push(req.user.salon_id);
        }

        if (status) {
            query += ` AND a.status = $${params.length + 1}`;
            params.push(status);
        }

        if (user_id) {
            query += ` AND a.user_id = $${params.length + 1}`;
            params.push(user_id);
        }

        query += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const appointments = await pool.query(query, params);


        // Get total count
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM appointments a
            LEFT JOIN employees e ON a.employee_id = e.id
            WHERE 1=1
        `;
        const countParams = [];

        // Filter by admin's salon if user is admin
        if (req.user.role === 'admin' && req.user.salon_id) {
            countQuery += ` AND e.salon_id = $${countParams.length + 1}`;
            countParams.push(req.user.salon_id);
        }

        if (status) {
            countQuery += ` AND a.status = $${countParams.length + 1}`;
            countParams.push(status);
        }

        if (user_id) {
            countQuery += ` AND a.user_id = $${countParams.length + 1}`;
            countParams.push(user_id);
        }

        const totalResult = await pool.query(countQuery, countParams);
        const total = totalResult.rows[0].total;

        res.json({
            success: true,
            message: 'Zayavkalar muvaffaqiyatli olindi',
            data: appointments.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Zayavkalarni olishda xatolik yuz berdi'
        });
    }
};

// Get appointment by ID
const getAppointmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT a.*, s.day_of_week, s.start_time, s.end_time,
                   u.full_name as user_full_name, u.email as user_email,
                   e.name as employee_name
            FROM appointments a
            LEFT JOIN schedules s ON a.schedule_id = s.id
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN employees e ON a.employee_id = e.id
            WHERE a.id = $1
        `;

        const appointment = await pool.query(query, [id]);

        if (appointment.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Zayavka topilmadi'
            });
        }

        res.json({
            success: true,
            message: 'Zayavka ma\'lumotlari muvaffaqiyatli olindi',
            data: appointment.rows[0]
        });
    } catch (error) {
        console.error('Error fetching appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Zayavka ma\'lumotlarini olishda xatolik yuz berdi'
        });
    }
};

// Update appointment status
const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        // Validate status
        const validStatuses = ['pending', 'cancelled', 'accepted', 'ignored', 'done'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Noto\'g\'ri status. Ruxsat etilgan statuslar: ' + validStatuses.join(', ')
            });
        }

        const query = `
            UPDATE appointments SET
                status = $1,
                notes = COALESCE($2, notes),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `;

        const result = await pool.query(query, [status, notes, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Zayavka topilmadi'
            });
        }

        res.json({
            success: true,
            message: 'Zayavka statusi muvaffaqiyatli yangilandi',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating appointment status:', error);
        res.status(500).json({
            success: false,
            message: 'Zayavka statusini yangilashda xatolik yuz berdi'
        });
    }
};

// Get user's appointments
const getUserAppointments = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT a.*
            FROM appointments a
            WHERE a.user_id = $1
        `;
        const params = [userId];
        


        if (status) {
            query += ` AND a.status = $${params.length + 1}`;
            params.push(status);
        }

        query += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const appointments = await pool.query(query, params);

        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM appointments WHERE user_id = $1`;
        const countParams = [userId];

        if (status) {
            countQuery += ` AND status = $${countParams.length + 1}`;
            countParams.push(status);
        }

        const totalResult = await pool.query(countQuery, countParams);
        const total = totalResult.rows[0].total;

        res.json({
            success: true,
            message: 'Foydalanuvchi zayavkalari muvaffaqiyatli olindi',
            data: appointments.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching user appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Foydalanuvchi zayavkalarini olishda xatolik yuz berdi'
        });
    }
};

// Update appointment (user can update their own appointment)
const updateAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.userId; // JWT token'dan olinadi
        const {
            application_date,
            application_time,
            service_name,
            service_price,
            notes
        } = req.body;

        // Check if appointment belongs to user
        const appointmentCheck = await pool.query(
            'SELECT id, status FROM appointments WHERE id = $1 AND user_id = $2',
            [id, user_id]
        );

        if (appointmentCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Zayavka topilmadi yoki sizga tegishli emas'
            });
        }

        const currentStatus = appointmentCheck.rows[0].status;
        if (currentStatus === 'done' || currentStatus === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Bu zayavkani yangilab bo\'lmaydi'
            });
        }

        // Build dynamic update query
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (application_date) {
            updateFields.push(`application_date = $${paramIndex}`);
            updateValues.push(application_date);
            paramIndex++;
        }

        if (application_time) {
            updateFields.push(`application_time = $${paramIndex}`);
            updateValues.push(application_time);
            paramIndex++;
        }

        if (service_name) {
            updateFields.push(`service_name = $${paramIndex}`);
            updateValues.push(service_name);
            paramIndex++;
        }

        if (service_price) {
            updateFields.push(`service_price = $${paramIndex}`);
            updateValues.push(service_price);
            paramIndex++;
        }

        if (notes !== undefined) {
            updateFields.push(`notes = $${paramIndex}`);
            updateValues.push(notes);
            paramIndex++;
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Yangilanishi kerak bo\'lgan maydon ko\'rsatilmagan'
            });
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(id);

        const query = `
            UPDATE appointments SET
                ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await pool.query(query, updateValues);

        res.json({
            success: true,
            message: 'Zayavka muvaffaqiyatli yangilandi',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Zayavkani yangilashda xatolik yuz berdi'
        });
    }
};

// Cancel appointment (user can cancel their own appointment)
const cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.userId; // JWT token'dan olinadi

        // Check if appointment belongs to user
        const appointmentCheck = await pool.query(
            'SELECT id, status FROM appointments WHERE id = $1 AND user_id = $2',
            [id, user_id]
        );

        if (appointmentCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Zayavka topilmadi yoki sizga tegishli emas'
            });
        }

        const currentStatus = appointmentCheck.rows[0].status;
        if (currentStatus === 'done' || currentStatus === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Bu zayavkani bekor qilib bo\'lmaydi'
            });
        }

        const query = `
            UPDATE appointments SET
                status = 'cancelled',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;

        const result = await pool.query(query, [id]);

        res.json({
            success: true,
            message: 'Zayavka muvaffaqiyatli bekor qilindi',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Zayavkani bekor qilishda xatolik yuz berdi'
        });
    }
};

const deleteAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;



        // Check if appointment exists and belongs to user
        const checkQuery = `
            SELECT * FROM appointments 
            WHERE id = $1 AND user_id = $2
        `;
        const checkResult = await pool.query(checkQuery, [id, userId]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Zayavka topilmadi yoki sizga tegishli emas'
            });
        }

        const appointment = checkResult.rows[0];

        // Check if appointment can be deleted
        if (appointment.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Yakunlangan zayavkani o\'chirib bo\'lmaydi'
            });
        }

        if (appointment.status === 'in_progress') {
            return res.status(400).json({
                success: false,
                message: 'Jarayonda bo\'lgan zayavkani o\'chirib bo\'lmaydi'
            });
        }

        // Delete the appointment
        const deleteQuery = `
            DELETE FROM appointments 
            WHERE id = $1
            RETURNING *
        `;

        const result = await pool.query(deleteQuery, [id]);

        res.json({
            success: true,
            message: 'Zayavka muvaffaqiyatli o\'chirildi',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Zayavkani o\'chirishda xatolik yuz berdi'
        });
    }
};

// Get appointments for a specific salon
const getSalonAppointments = async (req, res) => {
    try {
        const { salon_id } = req.params;
        const { page = 1, limit = 10, status, date } = req.query;
        const offset = (page - 1) * limit;

        // Validate salon exists
        const salonCheck = await pool.query('SELECT id FROM salons WHERE id = $1', [salon_id]);
        if (salonCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Salon topilmadi'
            });
        }

        let query = `
            SELECT a.*
            FROM appointments a
            LEFT JOIN schedules s ON a.schedule_id = s.id
            WHERE s.salon_id = $1
        `;
        const params = [salon_id];

        if (status) {
            query += ` AND a.status = $${params.length + 1}`;
            params.push(status);
        }

        if (date) {
            query += ` AND a.application_date = $${params.length + 1}`;
            params.push(date);
        }

        query += ` ORDER BY a.application_date DESC, a.application_time DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Get total count
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM appointments a
            LEFT JOIN schedules s ON a.schedule_id = s.id
            WHERE s.salon_id = $1
        `;
        const countParams = [salon_id];

        if (status) {
            countQuery += ` AND a.status = $${countParams.length + 1}`;
            countParams.push(status);
        }

        if (date) {
            countQuery += ` AND a.application_date = $${countParams.length + 1}`;
            countParams.push(date);
        }

        const totalResult = await pool.query(countQuery, countParams);
        const total = totalResult.rows[0].total;

        res.json({
            success: true,
            message: 'Salon zayavkalari muvaffaqiyatli olindi',
            data: appointments.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching salon appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Salon zayavkalarini olishda xatolik yuz berdi'
        });
    }
};

// Get appointments by salon ID with proper filtering
const getAppointmentsBySalonId = async (req, res) => {
    try {
        const { salon_id } = req.params;
        const { page = 1, limit = 10, status, date, employee_id } = req.query;
        const offset = (page - 1) * limit;

        // Validate salon exists
        const salonCheck = await pool.query('SELECT id, salon_name FROM salons WHERE id = $1', [salon_id]);
        if (salonCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Salon topilmadi'
            });
        }

        let query = `
            SELECT a.*, e.name as employee_name, u.full_name as user_name
            FROM appointments a
            LEFT JOIN employees e ON a.employee_id = e.id
            LEFT JOIN users u ON a.user_id = u.id
            WHERE e.salon_id = $1
        `;
        const params = [salon_id];

        if (status) {
            query += ` AND a.status = $${params.length + 1}`;
            params.push(status);
        }

        if (date) {
            query += ` AND a.application_date = $${params.length + 1}`;
            params.push(date);
        }

        if (employee_id) {
            query += ` AND a.employee_id = $${params.length + 1}`;
            params.push(employee_id);
        }

        query += ` ORDER BY a.application_date DESC, a.application_time DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        console.log('Executing query:', query);
        console.log('With params:', params);
        const appointments = await pool.query(query, params);

        // Get total count
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM appointments a
            LEFT JOIN employees e ON a.employee_id = e.id
            WHERE e.salon_id = $1
        `;
        const countParams = [salon_id];

        if (status) {
            countQuery += ` AND a.status = $${countParams.length + 1}`;
            countParams.push(status);
        }

        if (date) {
            countQuery += ` AND a.application_date = $${countParams.length + 1}`;
            countParams.push(date);
        }

        if (employee_id) {
            countQuery += ` AND a.employee_id = $${countParams.length + 1}`;
            countParams.push(employee_id);
        }

        const totalResult = await pool.query(countQuery, countParams);
        const total = totalResult.rows[0].total;

        res.json({
            success: true,
            message: 'Salon appointmentlari muvaffaqiyatli olindi',
            data: appointments.rows,
            salon: salonCheck.rows[0],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(total),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching salon appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Salon appointmentlarini olishda xatolik yuz berdi'
        });
    }
};

module.exports = {
    createAppointment,
    getAllAppointments,
    getAppointmentById,
    updateAppointment,
    updateAppointmentStatus,
    getUserAppointments,
    getSalonAppointments,
    getAppointmentsBySalonId,
    cancelAppointment,
    deleteAppointment
};