const { Pool } = require('pg');
const { generateToken } = require('../middleware/authMiddleware');
const pool = require('../config/database');

// Create a new salon
const createSalon = async (req, res) => {
    console.log('CreateSalon function called with body:', req.body);
    try {
        const {
            salon_name,
            salon_phone,
            salon_add_phone,
            salon_instagram,
            salon_rating = 0,
            comments = [],
            salon_payment,
            salon_description,
            salon_types = [],
            private_salon = false,
            work_schedule = [],
            salon_title,
            salon_additionals = [],
            sale_percent = 0,
            sale_limit = 0,
            location,
            salon_orient,
            salon_photos = [],
            salon_comfort = []
        } = req.body;

        // Validate required fields
        if (!salon_name) {
            return res.status(400).json({
                success: false,
                message: 'Salon nomi majburiy'
            });
        }

        const query = `
            INSERT INTO salons (
                salon_name, salon_phone, salon_add_phone, salon_instagram,
                salon_rating, comments, salon_payment, salon_description, salon_types,
                private_salon, work_schedule, salon_title, salon_additionals, sale_percent,
                sale_limit, location, salon_orient, salon_photos, salon_comfort
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            RETURNING *
        `;

        const values = [
            salon_name,
            salon_phone,
            salon_add_phone,
            salon_instagram,
            salon_rating,
            JSON.stringify(comments),
            JSON.stringify(salon_payment),
            salon_description,
            JSON.stringify(salon_types),
            private_salon,
            JSON.stringify(work_schedule),
            salon_title,
            JSON.stringify(salon_additionals),
            sale_percent,
            sale_limit,
            JSON.stringify(location),
            JSON.stringify(salon_orient),
            JSON.stringify(salon_photos),
            JSON.stringify(salon_comfort)
        ];

        console.log('Executing database query...');
        const result = await pool.query(query, values);
        console.log('Database query completed successfully');
        const salon = result.rows[0];

        // Parse JSON fields back to objects
        try {
            salon.comments = salon.comments && salon.comments !== 'null' ? JSON.parse(salon.comments) : [];
            salon.salon_payment = salon.salon_payment && salon.salon_payment !== 'null' ? JSON.parse(salon.salon_payment) : null;
            salon.salon_types = salon.salon_types && salon.salon_types !== 'null' ? JSON.parse(salon.salon_types) : [];
            // private_salon is already a boolean, no need to parse
            salon.work_schedule = salon.work_schedule && salon.work_schedule !== 'null' ? JSON.parse(salon.work_schedule) : [];
            salon.salon_additionals = salon.salon_additionals && salon.salon_additionals !== 'null' ? JSON.parse(salon.salon_additionals) : [];
            salon.location = salon.location && salon.location !== 'null' ? JSON.parse(salon.location) : null;
            salon.salon_orient = salon.salon_orient && salon.salon_orient !== 'null' ? JSON.parse(salon.salon_orient) : null;
            salon.salon_photos = salon.salon_photos && salon.salon_photos !== 'null' ? JSON.parse(salon.salon_photos) : [];
            salon.salon_comfort = salon.salon_comfort && salon.salon_comfort !== 'null' ? JSON.parse(salon.salon_comfort) : [];
        } catch (parseError) {
            console.error('JSON parsing error:', parseError);
            // Set default values if parsing fails
            salon.comments = [];
            salon.salon_payment = null;
            salon.salon_types = [];
            // private_salon is already a boolean, no need to set default
            salon.work_schedule = [];
            salon.salon_additionals = [];
            salon.location = null;
            salon.salon_orient = null;
            salon.salon_photos = [];
            salon.salon_comfort = [];
        }

        res.status(201).json({
            success: true,
            message: 'Salon muvaffaqiyatli yaratildi',
            data: salon
        });

    } catch (error) {
        console.error('Salon yaratishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatoligi',
            error: error.message
        });
    }
};

// Create a new master salon


