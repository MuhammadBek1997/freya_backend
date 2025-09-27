const { pool } = require('../config/database');

// Get all services with pagination and search
const getAllServices = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        let query = `
            SELECT s.*, sa.salon_name_uz as salon_name 
            FROM services s
            LEFT JOIN salons sa ON s.salon_id = sa.id
            WHERE s.is_active = true
        `;
        let countQuery = `
            SELECT COUNT(*) 
            FROM services s
            WHERE s.is_active = true
        `;
        let queryParams = [];
        let countParams = [];

        if (search) {
            query += ` AND (s.name ILIKE $1 OR s.title ILIKE $1 OR s.description ILIKE $1)`;
            countQuery += ` AND (s.name ILIKE $1 OR s.title ILIKE $1 OR s.description ILIKE $1)`;
            queryParams.push(`%${search}%`);
            countParams.push(`%${search}%`);
        }

        query += ` ORDER BY s.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limit, offset);

        const [servicesResult, countResult] = await Promise.all([
            pool.query(query, queryParams),
            pool.query(countQuery, countParams)
        ]);

        const total = parseInt(countResult.rows[0].count);
        const pages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: servicesResult.rows,
            pagination: {
                page,
                limit,
                total,
                pages
            }
        });
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({
            success: false,
            message: 'Xizmatlarni olishda xatolik yuz berdi',
            error: error.message
        });
    }
};

// Get service by ID
const getServiceById = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT s.*, sa.salon_name_uz as salon_name 
            FROM services s
            LEFT JOIN salons sa ON s.salon_id = sa.id
            WHERE s.id = $1 AND s.is_active = true
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Xizmat topilmadi'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching service:', error);
        res.status(500).json({
            success: false,
            message: 'Xizmatni olishda xatolik yuz berdi',
            error: error.message
        });
    }
};

// Create new service
const createService = async (req, res) => {
    try {
        const {
            salon_id,
            name,
            title,
            description,
            price,
            duration
        } = req.body;

        // Validate required fields
        if (!name || !title || !price) {
            return res.status(400).json({
                success: false,
                message: 'Majburiy maydonlar: name, title, price'
            });
        }

        const query = `
            INSERT INTO services (salon_id, name, title, description, price, duration)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;

        const values = [salon_id, name, title, description, price, duration];
        const result = await pool.query(query, values);

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Xizmat muvaffaqiyatli yaratildi'
        });
    } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({
            success: false,
            message: 'Xizmat yaratishda xatolik yuz berdi',
            error: error.message
        });
    }
};

// Update service
const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            salon_id,
            name,
            title,
            description,
            price,
            duration,
            is_active
        } = req.body;

        // Check if service exists
        const checkQuery = 'SELECT id FROM services WHERE id = $1';
        const checkResult = await pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Xizmat topilmadi'
            });
        }

        const query = `
            UPDATE services 
            SET 
                salon_id = COALESCE($1, salon_id),
                name = COALESCE($2, name),
                title = COALESCE($3, title),
                description = COALESCE($4, description),
                price = COALESCE($5, price),
                duration = COALESCE($6, duration),
                is_active = COALESCE($7, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $8
            RETURNING *
        `;

        const values = [salon_id, name, title, description, price, duration, is_active, id];
        const result = await pool.query(query, values);

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Xizmat muvaffaqiyatli yangilandi'
        });
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({
            success: false,
            message: 'Xizmatni yangilashda xatolik yuz berdi',
            error: error.message
        });
    }
};

// Delete service (soft delete)
const deleteService = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if service exists
        const checkQuery = 'SELECT id FROM services WHERE id = $1 AND is_active = true';
        const checkResult = await pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Xizmat topilmadi'
            });
        }

        const query = `
            UPDATE services 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id
        `;

        await pool.query(query, [id]);

        res.json({
            success: true,
            message: 'Xizmat muvaffaqiyatli o\'chirildi'
        });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({
            success: false,
            message: 'Xizmatni o\'chirishda xatolik yuz berdi',
            error: error.message
        });
    }
};

module.exports = {
    getAllServices,
    getServiceById,
    createService,
    updateService,
    deleteService
};