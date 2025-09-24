const { Pool } = require('pg');
const { generateToken } = require('../middleware/authMiddleware');
const pool = require('../config/database');
const salonTranslationService = require('../services/salonTranslationService');

// Create a new salon
const createSalon = async (req, res) => {
    console.log('CreateSalon function called with body:', req.body);
    try {
        const {
            name,
            phone,
            email,
            description,
            address,
            working_hours = {}
        } = req.body;

        // Validate required fields
        console.log('Validation check - name:', name, 'type:', typeof name);
        if (!name || name.trim() === '') {
            console.log('Validation failed - name is empty or undefined');
            return res.status(400).json({
                success: false,
                message: 'Salon nomi majburiy'
            });
        }
        console.log('Validation passed - name is valid');

        // Default qiymatlar
        const defaultSalonTypes = [
            {"type": "Салон красоты", "selected": true},
            {"type": "Фитнес", "selected": false},
            {"type": "Функциональные тренировки", "selected": false},
            {"type": "Йога", "selected": false},
            {"type": "Массаж", "selected": false}
        ];

        const defaultLocation = {"lat": 41, "long": 64};
        const defaultSalonOrient = {"lat": 41, "long": 64};
        
        const defaultSalonComfort = [
            {"name": "parking", "isActive": false},
            {"name": "cafee", "isActive": false},
            {"name": "onlyFemale", "isActive": false},
            {"name": "water", "isActive": false},
            {"name": "pets", "isActive": false},
            {"name": "bath", "isActive": false},
            {"name": "towel", "isActive": false},
            {"name": "allow14", "isActive": false},
            {"name": "allow16", "isActive": false}
        ];

        const query = `
            INSERT INTO salons (
                name, phone, email, description, address, working_hours, 
                salon_types, location, salon_orient, salon_comfort
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;

        const values = [
            name,
            phone,
            email,
            description,
            address,
            JSON.stringify(working_hours),
            JSON.stringify(defaultSalonTypes),
            JSON.stringify(defaultLocation),
            JSON.stringify(defaultSalonOrient),
            JSON.stringify(defaultSalonComfort)
        ];

        console.log('Executing database query...');
        const result = await pool.query(query, values);
        console.log('Database query completed successfully');
        const salon = result.rows[0];

        // Parse JSON fields back to objects
        try {
            salon.working_hours = salon.working_hours && salon.working_hours !== 'null' ? salon.working_hours : {};
            salon.salon_types = salon.salon_types || defaultSalonTypes;
            salon.location = salon.location || defaultLocation;
            salon.salon_orient = salon.salon_orient || defaultSalonOrient;
            salon.salon_comfort = salon.salon_comfort || defaultSalonComfort;
        } catch (parseError) {
            console.error('JSON parsing error:', parseError);
            salon.working_hours = {};
            salon.salon_types = defaultSalonTypes;
            salon.location = defaultLocation;
            salon.salon_orient = defaultSalonOrient;
            salon.salon_comfort = defaultSalonComfort;
        }

        // Salon ma'lumotlarini barcha tillarga tarjima qilish va saqlash
        try {
            const salonData = {
                name: salon.name,
                description: salon.description
            };
            await salonTranslationService.translateAndStoreSalon(salonData, salon.id);
            console.log('Salon translations stored successfully');
        } catch (translationError) {
            console.error('Translation error:', translationError);
            // Tarjima xatosi bo'lsa ham salon yaratilganini qaytaramiz
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
        console.log('getAllSalons called with query:', req.query);
        
        // Database connection test
        const dbTest = await pool.query('SELECT NOW()');
        console.log('Database connection OK:', dbTest.rows[0]);
        
        const { page = 1, limit = 10, search = '' } = req.query;
        console.log('req.language:', req.language);
        console.log('req.query.language:', req.query.language);
        const language = req.language || req.query.language || 'ru'; // Language middleware'dan olinadi
        console.log('Final language for getAllSalons:', language);
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
            query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
            countQuery += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const [salonsResult, countResult] = await Promise.all([
            pool.query(query, queryParams),
            pool.query(countQuery, search ? [`%${search}%`] : [])
        ]);

        // Salonlarni 3 ta tilda ma'lumot bilan olish
        console.log(`Processing ${salonsResult.rows.length} salons for all languages`);
        const salons = await Promise.all(salonsResult.rows.map(async (salon) => {
            console.log(`Processing salon ${salon.id} for all languages`);
            
            // Barcha tillar uchun tarjimalarni olish
            const translations = {};
            const languages = ['uz', 'en', 'ru'];
            
            for (const lang of languages) {
                const translatedSalon = await salonTranslationService.getSalonByLanguage(salon.id, lang);
                if (translatedSalon) {
                    translations[lang] = {
                        name: translatedSalon.name,
                        description: translatedSalon.description,
                        address: translatedSalon.address,
                        salon_title: translatedSalon.salon_title,
                        salon_orient: translatedSalon.salon_orient
                    };
                } else {
                    // Agar tarjima mavjud bo'lmasa, original ma'lumotni ishlatamiz
                    translations[lang] = {
                        name: salon.salon_name,
                        description: salon[`description_${lang}`] || salon.salon_description || 'Salon haqida malumot',
                        address: salon[`address_${lang}`] || 'Manzil',
                        salon_title: salon.salon_title,
                        salon_orient: salon.salon_orient
                    };
                }
            }
            
            // Salon ma'lumotlariga tarjimalarni qo'shamiz
            salon.salon_name_uz = translations.uz.name;
            salon.salon_name_en = translations.en.name;
            salon.salon_name_ru = translations.ru.name;
            
            salon.salon_description_uz = translations.uz.description;
            salon.salon_description_en = translations.en.description;
            salon.salon_description_ru = translations.ru.description;
            
            salon.salon_title_uz = translations.uz.salon_title;
            salon.salon_title_en = translations.en.salon_title;
            salon.salon_title_ru = translations.ru.salon_title;

            // Tarjima mavjud bo'lmasa, original ma'lumotni parse qilamiz
            // Helper function to safely parse JSON
            const safeJsonParse = (value, defaultValue) => {
                if (!value || value === 'null' || value === '' || value === '{}' || value === '[]') {
                    return defaultValue;
                }
                
                // If it's already an object/array, return as is
                if (typeof value === 'object') {
                    return value;
                }
                
                try {
                    return JSON.parse(value);
                } catch (error) {
                    console.error('JSON parsing error for value:', value, 'Error:', error.message);
                    return defaultValue;
                }
            };

            // Parse JSON fields safely
            salon.comments = safeJsonParse(salon.comments, []);
            salon.salon_payment = safeJsonParse(salon.salon_payment, null);
            salon.salon_types = safeJsonParse(salon.salon_types, []);
            salon.work_schedule = safeJsonParse(salon.work_schedule, []);
            salon.salon_additionals = safeJsonParse(salon.salon_additionals, []);
            salon.location = safeJsonParse(salon.location, null);
            salon.salon_orient = safeJsonParse(salon.salon_orient, null);
            salon.salon_photos = safeJsonParse(salon.salon_photos, []);
            salon.salon_comfort = safeJsonParse(salon.salon_comfort, []);
            
            return salon;
        }));

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
        const language = req.language || 'ru'; // Language middleware'dan olinadi

        const query = 'SELECT * FROM salons WHERE id = $1 AND is_active = true';
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Salon topilmadi'
            });
        }

        let salon = result.rows[0];

        // Barcha tillar uchun tarjimalarni olish
        const translations = {};
        const languages = ['uz', 'en', 'ru'];
        
        for (const lang of languages) {
            const translatedSalon = await salonTranslationService.getSalonByLanguage(id, lang);
            if (translatedSalon) {
                translations[lang] = {
                    name: translatedSalon.name,
                    description: translatedSalon.description,
                    address: translatedSalon.address,
                    salon_title: translatedSalon.salon_title,
                    salon_orient: translatedSalon.salon_orient
                };
            } else {
                // Agar tarjima mavjud bo'lmasa, original ma'lumotni ishlatamiz
                translations[lang] = {
                    name: salon.salon_name,
                    description: salon[`description_${lang}`] || salon.salon_description || 'Salon haqida malumot',
                    address: salon[`address_${lang}`] || 'Manzil',
                    salon_title: salon.salon_title,
                    salon_orient: salon.salon_orient
                };
            }
        }
        
        // Salon ma'lumotlariga tarjimalarni qo'shamiz
        salon.salon_name_uz = translations.uz.name;
        salon.salon_name_en = translations.en.name;
        salon.salon_name_ru = translations.ru.name;
        
        salon.salon_description_uz = translations.uz.description;
        salon.salon_description_en = translations.en.description;
        salon.salon_description_ru = translations.ru.description;
        
        salon.salon_title_uz = translations.uz.salon_title;
        salon.salon_title_en = translations.en.salon_title;
        salon.salon_title_ru = translations.ru.salon_title;
        
        // JSONB fields are already parsed by PostgreSQL, no need to JSON.parse again
        salon.comments = salon.comments || [];
        salon.salon_payment = salon.salon_payment || null;
        salon.salon_types = salon.salon_types || [];
        salon.work_schedule = salon.work_schedule || [];
        salon.salon_additionals = salon.salon_additionals || [];
        salon.location = salon.location || null;
        salon.salon_orient = salon.salon_orient || null;
        salon.salon_photos = salon.salon_photos || [];
        salon.salon_comfort = salon.salon_comfort || [];

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
        
        // Parse JSON fields (JSONB fields are already parsed by PostgreSQL)
        salon.comments = salon.comments || [];
        salon.salon_payment = salon.salon_payment || {};
        salon.salon_types = salon.salon_types || [];
        salon.salon_format = salon.salon_format || {"selected":true,"format":"corporative"};
        salon.work_schedule = salon.work_schedule || [];
        salon.salon_additionals = salon.salon_additionals || [];
        salon.location = salon.location || {};
        salon.salon_orient = salon.salon_orient || {};
        salon.salon_photos = salon.salon_photos || [];
        salon.salon_comfort = salon.salon_comfort || [];

        // Yangilangan ma'lumotlarni tarjima qilish va saqlash
        try {
            await salonTranslationService.updateSalonTranslations(id, salon);
            console.log('Salon translations updated successfully');
        } catch (translationError) {
            console.error('Translation update error:', translationError);
            // Tarjima xatosi bo'lsa ham yangilanganini qaytaramiz
        }

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

        // Tarjima fayllaridan ham o'chirish
        try {
            await salonTranslationService.deleteSalonTranslations(id);
            console.log('Salon translations deleted successfully');
        } catch (translationError) {
            console.error('Translation deletion error:', translationError);
            // Tarjima o'chirishda xato bo'lsa ham davom etamiz
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
            SELECT sc.*, u.full_name
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