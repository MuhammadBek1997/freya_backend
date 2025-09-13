const db = require('../config/database');

// Get all employees for a specific salon
const getEmployeesBySalonId = async (req, res) => {
    try {
        const { salonId } = req.params;
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT e.*, 
                   COUNT(c.id) as comment_count,
                   AVG(c.rating) as avg_rating
            FROM employees e
            LEFT JOIN employee_comments c ON e.id = c.employee_id
            WHERE e.salon_id = ?
        `;
        
        const params = [salonId];
        
        if (search) {
            query += ` AND (e.name LIKE ? OR e.surname LIKE ? OR e.profession LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        query += ` GROUP BY e.id ORDER BY e.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const employees = await db.query(query, params);
        
        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM employees WHERE salon_id = ?`;
        const countParams = [salonId];
        
        if (search) {
            countQuery += ` AND (name LIKE ? OR surname LIKE ? OR profession LIKE ?)`;
            countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        const totalResult = await db.query(countQuery, countParams);
        const total = totalResult[0].total;

        res.json({
            success: true,
            data: employees,
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
        
        // Get employee basic info
        const employeeQuery = `
            SELECT e.*, s.name as salon_name
            FROM employees e
            LEFT JOIN salons s ON e.salon_id = s.id
            WHERE e.id = ?
        `;
        const employees = await db.query(employeeQuery, [id]);
        
        if (employees.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Xodim topilmadi'
            });
        }
        
        const employee = employees[0];
        
        // Get comments
        const commentsQuery = `
            SELECT c.*, u.username, u.full_name
            FROM employee_comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.employee_id = ?
            ORDER BY c.created_at DESC
        `;
        const comments = await db.query(commentsQuery, [id]);
        
        // Get posts
        const postsQuery = `
            SELECT p.*, 
                   GROUP_CONCAT(pm.file_path) as media_files
            FROM employee_posts p
            LEFT JOIN post_media pm ON p.id = pm.post_id
            WHERE p.employee_id = ?
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `;
        const posts = await db.query(postsQuery, [id]);
        
        // Format posts with media
        const formattedPosts = posts.map(post => ({
            ...post,
            media: post.media_files ? post.media_files.split(',') : []
        }));
        
        // Calculate average rating
        const avgRating = comments.length > 0 
            ? comments.reduce((sum, comment) => sum + comment.rating, 0) / comments.length 
            : 0;
        
        res.json({
            success: true,
            data: {
                ...employee,
                rating: parseFloat(avgRating.toFixed(1)),
                comments,
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
        
        // Check if username or email already exists
        const existingEmployee = await db.query(
            'SELECT id FROM employees WHERE username = ? OR email = ?',
            [username, email]
        );
        
        if (existingEmployee.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Username yoki email allaqachon mavjud'
            });
        }
        
        const query = `
            INSERT INTO employees (salon_id, name, surname, phone, email, profession, username, password, is_waiting)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = await db.query(query, [
            salon_id, name, surname, phone, email, profession, username, password, true
        ]);
        
        res.status(201).json({
            success: true,
            message: 'Xodim muvaffaqiyatli yaratildi',
            data: {
                id: result.insertId,
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
        const existingEmployee = await db.query('SELECT id FROM employees WHERE id = ?', [id]);
        if (existingEmployee.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Xodim topilmadi'
            });
        }
        
        // Check if username or email already exists for other employees
        const duplicateCheck = await db.query(
            'SELECT id FROM employees WHERE (username = ? OR email = ?) AND id != ?',
            [username, email, id]
        );
        
        if (duplicateCheck.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Username yoki email allaqachon mavjud'
            });
        }
        
        const query = `
            UPDATE employees 
            SET name = ?, surname = ?, phone = ?, email = ?, profession = ?, username = ?
            WHERE id = ?
        `;
        
        await db.query(query, [name, surname, phone, email, profession, username, id]);
        
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
        const existingEmployee = await db.query('SELECT id FROM employees WHERE id = ?', [id]);
        if (existingEmployee.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Xodim topilmadi'
            });
        }
        
        // Soft delete
        await db.query('UPDATE employees SET deleted_at = NOW() WHERE id = ?', [id]);
        
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
        const employee = await db.query('SELECT id FROM employees WHERE id = ?', [id]);
        if (employee.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Xodim topilmadi'
            });
        }
        
        const query = `
            INSERT INTO employee_comments (employee_id, user_id, text, rating)
            VALUES (?, ?, ?, ?)
        `;
        
        const result = await db.query(query, [id, userId, text, rating]);
        
        res.status(201).json({
            success: true,
            message: 'Izoh muvaffaqiyatli qo\'shildi',
            data: {
                id: result.insertId,
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
        const employee = await db.query('SELECT id FROM employees WHERE id = ?', [id]);
        if (employee.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Xodim topilmadi'
            });
        }
        
        const postQuery = `
            INSERT INTO employee_posts (employee_id, title, description)
            VALUES (?, ?, ?)
        `;
        
        const result = await db.query(postQuery, [id, title, description]);
        const postId = result.insertId;
        
        // Add media files if provided
        if (media && media.length > 0) {
            const mediaQuery = 'INSERT INTO post_media (post_id, file_path) VALUES ?';
            const mediaValues = media.map(filePath => [postId, filePath]);
            await db.query(mediaQuery, [mediaValues]);
        }
        
        res.status(201).json({
            success: true,
            message: 'Post muvaffaqiyatli qo\'shildi',
            data: {
                id: postId,
                employee_id: id,
                title,
                description,
                media
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
            SET is_waiting = ?, updated_at = NOW() 
            WHERE id = ?
        `;
        
        const result = await db.query(query, [is_waiting, id]);
        
        if (result.affectedRows === 0) {
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

        const placeholders = employee_ids.map(() => '?').join(',');
        const query = `
            UPDATE employees 
            SET is_waiting = ?, updated_at = NOW() 
            WHERE id IN (${placeholders})
        `;
        
        const params = [is_waiting, ...employee_ids];
        const result = await db.query(query, params);
        
        res.json({
            success: true,
            message: `${result.affectedRows} ta xodim holati muvaffaqiyatli yangilandi`,
            data: {
                updated_count: result.affectedRows,
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