// Get all salons
const getAllSalons = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT * FROM salons 
            WHERE 1=1
        `;
        let countQuery = `
            SELECT COUNT(*) FROM salons 
            WHERE 1=1
        `;
        let queryParams = [];
        let paramIndex = 1;

        if (search) {
            query += ` AND (salon_name ILIKE $${paramIndex} OR salon_description ILIKE $${paramIndex})`;
            countQuery += ` AND (salon_name ILIKE $${paramIndex} OR salon_description ILIKE $${paramIndex})`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const [salonsResult, countResult] = await Promise.all([
            pool.query(query, queryParams),
            pool.query(countQuery, search ? [`%${search}%`] : [])
        ]);

        const salons = salonsResult.rows.map(salon => {
            // Parse JSON fields safely
            try {
                salon.comments = salon.comments && salon.comments !== 'null' ? JSON.parse(salon.comments) : [];
                salon.salon_payment = salon.salon_payment && salon.salon_payment !== 'null' ? JSON.parse(salon.salon_payment) : null;
                salon.salon_types = salon.salon_types && salon.salon_types !== 'null' ? JSON.parse(salon.salon_types) : [];
                // private_salon is already a boolean, no need to parse
                salon.work_schedule = salon.work_schedule && salon.work_schedule !== 'null' ? JSON.parse(salon.work_schedule) : [];
                salon.salon_additionals = salon.salon_additionals && salon.salon_additionals !== 'null' ? JSON.parse(salon.salon_additionals) : [];
                salon.location = salon.location && salon.location !== 'null' ? JSON.parse(salon.location) : null;
                salon.salon_orient = salon.salon_orient && salon.salon_orient !== 'null' ? JSON.parse(salon.salon_orient) : null;
                salon.salon_photos = salon.salon_photos && salon.salon_photos !== 'null' ? JSON.parse(salon.salon_photos) : [];
                salon.salon_comfort = salon.salon_comfort && salon.salon_comfort !== 'null' ? JSON.parse(salon.salon_comfort) : [];
            } catch (parseError) {
                console.error('JSON parsing error in getAllSalons:', parseError);
                // Set default values if parsing fails
                salon.comments = [];
                salon.salon_payment = null;
                salon.salon_types = [];
                // private_salon is already a boolean, no need to set default
                salon.work_schedule = [];
                salon.salon_additionals = [];
                salon.location = null;
                salon.salon_orient = null;
                salon.salon_photos = [];
                salon.salon_comfort = [];
            }
            return salon;
        });

        const totalCount = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalCount / limit);

        res.json({
            success: true,
            data: salons,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalCount,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Salonlarni olishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatoligi',
            error: error.message
        });
    }
};

// Get salon by ID
const getSalonById = async (req, res) => {
    try {
        const { id } = req.params;

        const query = 'SELECT * FROM salons WHERE id = $1 AND is_active = true';
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Salon topilmadi'
            });
        }

        const salon = result.rows[0];
        
        // Parse JSON fields safely
        try {
            salon.comments = salon.comments && salon.comments !== 'null' ? JSON.parse(salon.comments) : [];
            salon.salon_payment = salon.salon_payment && salon.salon_payment !== 'null' ? JSON.parse(salon.salon_payment) : null;
            salon.salon_types = salon.salon_types && salon.salon_types !== 'null' ? JSON.parse(salon.salon_types) : [];
            // private_salon is already a boolean, no need to parse
            salon.work_schedule = salon.work_schedule && salon.work_schedule !== 'null' ? JSON.parse(salon.work_schedule) : [];
            salon.salon_additionals = salon.salon_additionals && salon.salon_additionals !== 'null' ? JSON.parse(salon.salon_additionals) : [];
            salon.location = salon.location && salon.location !== 'null' ? JSON.parse(salon.location) : null;
            salon.salon_orient = salon.salon_orient && salon.salon_orient !== 'null' ? JSON.parse(salon.salon_orient) : null;
            salon.salon_photos = salon.salon_photos && salon.salon_photos !== 'null' ? JSON.parse(salon.salon_photos) : [];
            salon.salon_comfort = salon.salon_comfort && salon.salon_comfort !== 'null' ? JSON.parse(salon.salon_comfort) : [];
        } catch (parseError) {
            console.error('JSON parsing error in getSalonById:', parseError);
            // Set default values if parsing fails
            salon.comments = [];
            salon.salon_payment = null;
            salon.salon_types = [];
            salon.salon_format = {"selected":true,"format":"corporative"};
            salon.work_schedule = [];
            salon.salon_additionals = [];
            salon.location = null;
            salon.salon_orient = null;
            salon.salon_photos = [];
            salon.salon_comfort = [];
        }

        res.json({
            success: true,
            data: salon
        });

    } catch (error) {
        console.error('Salonni olishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatoligi',
            error: error.message
        });
    }
};

// Update salon
const updateSalon = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Remove id and timestamps from update data
        delete updateData.id;
        delete updateData.created_at;
        delete updateData.updated_at;

        // Build dynamic update query
        const fields = Object.keys(updateData);
        const values = Object.values(updateData);
        
        if (fields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Yangilanishi kerak bo\'lgan ma\'lumotlar yo\'q'
            });
        }

        // Convert objects to JSON strings for JSONB fields
        const jsonFields = ['comments', 'salon_payment', 'salon_types', 'salon_format', 'work_schedule', 'salon_additionals', 'location', 'salon_orient', 'salon_photos', 'salon_comfort'];
        
        fields.forEach((field, index) => {
            if (jsonFields.includes(field) && typeof values[index] === 'object') {
                values[index] = JSON.stringify(values[index]);
            }
        });

        const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        const query = `
            UPDATE salons 
            SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $1 AND is_active = true 
            RETURNING *
        `;

        const result = await pool.query(query, [id, ...values]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Salon topilmadi'
            });
        }

        const salon = result.rows[0];
        
        // Parse JSON fields
        salon.comments = JSON.parse(salon.comments || '[]');
        salon.salon_payment = JSON.parse(salon.salon_payment || '{}');
        salon.salon_types = JSON.parse(salon.salon_types || '[]');
        salon.salon_format = JSON.parse(salon.salon_format || '{"selected":true,"format":"corporative"}');
        salon.work_schedule = JSON.parse(salon.work_schedule || '[]');
        salon.salon_additionals = JSON.parse(salon.salon_additionals || '[]');
        salon.location = JSON.parse(salon.location || '{}');
        salon.salon_orient = JSON.parse(salon.salon_orient || '{}');
        salon.salon_photos = JSON.parse(salon.salon_photos || '[]');
        salon.salon_comfort = JSON.parse(salon.salon_comfort || '[]');

        res.json({
            success: true,
            message: 'Salon muvaffaqiyatli yangilandi',
            data: salon
        });

    } catch (error) {
        console.error('Salonni yangilashda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatoligi',
            error: error.message
        });
    }
};

// Delete salon (soft delete)
const deleteSalon = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            UPDATE salons 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $1 AND is_active = true 
            RETURNING id, salon_name
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Salon topilmadi'
            });
        }

        res.json({
            success: true,
            message: 'Salon muvaffaqiyatli o\'chirildi',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Salonni o\'chirishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatoligi',
            error: error.message
        });
    }
};

// Add comment to salon
const addSalonComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { text, rating } = req.body;
        const userId = req.user.id; // From auth middleware
        
        // Check if salon exists
        const salonCheck = await pool.query('SELECT id FROM salons WHERE id = $1', [id]);
        if (salonCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Salon topilmadi'
            });
        }
        
        const query = `
            INSERT INTO salon_comments (salon_id, user_id, text, rating)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        
        const result = await pool.query(query, [id, userId, text, rating]);
        
        res.status(201).json({
            success: true,
            message: 'Izoh muvaffaqiyatli qo\'shildi',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error adding salon comment:', error);
        res.status(500).json({
            success: false,
            message: 'Izoh qo\'shishda xatolik yuz berdi'
        });
    }
};

// Get salon comments
const getSalonComments = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        
        const query = `
            SELECT sc.*, u.username, u.full_name
            FROM salon_comments sc
            LEFT JOIN users u ON sc.user_id = u.id
            WHERE sc.salon_id = $1
            ORDER BY sc.created_at DESC
            LIMIT $2 OFFSET $3
        `;
        
        const comments = await pool.query(query, [id, limit, offset]);
        
        // Get total count
        const countQuery = 'SELECT COUNT(*) as total FROM salon_comments WHERE salon_id = $1';
        const totalResult = await pool.query(countQuery, [id]);
        const total = parseInt(totalResult.rows[0].total);
        
        res.json({
            success: true,
            data: comments.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching salon comments:', error);
        res.status(500).json({
            success: false,
            message: 'Izohlarni olishda xatolik yuz berdi'
        });
    }
};

module.exports = {
    createSalon,
    getAllSalons,
    getSalonById,
    updateSalon,
    deleteSalon,
    addSalonComment,
    getSalonComments
};