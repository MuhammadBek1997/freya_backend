const { Pool } = require('pg');
const pool = require('../config/database');

// Get all master salons
const getAllMasterSalons = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT * FROM salons 
            WHERE is_active = true
        `;
        let countQuery = `
            SELECT COUNT(*) as total FROM salons 
            WHERE is_active = true
        `;
        
        const queryParams = [];
        let paramIndex = 1;

        if (search) {
            query += ` AND (salon_name ILIKE $${paramIndex} OR salon_description ILIKE $${paramIndex})`;
            countQuery += ` AND (salon_name ILIKE $${paramIndex} OR salon_description ILIKE $${paramIndex})`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const salonsResult = await pool.query(query, queryParams);
        const countResult = await pool.query(countQuery, search ? [`%${search}%`] : []);

        const salons = salonsResult.rows.map(salon => {
            // Parse JSON fields safely
            try {
                salon.comments = salon.comments && salon.comments !== 'null' ? JSON.parse(salon.comments) : [];
                salon.salon_payment = salon.salon_payment && salon.salon_payment !== 'null' ? JSON.parse(salon.salon_payment) : null;
                salon.salon_types = salon.salon_types && salon.salon_types !== 'null' ? JSON.parse(salon.salon_types) : [];
                salon.salon_format = salon.salon_format && salon.salon_format !== 'null' ? JSON.parse(salon.salon_format) : [{"selected":true,"format":"private"}];
                salon.work_schedule = salon.work_schedule && salon.work_schedule !== 'null' ? JSON.parse(salon.work_schedule) : [];
                salon.salon_additionals = salon.salon_additionals && salon.salon_additionals !== 'null' ? JSON.parse(salon.salon_additionals) : [];
                salon.location = salon.location && salon.location !== 'null' ? JSON.parse(salon.location) : null;
                salon.salon_orient = salon.salon_orient && salon.salon_orient !== 'null' ? JSON.parse(salon.salon_orient) : null;
                salon.salon_photos = salon.salon_photos && salon.salon_photos !== 'null' ? JSON.parse(salon.salon_photos) : [];
                salon.salon_comfort = salon.salon_comfort && salon.salon_comfort !== 'null' ? JSON.parse(salon.salon_comfort) : [];
            } catch (parseError) {
                console.error('JSON parsing error in getAllMasterSalons:', parseError);
                // Set default values if parsing fails
                salon.comments = [];
                salon.salon_payment = null;
                salon.salon_types = [];
                salon.salon_format = [];
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
        console.error('Master salonlarni olishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatoligi',
            error: error.message
        });
    }
};

// Get master salon by ID
const getMasterSalonById = async (req, res) => {
    try {
        const { id } = req.params;

        const query = 'SELECT * FROM salons WHERE id = $1 AND is_active = true AND salon_format::text LIKE \'%"format":"private"%\'';
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Master salon topilmadi'
            });
        }

        const salon = result.rows[0];
        
        // Parse JSON fields safely
        try {
            salon.comments = salon.comments && salon.comments !== 'null' ? JSON.parse(salon.comments) : [];
            salon.salon_payment = salon.salon_payment && salon.salon_payment !== 'null' ? JSON.parse(salon.salon_payment) : null;
            salon.salon_types = salon.salon_types && salon.salon_types !== 'null' ? JSON.parse(salon.salon_types) : [];
            salon.salon_format = salon.salon_format && salon.salon_format !== 'null' ? JSON.parse(salon.salon_format) : [{"selected":true,"format":"private"}];
            salon.work_schedule = salon.work_schedule && salon.work_schedule !== 'null' ? JSON.parse(salon.work_schedule) : [];
            salon.salon_additionals = salon.salon_additionals && salon.salon_additionals !== 'null' ? JSON.parse(salon.salon_additionals) : [];
            salon.location = salon.location && salon.location !== 'null' ? JSON.parse(salon.location) : null;
            salon.salon_orient = salon.salon_orient && salon.salon_orient !== 'null' ? JSON.parse(salon.salon_orient) : null;
            salon.salon_photos = salon.salon_photos && salon.salon_photos !== 'null' ? JSON.parse(salon.salon_photos) : [];
            salon.salon_comfort = salon.salon_comfort && salon.salon_comfort !== 'null' ? JSON.parse(salon.salon_comfort) : [];
        } catch (parseError) {
            console.error('JSON parsing error in getMasterSalonById:', parseError);
            // Set default values if parsing fails
            salon.comments = [];
            salon.salon_payment = null;
            salon.salon_types = [];
            salon.salon_format = [];
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
        console.error('Master salonni olishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatoligi',
            error: error.message
        });
    }
};

// Update master salon
const updateMasterSalon = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            salon_name, salon_phone, salon_add_phone, salon_instagram,
            salon_rating, comments, salon_payment, salon_description, salon_types,
            salon_format, work_schedule, salon_title, salon_additionals, sale_percent,
            sale_limit, location, salon_orient, salon_photos, salon_comfort
        } = req.body;

        // Check if master salon exists
        const checkQuery = 'SELECT * FROM salons WHERE id = $1 AND salon_format::text LIKE \'%"format":"private"%\'';
        const checkResult = await pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Master salon topilmadi'
            });
        }

        const query = `
            UPDATE salons SET
                salon_name = $1, salon_phone = $2, salon_add_phone = $3, salon_instagram = $4,
                salon_rating = $5, comments = $6, salon_payment = $7, salon_description = $8, salon_types = $9,
                salon_format = $10, work_schedule = $11, salon_title = $12, salon_additionals = $13, sale_percent = $14,
                sale_limit = $15, location = $16, salon_orient = $17, salon_photos = $18, salon_comfort = $19,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $20
            RETURNING *
        `;

        const values = [
            salon_name, salon_phone, salon_add_phone, salon_instagram,
            salon_rating, JSON.stringify(comments || []), JSON.stringify(salon_payment || null), salon_description, JSON.stringify(salon_types || []),
            JSON.stringify(salon_format || [{"selected":true,"format":"private"}]), JSON.stringify(work_schedule || []), salon_title, JSON.stringify(salon_additionals || []), sale_percent || 0,
            sale_limit || 0, JSON.stringify(location || null), JSON.stringify(salon_orient || null), JSON.stringify(salon_photos || []), JSON.stringify(salon_comfort || []),
            id
        ];

        const result = await pool.query(query, values);
        const salon = result.rows[0];

        // Parse JSON fields back to objects
        try {
            salon.comments = salon.comments && salon.comments !== 'null' ? JSON.parse(salon.comments) : [];
            salon.salon_payment = salon.salon_payment && salon.salon_payment !== 'null' ? JSON.parse(salon.salon_payment) : null;
            salon.salon_types = salon.salon_types && salon.salon_types !== 'null' ? JSON.parse(salon.salon_types) : [];
            salon.salon_format = salon.salon_format && salon.salon_format !== 'null' ? JSON.parse(salon.salon_format) : [];
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
            salon.salon_format = [];
            salon.work_schedule = [];
            salon.salon_additionals = [];
            salon.location = null;
            salon.salon_orient = null;
            salon.salon_photos = [];
            salon.salon_comfort = [];
        }

        res.json({
            success: true,
            message: 'Master salon muvaffaqiyatli yangilandi',
            data: salon
        });
    } catch (error) {
        console.error('Master salonni yangilashda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatoligi',
            error: error.message
        });
    }
};

// Delete master salon
const deleteMasterSalon = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if master salon exists
        const checkQuery = 'SELECT * FROM salons WHERE id = $1 AND salon_format::text LIKE \'%"format":"private"%\'';
        const checkResult = await pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Master salon topilmadi'
            });
        }

        // Soft delete - set is_active to false
        const query = 'UPDATE salons SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1';
        await pool.query(query, [id]);

        res.json({
            success: true,
            message: 'Master salon muvaffaqiyatli o\'chirildi'
        });
    } catch (error) {
        console.error('Master salonni o\'chirishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatoligi',
            error: error.message
        });
    }
};

// Add comment to master salon
const addMasterSalonComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, text, rating } = req.body;

        if (!userId || !text || rating === undefined) {
            return res.status(400).json({
                success: false,
                message: 'UserId, text va rating majburiy'
            });
        }

        if (rating < 0 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating 0 dan 5 gacha bo\'lishi kerak'
            });
        }

        const newComment = {
            userId,
            text,
            rating: parseFloat(rating),
            date: new Date().toISOString()
        };

        const result = await pool.query(
            `UPDATE salons 
             SET comments = COALESCE(comments, '[]'::jsonb) || $1::jsonb 
             WHERE id = $2 AND is_active = true 
             RETURNING *`,
            [JSON.stringify([newComment]), id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Master salon topilmadi'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Komment muvaffaqiyatli qo\'shildi',
            data: newComment
        });
    } catch (error) {
        console.error('Error in addMasterSalonComment:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// Get master salon comments
const getMasterSalonComments = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const result = await pool.query(
            'SELECT comments FROM salons WHERE id = $1 AND is_active = true',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Master salon topilmadi'
            });
        }

        let comments = [];
        try {
            comments = result.rows[0].comments && result.rows[0].comments !== 'null' 
                ? JSON.parse(result.rows[0].comments) 
                : [];
        } catch (parseError) {
            console.error('JSON parsing error:', parseError);
            comments = [];
        }

        // Sort comments by date (newest first)
        comments.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Paginate comments
        const paginatedComments = comments.slice(offset, offset + parseInt(limit));

        // Get user details for each comment
        const commentsWithUserDetails = await Promise.all(
            paginatedComments.map(async (comment) => {
                try {
                    const userResult = await pool.query(
                        'SELECT id, username, email FROM users WHERE id = $1',
                        [comment.userId]
                    );
                    
                    return {
                        ...comment,
                        user: userResult.rows[0] || null
                    };
                } catch (error) {
                    console.error('Error fetching user details:', error);
                    return {
                        ...comment,
                        user: null
                    };
                }
            })
        );

        res.json({
            success: true,
            data: {
                comments: commentsWithUserDetails,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(comments.length / limit),
                    totalComments: comments.length,
                    hasNextPage: offset + parseInt(limit) < comments.length,
                    hasPrevPage: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Error in getMasterSalonComments:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

module.exports = {
    getAllMasterSalons,
    getMasterSalonById,
    updateMasterSalon,
    deleteMasterSalon,
    addMasterSalonComment,
    getMasterSalonComments
};