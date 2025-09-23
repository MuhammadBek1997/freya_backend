const { pool } = require('../config/database');
const employeeTranslationService = require('../services/employeeTranslationService');

// Get all employees
const getAllEmployees = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const language = req.language || req.query.current_language || 'ru'; // Language middleware'dan olinadi
        const offset = (page - 1) * limit;

        let query = `
            SELECT e.*, s.name as salon_name,
                   COUNT(c.id) as comment_count,
                   AVG(c.rating) as avg_rating
            FROM employees e
            LEFT JOIN salons s ON e.salon_id = s.id
            LEFT JOIN employee_comments c ON e.id = c.employee_id
        `;
        
        const params = [];
        
        if (search) {
            query += ` WHERE (e.name ILIKE $1 OR e.surname ILIKE $2 OR e.profession ILIKE $3)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        query += ` GROUP BY e.id, s.name ORDER BY e.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const employees = await pool.query(query, params);
        
        // Xodimlarni tarjima qilingan holatda olish
        const translatedEmployees = await Promise.all(employees.rows.map(async (employee) => {
            const translatedEmployee = await employeeTranslationService.getEmployeeByLanguage(employee.id, language);
            
            if (translatedEmployee) {
                // Tarjima mavjud bo'lsa, name, surname, profession'ni almashtirish
                employee.name = translatedEmployee.name;
                employee.surname = translatedEmployee.surname;
                employee.profession = translatedEmployee.profession;
                employee.bio = translatedEmployee.bio;
                employee.specialization = translatedEmployee.specialization;
            }
            
            return employee;
        }));
        
        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM employees`;
        const countParams = [];
        
        if (search) {
            countQuery += ` WHERE (name ILIKE $1 OR surname ILIKE $2 OR profession ILIKE $3)`;
            countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        const totalResult = await pool.query(countQuery, countParams);
        const total = totalResult.rows[0].total;

        res.json({
            success: true,
            data: translatedEmployees,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching all employees:', error);
        res.status(500).json({
            success: false,
            message: 'Xodim ma\'lumotlarini olishda xatolik yuz berdi'
        });
    }
};

// Get all employees for a specific salon
const getEmployeesBySalonId = async (req, res) => {
    try {
        const { salonId } = req.params;
        const { page = 1, limit = 10, search = '' } = req.query;
        const language = req.language || req.query.current_language || 'ru'; // Language middleware'dan olinadi
        const offset = (page - 1) * limit;

        // Check if salon exists
        const salonQuery = 'SELECT id FROM salons WHERE id = $1';
        const salonResult = await pool.query(salonQuery, [salonId]);
        
        if (salonResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Salon topilmadi'
            });
        }

        let query = `
            SELECT e.*, 
                   COUNT(c.id) as comment_count,
                   AVG(c.rating) as avg_rating
            FROM employees e
            LEFT JOIN employee_comments c ON e.id = c.employee_id
            WHERE e.salon_id = $1
        `;
        
        const params = [salonId];
        
        if (search) {
            query += ` AND (e.name ILIKE $2 OR e.surname ILIKE $3 OR e.profession ILIKE $4)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        query += ` GROUP BY e.id ORDER BY e.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const employees = await pool.query(query, params);
        
        // Xodimlarni tarjima qilingan holatda olish
        const translatedEmployees = await Promise.all(employees.rows.map(async (employee) => {
            const translatedEmployee = await employeeTranslationService.getEmployeeByLanguage(employee.id, language);
            
            if (translatedEmployee) {
                // Tarjima mavjud bo'lsa, name, surname, profession'ni almashtirish
                employee.name = translatedEmployee.name;
                employee.surname = translatedEmployee.surname;
                employee.profession = translatedEmployee.profession;
                employee.bio = translatedEmployee.bio;
                employee.specialization = translatedEmployee.specialization;
            }
            
            return employee;
        }));
        
        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM employees WHERE salon_id = $1`;
        const countParams = [salonId];
        
        if (search) {
            countQuery += ` AND (name ILIKE $2 OR surname ILIKE $3 OR profession ILIKE $4)`;
            countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        const totalResult = await pool.query(countQuery, countParams);
        const total = totalResult.rows[0].total;

        res.json({
            success: true,
            data: translatedEmployees,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({
            success: false,
            message: 'Xodimlarni olishda xatolik yuz berdi'
        });
    }
};

// Get employee by ID with comments and posts
const getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;
        const language = req.language || req.query.current_language || 'ru'; // Language middleware'dan olinadi
        
        // Get employee basic info
        const employeeQuery = `
            SELECT e.*, s.name as salon_name
            FROM employees e
            LEFT JOIN salons s ON e.salon_id = s.id
            WHERE e.id = $1
        `;
        const employees = await pool.query(employeeQuery, [id]);
        
        if (employees.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Xodim topilmadi'
            });
        }
        
        let employee = employees.rows[0];
        
        // Xodimni tarjima qilingan holatda olish
        const translatedEmployee = await employeeTranslationService.getEmployeeByLanguage(employee.id, language);
        
        if (translatedEmployee) {
            // Tarjima mavjud bo'lsa, name, surname, profession'ni almashtirish
            employee.name = translatedEmployee.name;
            employee.surname = translatedEmployee.surname;
            employee.profession = translatedEmployee.profession;
            employee.bio = translatedEmployee.bio;
            employee.specialization = translatedEmployee.specialization;
        }
        
        // Get comments
        const commentsQuery = `
            SELECT c.*, u.username, u.full_name
            FROM employee_comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.employee_id = $1
            ORDER BY c.created_at DESC
        `;
        const comments = await pool.query(commentsQuery, [id]);
        
        // Get posts
        const postsQuery = `
            SELECT p.*
            FROM employee_posts p
            WHERE p.employee_id = $1
            ORDER BY p.created_at DESC
        `;
        const posts = await pool.query(postsQuery, [id]);
        
        // Format posts
        const formattedPosts = posts.rows.map(post => ({
            ...post,
            media: []
        }));
        
        // Calculate average rating
        const avgRating = comments.rows.length > 0 
            ? comments.rows.reduce((sum, comment) => sum + comment.rating, 0) / comments.rows.length 
            : 0;
        
        res.json({
            success: true,
            data: {
                ...employee,
                rating: parseFloat(avgRating.toFixed(1)),
                comments: comments.rows,
                posts: formattedPosts
            }
        });
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({
            success: false,
            message: 'Xodim ma\'lumotlarini olishda xatolik yuz berdi'
        });
    }
};

