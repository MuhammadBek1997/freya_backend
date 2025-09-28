const { Pool } = require('pg');
const { generateToken } = require('../middleware/authMiddleware');
const pool = require('../config/database');
const salonTranslationService = require('../services/salonTranslationService');

// Create a new salon
const createSalon = async (req, res) => {
    try {
        const {
            salon_name,
            salon_phone,
            salon_add_phone,
            salon_instagram,
            salon_rating = 0,
            comments = [],
            salon_payment = {},
            salon_description,
            salon_types,
            private_salon = false,
            work_schedule = [],
            salon_title,
            salon_additionals = [],
            sale_percent = 0,
            sale_limit = 0,
            location,
            salon_orient,
            salon_photos = [],
            salon_comfort,
            // Legacy fields for backward compatibility
            name,
            phone,
            email,
            description,
            address,
            working_hours = {}
        } = req.body;

        // Use salon_name if provided, otherwise fallback to name
        const salonName = salon_name || name;
        const salonPhone = salon_phone || phone;
        const salonDescription = salon_description || description;

        // Validate required fields
        if (!salonName || salonName.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Salon nomi (salon_name) majburiy'
            });
        }

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
            {"name": "kids", "isActive": true}
        ];

        const query = `
            INSERT INTO salons (
                name, phone, email, description, address, working_hours, 
                salon_types, location, salon_orient, salon_comfort, is_private
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;

        const values = [
            salonName,
            salonPhone || null,
            email || null,
            salonDescription || null,
            address || null,
            JSON.stringify(working_hours),
            JSON.stringify(salon_types || defaultSalonTypes),
            JSON.stringify(location || defaultLocation),
            JSON.stringify(salon_orient || defaultSalonOrient),
            JSON.stringify(salon_comfort || defaultSalonComfort),
            req.body.is_private !== undefined ? req.body.is_private : false // Default to false (corporate)
        ];

        const result = await pool.query(query, values);
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
                salon_name: salonName,
                description: salon.description,
                salon_description: salonDescription,
                salon_title: salon.salon_title || 'Salon',
                salon_types: salon.salon_types || []
            };
            await salonTranslationService.translateAndStoreSalon(salonData, salon.id);
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
        // Database connection test
        const dbTest = await pool.query('SELECT NOW()');
        
        const { page = 1, limit = 10, search = '', is_private = '' } = req.query;
        const language = req.language || req.query.language || 'ru'; // Language middleware'dan olinadi
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

        // is_private filter
        if (is_private !== '') {
            const isPrivateValue = is_private === 'true' || is_private === true;
            query += ` AND is_private = $${paramIndex}`;
            countQuery += ` AND is_private = $${paramIndex}`;
            queryParams.push(isPrivateValue);
            paramIndex++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const [salonsResult, countResult] = await Promise.all([
            pool.query(query, queryParams),
            pool.query(countQuery, search ? [`%${search}%`] : [])
        ]);

        // Salonlarni 3 ta tilda ma'lumot bilan olish
        const salons = await Promise.all(salonsResult.rows.map(async (salon) => {
            
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
            salon.salon_sale = safeJsonParse(salon.salon_sale, { amount: '', date: '' });
            
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
        salon.salon_sale = salon.salon_sale || { amount: '', date: '' };

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
        const jsonFields = ['comments', 'salon_payment', 'salon_types', 'salon_format', 'work_schedule', 'salon_additionals', 'location', 'salon_orient', 'salon_photos', 'salon_comfort', 'salon_sale'];
        
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
        salon.salon_sale = salon.salon_sale || { amount: '', date: '' };

        // Yangilangan ma'lumotlarni tarjima qilish va saqlash
        try {
            await salonTranslationService.updateSalonTranslations(id, salon);
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

// Helper function to calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
};

// Get nearby salons based on user location
const getNearbySalons = async (req, res) => {
    try {
        const { latitude, longitude, radius = 10, page = 1, limit = 10, is_private = '' } = req.query;
        
        // Validate required parameters
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude va longitude majburiy parametrlar'
            });
        }
        
        const userLat = parseFloat(latitude);
        const userLng = parseFloat(longitude);
        const searchRadius = parseFloat(radius);
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
        
        // Validate coordinates
        if (isNaN(userLat) || isNaN(userLng) || userLat < -90 || userLat > 90 || userLng < -180 || userLng > 180) {
            return res.status(400).json({
                success: false,
                message: 'Noto\'g\'ri koordinatalar'
            });
        }
        
        // Get all salons with location data
        let query = `
            SELECT 
                s.*,
                CASE 
                    WHEN s.location IS NOT NULL AND s.location->>'lat' IS NOT NULL AND s.location->>'lng' IS NOT NULL
                    THEN CAST(s.location->>'lat' AS DECIMAL)
                    ELSE NULL 
                END as salon_lat,
                CASE 
                    WHEN s.location IS NOT NULL AND s.location->>'lat' IS NOT NULL AND s.location->>'lng' IS NOT NULL
                    THEN CAST(s.location->>'lng' AS DECIMAL)
                    ELSE NULL 
                END as salon_lng
            FROM salons s
            WHERE s.is_active = true 
            AND s.location IS NOT NULL 
            AND s.location->>'lat' IS NOT NULL 
            AND s.location->>'lng' IS NOT NULL
        `;
        
        let queryParams = [];
        
        // Add is_private filter if provided
        if (is_private !== '') {
            const isPrivateValue = is_private === 'true' || is_private === true;
            query += ` AND s.is_private = $1`;
            queryParams.push(isPrivateValue);
        }
        
        query += ` ORDER BY s.created_at DESC`;
        
        const result = await pool.query(query, queryParams);
        
        // Calculate distances and filter by radius
        const salonsWithDistance = result.rows
            .map(salon => {
                const salonLat = parseFloat(salon.salon_lat);
                const salonLng = parseFloat(salon.salon_lng);
                
                if (isNaN(salonLat) || isNaN(salonLng)) {
                    return null;
                }
                
                const distance = calculateDistance(userLat, userLng, salonLat, salonLng);
                
                return {
                    ...salon,
                    distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
                    distance_text: distance < 1 ? 
                        `${Math.round(distance * 1000)} m` : 
                        `${Math.round(distance * 10) / 10} km`
                };
            })
            .filter(salon => salon && salon.distance <= searchRadius)
            .sort((a, b) => a.distance - b.distance); // Sort by distance
        
        // Apply pagination
        const paginatedSalons = salonsWithDistance.slice(offset, offset + limitNum);
        
        // Add translations for each salon
        const translatedSalons = await Promise.all(
            paginatedSalons.map(async (salon) => {
                try {
                    const translations = await salonTranslationService.getSalonTranslations(salon.id);
                    return {
                        ...salon,
                        name_uz: translations.name_uz || salon.salon_name || '',
                        name_en: translations.name_en || salon.salon_name || '',
                        name_ru: translations.name_ru || salon.salon_name || '',
                        description_uz: translations.description_uz || salon.salon_description || '',
                        description_en: translations.description_en || salon.salon_description || '',
                        description_ru: translations.description_ru || salon.salon_description || '',
                        address_uz: salon.address_uz || '',
                        address_en: salon.address_en || '',
                        address_ru: salon.address_ru || ''
                    };
                } catch (error) {
                    console.error(`Translation error for salon ${salon.id}:`, error);
                    return {
                        ...salon,
                        name_uz: salon.salon_name || '',
                        name_en: salon.salon_name || '',
                        name_ru: salon.salon_name || '',
                        description_uz: salon.salon_description || '',
                        description_en: salon.salon_description || '',
                        description_ru: salon.salon_description || '',
                        address_uz: salon.address_uz || '',
                        address_en: salon.address_en || '',
                        address_ru: salon.address_ru || ''
                    };
                }
            })
        );
        
        res.json({
            success: true,
            data: translatedSalons,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: salonsWithDistance.length,
                pages: Math.ceil(salonsWithDistance.length / limitNum)
            },
            search_params: {
                user_location: {
                    latitude: userLat,
                    longitude: userLng
                },
                radius: searchRadius,
                radius_text: `${searchRadius} km`
            }
        });
        
    } catch (error) {
        console.error('Error fetching nearby salons:', error);
        res.status(500).json({
            success: false,
            message: 'Yaqin atrofdagi salonlarni olishda xatolik yuz berdi'
        });
    }
};

// Get salons filtered by salon_types
const getSalonsByTypes = async (req, res) => {
    try {
        const { salon_types, page = 1, limit = 10, search = '' } = req.query;
        const language = req.language || req.query.language || 'ru';
        const offset = (page - 1) * limit;

        // Validate salon_types parameter
        if (!salon_types) {
            return res.status(400).json({
                success: false,
                message: 'salon_types parametri majburiy'
            });
        }

        // Parse salon_types - can be comma-separated string or array
        let typesToFilter = [];
        if (typeof salon_types === 'string') {
            typesToFilter = salon_types.split(',').map(type => type.trim());
        } else if (Array.isArray(salon_types)) {
            typesToFilter = salon_types;
        } else {
            return res.status(400).json({
                success: false,
                message: 'salon_types noto\'g\'ri formatda'
            });
        }

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

        // Add search filter if provided
        if (search) {
            query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
            countQuery += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        // Add salon_types filter using JSON operations
        // Check if any of the salon_types has selected: true for any of the requested types
        const typeConditions = typesToFilter.map((type, index) => {
            const currentParamIndex = paramIndex + index;
            return `EXISTS (
                SELECT 1 FROM jsonb_array_elements(salon_types) AS elem
                WHERE elem->>'type' = $${currentParamIndex} AND (elem->>'selected')::boolean = true
            )`;
        }).join(' OR ');

        if (typeConditions) {
            query += ` AND (${typeConditions})`;
            countQuery += ` AND (${typeConditions})`;
            queryParams.push(...typesToFilter);
            paramIndex += typesToFilter.length;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        // Execute queries
        const [salonsResult, countResult] = await Promise.all([
            pool.query(query, queryParams),
            pool.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
        ]);

        // Process salons with translations
        const salons = await Promise.all(salonsResult.rows.map(async (salon) => {
            // Get translations for all languages
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
                    translations[lang] = {
                        name: salon.salon_name,
                        description: salon[`description_${lang}`] || salon.salon_description || 'Salon haqida malumot',
                        address: salon[`address_${lang}`] || 'Manzil',
                        salon_title: salon.salon_title,
                        salon_orient: salon.salon_orient
                    };
                }
            }

            return {
                id: salon.id,
                salon_name: salon.salon_name,
                salon_phone: salon.salon_phone,
                salon_add_phone: salon.salon_add_phone,
                salon_instagram: salon.salon_instagram,
                salon_rating: salon.salon_rating,
                comments: salon.comments,
                salon_payment: salon.salon_payment,
                salon_description: salon.salon_description,
                salon_types: salon.salon_types,
                is_private: salon.is_private,
                work_schedule: salon.work_schedule,
                salon_title: salon.salon_title,
                salon_additionals: salon.salon_additionals,
                sale_percent: salon.sale_percent,
                sale_limit: salon.sale_limit,
                location: salon.location,
                salon_orient: salon.salon_orient,
                salon_photos: salon.salon_photos,
                salon_comfort: salon.salon_comfort,
                created_at: salon.created_at,
                updated_at: salon.updated_at,
                translations: translations,
                // Current language data
                name: translations[language]?.name || salon.salon_name,
                description: translations[language]?.description || salon.salon_description,
                address: translations[language]?.address || 'Manzil'
            };
        }));

        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            salons: salons,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: totalPages
            },
            filters: {
                salon_types: typesToFilter,
                search: search || null
            }
        });

    } catch (error) {
        console.error('Salon turlariga ko\'ra filtrlashda xatolik:', error);
        res.status(500).json({
            success: false,
            message: 'Salon turlariga ko\'ra filtrlashda xatolik yuz berdi'
        });
    }
};

// Recommended salons - user favourite salonlari asosida tavsiya qilish
const getRecommendedSalons = async (req, res) => {
    try {
        const { user_id, limit = 10, offset = 0 } = req.query;
        
        // Foydalanuvchining sevimli salonlarini olish
        let favouriteSalonIds = [];
        if (user_id) {
            const favouritesQuery = `
                SELECT salon_id FROM user_favourites 
                WHERE user_id = $1 AND is_active = true
            `;
            const favouritesResult = await pool.query(favouritesQuery, [user_id]);
            favouriteSalonIds = favouritesResult.rows.map(row => row.salon_id);
        }
        
        // Foydalanuvchining sevimli salon turlarini aniqlash
        let uniqueTypes = [];
        if (favouriteSalonIds.length > 0) {
            const typesQuery = `
                SELECT DISTINCT jsonb_array_elements(salon_types) as salon_type
                FROM salons 
                WHERE id = ANY($1) AND is_active = true
            `;
            const typesResult = await pool.query(typesQuery, [favouriteSalonIds]);
            uniqueTypes = typesResult.rows.map(row => row.salon_type.type);
        }
        
        // Agar sevimli salonlar yo'q bo'lsa, eng mashhur turlarni olish
        if (uniqueTypes.length === 0) {
            uniqueTypes = ['Салон красоты', 'Фитнес', 'Массаж'];
        }
        
        // Sevimli salon turlariga mos salonlarni topish (sevimli salonlarni chiqarib tashlash)
        let excludeConditions = favouriteSalonIds.length > 0 
            ? favouriteSalonIds.map((_, index) => `$${index + 1}`).join(', ')
            : 'NULL';
            
        let typeConditions = uniqueTypes.map((_, index) => 
            `salon_types @> '[{"type": "${uniqueTypes[index]}"}]'`
        ).join(' OR ');
        
        const salonsQuery = `
            SELECT * FROM salons 
            WHERE is_active = true 
            AND id NOT IN (${excludeConditions})
            AND (${typeConditions})
            ORDER BY salon_rating DESC, salon_name ASC
            LIMIT $${favouriteSalonIds.length + uniqueTypes.length + 1} 
            OFFSET $${favouriteSalonIds.length + uniqueTypes.length + 2}
        `;
        
        const queryParams = [...favouriteSalonIds, parseInt(limit), parseInt(offset)];
        const salonsResult = await pool.query(salonsQuery, queryParams);
        
        // Salonlarni formatlash
        const formattedSalons = salonsResult.rows.map(salon => ({
            id: salon.id,
            salon_name: salon.salon_name || salon.name,
            salon_phone: salon.salon_phone || salon.phone,
            salon_rating: salon.salon_rating || 0,
            salon_description: salon.salon_description || salon.description,
            salon_photos: salon.salon_photos || [],
            location: salon.location,
            salon_types: salon.salon_types || [],
            salon_comfort: salon.salon_comfort || [],
            is_private: salon.is_private || false
        }));
        
        res.json({
            success: true,
            data: formattedSalons,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: formattedSalons.length
            },
            recommendation_info: {
                based_on_favourites: favouriteSalonIds.length > 0,
                favourite_salon_types: uniqueTypes,
                excluded_salons: favouriteSalonIds.length
            }
        });
        
    } catch (error) {
        console.error('Error getting recommended salons:', error);
        res.status(500).json({
            success: false,
            message: 'Tavsiya etilgan salonlarni olishda xatolik yuz berdi'
        });
    }
};

// Salon rasmlarini yuklash
const uploadSalonPhotos = async (req, res) => {
    try {
        const { id } = req.params;
        const { photos } = req.body; // Base64 formatdagi rasmlar massivi

        if (!photos || !Array.isArray(photos) || photos.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Rasmlar majburiy va massiv formatida bo\'lishi kerak'
            });
        }

        // Salonni tekshirish
        const salonQuery = 'SELECT * FROM salons WHERE id = $1';
        const salonResult = await pool.query(salonQuery, [id]);
        
        if (salonResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Salon topilmadi'
            });
        }

        const salon = salonResult.rows[0];
        const currentPhotos = salon.salon_photos || [];

        // Yangi rasmlarni qo'shish
        const updatedPhotos = [...currentPhotos, ...photos];

        // Bazani yangilash
        const updateQuery = 'UPDATE salons SET salon_photos = $1 WHERE id = $2 RETURNING salon_photos';
        const updateResult = await pool.query(updateQuery, [JSON.stringify(updatedPhotos), id]);

        res.json({
            success: true,
            message: 'Rasmlar muvaffaqiyatli yuklandi',
            data: {
                salon_id: id,
                salon_photos: updateResult.rows[0].salon_photos,
                added_photos_count: photos.length,
                total_photos_count: updatedPhotos.length
            }
        });

    } catch (error) {
        console.error('Error uploading salon photos:', error);
        res.status(500).json({
            success: false,
            message: 'Rasmlarni yuklashda xatolik yuz berdi'
        });
    }
};

// Salon rasmini o'chirish
const deleteSalonPhoto = async (req, res) => {
    try {
        const { id, photoIndex } = req.params;

        // Salonni tekshirish
        const salonQuery = 'SELECT * FROM salons WHERE id = $1';
        const salonResult = await pool.query(salonQuery, [id]);
        
        if (salonResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Salon topilmadi'
            });
        }

        const salon = salonResult.rows[0];
        const currentPhotos = salon.salon_photos || [];

        // Rasm indeksini tekshirish
        const photoIndexNum = parseInt(photoIndex);
        if (isNaN(photoIndexNum) || photoIndexNum < 0 || photoIndexNum >= currentPhotos.length) {
            return res.status(400).json({
                success: false,
                message: 'Noto\'g\'ri rasm indeksi'
            });
        }

        // Rasmni o'chirish
        const updatedPhotos = currentPhotos.filter((_, index) => index !== photoIndexNum);

        // Bazani yangilash
        const updateQuery = 'UPDATE salons SET salon_photos = $1 WHERE id = $2 RETURNING salon_photos';
        const updateResult = await pool.query(updateQuery, [JSON.stringify(updatedPhotos), id]);

        res.json({
            success: true,
            message: 'Rasm muvaffaqiyatli o\'chirildi',
            data: {
                salon_id: id,
                salon_photos: updateResult.rows[0].salon_photos,
                deleted_photo_index: photoIndexNum,
                remaining_photos_count: updatedPhotos.length
            }
        });

    } catch (error) {
        console.error('Error deleting salon photo:', error);
        res.status(500).json({
            success: false,
            message: 'Rasmni o\'chirishda xatolik yuz berdi'
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
    getSalonComments,
    getNearbySalons,
    getSalonsByTypes,
    getRecommendedSalons,
    uploadSalonPhotos,
    deleteSalonPhoto
};