const { pool } = require('../config/database');
const employeeTranslationService = require('../services/employeeTranslationService');
const bcrypt = require('bcrypt');

// Get all employees
const getAllEmployees = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', salonId } = req.query;
        
        // Agar salonId berilgan bo'lsa, salon mavjudligini tekshirish
        if (salonId) {
            const salonCheckQuery = 'SELECT id FROM salons WHERE id = $1';
            const salonCheckResult = await pool.query(salonCheckQuery, [salonId]);
            
            if (salonCheckResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Salon topilmadi'
                });
            }
        }
        
        const language = req.language || req.query.current_language || 'ru'; // Language middleware'dan olinadi
        const offset = (page - 1) * limit;

        let query = `
            SELECT e.*, s.salon_name as salon_name,
                   COUNT(c.id) as comment_count,
                   AVG(c.rating) as avg_rating
            FROM employees e
            LEFT JOIN salons s ON e.salon_id = s.id
            LEFT JOIN employee_comments c ON e.id = c.employee_id
        `;
        
        const params = [];
        const conditions = [];
        
        if (search) {
            conditions.push(`(e.name ILIKE $${params.length + 1} OR e.surname ILIKE $${params.length + 2} OR e.profession ILIKE $${params.length + 3})`);
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        if (salonId) {
            conditions.push(`e.salon_id = $${params.length + 1}`);
            params.push(salonId);
        }
        
        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }
        
        query += ` GROUP BY e.id, s.salon_name ORDER BY e.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const employees = await pool.query(query, params);
        
        // Xodimlarni 3 ta tilda ma'lumot bilan olish
        const translatedEmployees = await Promise.all(employees.rows.map(async (employee) => {
            try {
                // Barcha tillar uchun tarjimalarni olish
                const translations = {};
                const languages = ['uz', 'en', 'ru'];
                
                for (const lang of languages) {
                    try {
                        const translatedEmployee = await employeeTranslationService.getEmployeeByLanguage(employee.id, lang);
                        if (translatedEmployee) {
                            translations[lang] = {
                                name: translatedEmployee.name || employee.name,
                                surname: translatedEmployee.surname || employee.surname,
                                profession: translatedEmployee.profession || employee.profession,
                                bio: translatedEmployee.bio || employee.bio,
                                specialization: translatedEmployee.specialization || ''
                            };
                        } else {
                            // Agar tarjima mavjud bo'lmasa, original ma'lumotni ishlatamiz
                            translations[lang] = {
                                name: employee.name || '',
                                surname: employee.surname || '',
                                profession: employee.profession || '',
                                bio: employee.bio || '',
                                specialization: ''
                            };
                        }
                    } catch (langError) {
                        console.error(`Error getting translation for language ${lang}:`, langError);
                        translations[lang] = {
                            name: employee.name || '',
                            surname: employee.surname || '',
                            profession: employee.profession || '',
                            bio: employee.bio || '',
                            specialization: ''
                        };
                    }
                }
                
                // Employee ma'lumotlariga tarjimalarni qo'shamiz
                employee.name_uz = translations.uz.name;
                employee.name_en = translations.en.name;
                employee.name_ru = translations.ru.name;
                
                employee.surname_uz = translations.uz.surname;
                employee.surname_en = translations.en.surname;
                employee.surname_ru = translations.ru.surname;
                
                employee.profession_uz = translations.uz.profession;
                employee.profession_en = translations.en.profession;
                employee.profession_ru = translations.ru.profession;
                
                employee.bio_uz = translations.uz.bio;
                employee.bio_en = translations.en.bio;
                employee.bio_ru = translations.ru.bio;
                
                employee.specialization_uz = translations.uz.specialization;
                employee.specialization_en = translations.en.specialization;
                employee.specialization_ru = translations.ru.specialization;
                
                return employee;
            } catch (employeeError) {
                console.error(`Error processing employee ${employee.id}:`, employeeError);
                // Xatolik bo'lsa, original ma'lumotlarni qaytaramiz
                employee.name_uz = employee.name || '';
                employee.name_en = employee.name || '';
                employee.name_ru = employee.name || '';
                employee.surname_uz = employee.surname || '';
                employee.surname_en = employee.surname || '';
                employee.surname_ru = employee.surname || '';
                employee.profession_uz = employee.profession || '';
                employee.profession_en = employee.profession || '';
                employee.profession_ru = employee.profession || '';
                employee.bio_uz = employee.bio || '';
                employee.bio_en = employee.bio || '';
                employee.bio_ru = employee.bio || '';
                employee.specialization_uz = '';
                employee.specialization_en = '';
                employee.specialization_ru = '';
                return employee;
            }
        }));
        
        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM employees`;
        const countParams = [];
        const countConditions = [];
        
        if (search) {
            countConditions.push(`(name ILIKE $${countParams.length + 1} OR surname ILIKE $${countParams.length + 2} OR profession ILIKE $${countParams.length + 3})`);
            countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        if (salonId) {
            countConditions.push(`salon_id = $${countParams.length + 1}`);
            countParams.push(salonId);
        }
        
        if (countConditions.length > 0) {
            countQuery += ` WHERE ${countConditions.join(' AND ')}`;
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

        // UUID formatini tekshirish
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(salonId)) {
            return res.status(400).json({
                success: false,
                message: 'Noto\'g\'ri salon ID formati'
            });
        }

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
        
        // Xodimlarni 3 ta tilda ma'lumot bilan olish
        const translatedEmployees = await Promise.all(employees.rows.map(async (employee) => {
            // Barcha tillar uchun tarjimalarni olish
            const translations = {};
            const languages = ['uz', 'en', 'ru'];
            
            for (const lang of languages) {
                const translatedEmployee = await employeeTranslationService.getEmployeeByLanguage(employee.id, lang);
                if (translatedEmployee) {
                    translations[lang] = {
                        name: translatedEmployee.name,
                        surname: translatedEmployee.surname,
                        profession: translatedEmployee.profession,
                        bio: translatedEmployee.bio,
                        specialization: translatedEmployee.specialization
                    };
                } else {
                    // Agar tarjima mavjud bo'lmasa, original ma'lumotni ishlatamiz
                    translations[lang] = {
                        name: employee.name,
                        surname: employee.surname,
                        profession: employee.profession,
                        bio: employee.bio,
                        specialization: employee.specialization
                    };
                }
            }
            
            // Employee ma'lumotlariga tarjimalarni qo'shamiz
            employee.name_uz = translations.uz.name;
            employee.name_en = translations.en.name;
            employee.name_ru = translations.ru.name;
            
            employee.surname_uz = translations.uz.surname;
            employee.surname_en = translations.en.surname;
            employee.surname_ru = translations.ru.surname;
            
            employee.profession_uz = translations.uz.profession;
            employee.profession_en = translations.en.profession;
            employee.profession_ru = translations.ru.profession;
            
            employee.bio_uz = translations.uz.bio;
            employee.bio_en = translations.en.bio;
            employee.bio_ru = translations.ru.bio;
            
            employee.specialization_uz = translations.uz.specialization;
            employee.specialization_en = translations.en.specialization;
            employee.specialization_ru = translations.ru.specialization;
            
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
        
        // Barcha tillar uchun tarjimalarni olish
        const translations = {};
        const languages = ['uz', 'en', 'ru'];
        
        for (const lang of languages) {
            const translatedEmployee = await employeeTranslationService.getEmployeeByLanguage(employee.id, lang);
            if (translatedEmployee) {
                translations[lang] = {
                    name: translatedEmployee.name,
                    surname: translatedEmployee.surname,
                    profession: translatedEmployee.profession,
                    bio: translatedEmployee.bio,
                    specialization: translatedEmployee.specialization
                };
            } else {
                // Agar tarjima mavjud bo'lmasa, original ma'lumotni ishlatamiz
                translations[lang] = {
                    name: employee.name,
                    surname: employee.surname,
                    profession: employee.profession,
                    bio: employee.bio,
                    specialization: employee.specialization
                };
            }
        }
        
        // Employee ma'lumotlariga tarjimalarni qo'shamiz
        employee.name_uz = translations.uz.name;
        employee.name_en = translations.en.name;
        employee.name_ru = translations.ru.name;
        
        employee.surname_uz = translations.uz.surname;
        employee.surname_en = translations.en.surname;
        employee.surname_ru = translations.ru.surname;
        
        employee.profession_uz = translations.uz.profession;
        employee.profession_en = translations.en.profession;
        employee.profession_ru = translations.ru.profession;
        
        employee.bio_uz = translations.uz.bio;
        employee.bio_en = translations.en.bio;
        employee.bio_ru = translations.ru.bio;
        
        employee.specialization_uz = translations.uz.specialization;
        employee.specialization_en = translations.en.specialization;
        employee.specialization_ru = translations.ru.specialization;
        
        // Get comments
        const commentsQuery = `
            SELECT c.*, u.full_name
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
            employee_name: name,
            employee_phone: phone,
            employee_email: email,
            position,
            employee_password: password
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
        
        // Check if phone or email already exists
        const existingEmployee = await pool.query(
            'SELECT id FROM employees WHERE phone = $1 OR email = $2',
            [phone, email]
        );
        
        if (existingEmployee.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Telefon raqam yoki email allaqachon mavjud'
            });
        }
        
        // Password ni hash qilish
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const query = `
            INSERT INTO employees (salon_id, name, phone, email, position, employee_password, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `;
        
        const result = await pool.query(query, [
            salon_id, name, phone, email, position, hashedPassword, true
        ]);
        
        const employeeId = result.rows[0].id;
        
        // Employee ma'lumotlarini barcha tillarga tarjima qilish va saqlash
        try {
            await employeeTranslationService.translateAndStoreEmployee({
                name,
                surname: '', // Default surname
                profession: position,
                bio: '', // Default bio
                specialization: '' // Default specialization
            }, employeeId);
            console.log('Employee translations stored successfully');
        } catch (translationError) {
            console.error('Employee translation error:', translationError);
            // Tarjima xatosi bo'lsa ham employee yaratilganini qaytaramiz
        }
        
        res.status(201).json({
            success: true,
            message: 'Xodim muvaffaqiyatli yaratildi',
            data: {
                id: employeeId,
                salon_id,
                name,
                phone,
                email,
                position
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
            profession
        } = req.body;
        
        // Check if employee exists
        const existingEmployee = await pool.query('SELECT id FROM employees WHERE id = $1', [id]);
        if (existingEmployee.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Xodim topilmadi'
            });
        }
        
        // Check if email already exists for other employees
        const duplicateCheck = await pool.query(
            'SELECT id FROM employees WHERE email = $1 AND id != $2',
            [email, id]
        );
        
        if (duplicateCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email allaqachon mavjud'
            });
        }
        
        const query = `
            UPDATE employees 
            SET name = $1, phone = $2, email = $3, position = $4
            WHERE id = $5
        `;
        
        await pool.query(query, [name, phone, email, profession, id]);
        
        // Employee tarjimalarini yangilash
        try {
            await employeeTranslationService.updateEmployeeTranslations(id, {
                name,
                surname: surname || '',
                profession: profession,
                bio: '', // Default bio
                specialization: '' // Default specialization
            });
        } catch (translationError) {
            // Tarjima xatosi bo'lsa ham employee yangilanganini qaytaramiz
        }
        
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