// Create new employee
const createEmployee = async (req, res) => {
    try {
        const {
            salon_id,
            name,
            surname,
            phone,
            email,
            profession,
            username,
            password
        } = req.body;
        
        // Check if salon exists
        const salonQuery = 'SELECT id FROM salons WHERE id = $1';
        const salonResult = await pool.query(salonQuery, [salon_id]);
        
        if (salonResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Salon topilmadi'
            });
        }
        
        // Check if username or email already exists
        const existingEmployee = await pool.query(
            'SELECT id FROM employees WHERE username = $1 OR email = $2',
            [username, email]
        );
        
        if (existingEmployee.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Username yoki email allaqachon mavjud'
            });
        }
        
        const query = `
            INSERT INTO employees (salon_id, name, surname, phone, email, profession, username, password, is_waiting)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
        `;
        
        const result = await pool.query(query, [
            salon_id, name, surname, phone, email, profession, username, password, true
        ]);
        
        res.status(201).json({
            success: true,
            message: 'Xodim muvaffaqiyatli yaratildi',
            data: {
                id: result.rows[0].id,
                salon_id,
                name,
                surname,
                phone,
                email,
                profession,
                username
            }
        });
    } catch (error) {
        console.error('Error creating employee:', error);
        res.status(500).json({
            success: false,
            message: 'Xodim yaratishda xatolik yuz berdi'
        });
    }
};

// Update employee
const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            surname,
            phone,
            email,
            profession,
            username
        } = req.body;
        
        // Check if employee exists
        const existingEmployee = await pool.query('SELECT id FROM employees WHERE id = $1', [id]);
        if (existingEmployee.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Xodim topilmadi'
            });
        }
        
        // Check if username or email already exists for other employees
        const duplicateCheck = await pool.query(
            'SELECT id FROM employees WHERE (username = $1 OR email = $2) AND id != $3',
            [username, email, id]
        );
        
        if (duplicateCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Username yoki email allaqachon mavjud'
            });
        }
        
        const query = `
            UPDATE employees 
            SET name = $1, surname = $2, phone = $3, email = $4, profession = $5, username = $6
            WHERE id = $7
        `;
        
        await pool.query(query, [name, surname, phone, email, profession, username, id]);
        
        res.json({
            success: true,
            message: 'Xodim ma\'lumotlari muvaffaqiyatli yangilandi'
        });
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({
            success: false,
            message: 'Xodim ma\'lumotlarini yangilashda xatolik yuz berdi'
        });
    }
};

// Delete employee
const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if employee exists
        const existingEmployee = await pool.query('SELECT id FROM employees WHERE id = $1', [id]);
        if (existingEmployee.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Xodim topilmadi'
            });
        }
        
        // Soft delete
        await pool.query('UPDATE employees SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
        
        res.json({
            success: true,
            message: 'Xodim muvaffaqiyatli o\'chirildi'
        });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({
            success: false,
            message: 'Xodimni o\'chirishda xatolik yuz berdi'
        });
    }
};

// Add comment to employee
const addEmployeeComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { text, rating } = req.body;
        const userId = req.user.id; // From auth middleware
        
        // Check if employee exists
        const employee = await pool.query('SELECT id FROM employees WHERE id = $1', [id]);
        if (employee.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Xodim topilmadi'
            });
        }
        
        const query = `
            INSERT INTO employee_comments (employee_id, user_id, text, rating)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `;
        
        const result = await pool.query(query, [id, userId, text, rating]);
        
        res.status(201).json({
            success: true,
            message: 'Izoh muvaffaqiyatli qo\'shildi',
            data: {
                id: result.rows[0].id,
                employee_id: id,
                user_id: userId,
                text,
                rating
            }
        });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({
            success: false,
            message: 'Izoh qo\'shishda xatolik yuz berdi'
        });
    }
};

// Add post for employee
const addEmployeePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, media } = req.body;
        
        // Check if employee exists
        const employee = await pool.query('SELECT id FROM employees WHERE id = $1', [id]);
        if (employee.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Xodim topilmadi'
            });
        }

        // Post limit tekshirish
        const limitResult = await pool.query(`
            SELECT * FROM employee_post_limits 
            WHERE employee_id = $1
        `, [id]);

        let limits;
        if (limitResult.rows.length === 0) {
            // Agar record yo'q bo'lsa, yaratish
            const createResult = await pool.query(`
                INSERT INTO employee_post_limits (employee_id) 
                VALUES ($1) 
                RETURNING *
            `, [id]);
            limits = createResult.rows[0];
        } else {
            limits = limitResult.rows[0];
        }

        // Limit tekshirish
        const remainingFreePosts = Math.max(0, 4 - limits.free_posts_used);
        const usedPaidPosts = limits.free_posts_used > 4 ? limits.free_posts_used - 4 : 0;
        const remainingPaidPosts = Math.max(0, limits.total_paid_posts - usedPaidPosts);

        if (remainingFreePosts === 0 && remainingPaidPosts === 0) {
            return res.status(403).json({
                success: false,
                message: 'Post limiti tugagan. Yangi postlar uchun to\'lov qiling.',
                data: {
                    free_posts_used: limits.free_posts_used,
                    total_paid_posts: limits.total_paid_posts,
                    remaining_free_posts: remainingFreePosts,
                    remaining_paid_posts: remainingPaidPosts
                }
            });
        }
        
        const postQuery = `
            INSERT INTO employee_posts (employee_id, title, description)
            VALUES ($1, $2, $3)
            RETURNING id
        `;
        
        const result = await pool.query(postQuery, [id, title, description]);
        const postId = result.rows[0].id;
        
        // Add media files if provided
        if (media && media.length > 0) {
            for (const filePath of media) {
                await pool.query('INSERT INTO post_media (post_id, file_path) VALUES ($1, $2)', [postId, filePath]);
            }
        }

        // Post limitini yangilash
        await pool.query(`
            UPDATE employee_post_limits 
            SET free_posts_used = free_posts_used + 1, updated_at = CURRENT_TIMESTAMP
            WHERE employee_id = $1
        `, [id]);

        // Yangilangan limitlarni olish
        const updatedLimits = await pool.query(`
            SELECT * FROM employee_post_limits 
            WHERE employee_id = $1
        `, [id]);

        const newLimits = updatedLimits.rows[0];
        const newRemainingFreePosts = Math.max(0, 4 - newLimits.free_posts_used);
        const newUsedPaidPosts = newLimits.free_posts_used > 4 ? newLimits.free_posts_used - 4 : 0;
        const newRemainingPaidPosts = Math.max(0, newLimits.total_paid_posts - newUsedPaidPosts);
        
        res.status(201).json({
            success: true,
            message: 'Post muvaffaqiyatli qo\'shildi',
            data: {
                id: postId,
                employee_id: id,
                title,
                description,
                media,
                limits: {
                    free_posts_used: newLimits.free_posts_used,
                    total_paid_posts: newLimits.total_paid_posts,
                    remaining_free_posts: newRemainingFreePosts,
                    remaining_paid_posts: newRemainingPaidPosts
                }
            }
        });
    } catch (error) {
        console.error('Error adding post:', error);
        res.status(500).json({
            success: false,
            message: 'Post qo\'shishda xatolik yuz berdi'
        });
    }
};

// Update employee waiting status
const updateEmployeeWaitingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_waiting } = req.body;

        if (typeof is_waiting !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'is_waiting boolean qiymat bo\'lishi kerak'
            });
        }

        const query = `
            UPDATE employees 
            SET is_waiting = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2
        `;
        
        const result = await pool.query(query, [is_waiting, id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Xodim topilmadi'
            });
        }

        res.json({
            success: true,
            message: 'Xodim holati muvaffaqiyatli yangilandi',
            data: { id, is_waiting }
        });
    } catch (error) {
        console.error('Error in updateEmployeeWaitingStatus:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

// Bulk update employees waiting status
const bulkUpdateEmployeeWaitingStatus = async (req, res) => {
    try {
        const { employee_ids, is_waiting } = req.body;

        if (!Array.isArray(employee_ids) || employee_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'employee_ids array bo\'lishi va bo\'sh bo\'lmasligi kerak'
            });
        }

        if (typeof is_waiting !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'is_waiting boolean qiymat bo\'lishi kerak'
            });
        }

        const placeholders = employee_ids.map((_, index) => `$${index + 2}`).join(',');
        const query = `
            UPDATE employees 
            SET is_waiting = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE id IN (${placeholders})
        `;
        
        const params = [is_waiting, ...employee_ids];
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            message: `${result.rowCount} ta xodim holati muvaffaqiyatli yangilandi`,
            data: {
                updated_count: result.rowCount,
                employee_ids,
                is_waiting
            }
        });
    } catch (error) {
        console.error('Error in bulkUpdateEmployeeWaitingStatus:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi'
        });
    }
};

module.exports = {
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
};