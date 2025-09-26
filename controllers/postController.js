const { pool } = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       required:
 *         - title
 *         - admin_id
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Post ID
 *         title:
 *           type: string
 *           maxLength: 255
 *           description: Post sarlavhasi
 *         description:
 *           type: string
 *           description: Post tavsifi
 *         media_files:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [image, video]
 *               url:
 *                 type: string
 *               alt:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *           description: Media fayllar ro'yxati
 *         admin_id:
 *           type: string
 *           format: uuid
 *           description: Post yaratgan admin ID
 *         salon_id:
 *           type: string
 *           format: uuid
 *           description: Salon ID
 *         is_active:
 *           type: boolean
 *           description: Post faol holati
 *         view_count:
 *           type: integer
 *           description: Ko'rishlar soni
 *         like_count:
 *           type: integer
 *           description: Yoqtirishlar soni
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Yangi post yaratish (Admin)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               salon_id:
 *                 type: string
 *                 format: uuid
 *               media_files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Post muvaffaqiyatli yaratildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 *       403:
 *         description: Ruxsat yo'q
 */
const createPost = async (req, res) => {
    try {
        const { title, description, salon_id } = req.body;
        const admin_id = req.user.id;

        // Validation
        if (!title || title.trim().length === 0) {
            return res.status(400).json({ message: 'Post sarlavhasi talab qilinadi' });
        }

        if (title.length > 255) {
            return res.status(400).json({ message: 'Sarlavha 255 belgidan oshmasligi kerak' });
        }

        // Media fayllarni qayta ishlash
        let mediaFiles = [];
        if (req.files && req.files.length > 0) {
            mediaFiles = req.files.map(file => ({
                type: file.mimetype.startsWith('image/') ? 'image' : 'video',
                url: `/uploads/${file.filename}`,
                alt: title,
                originalName: file.originalname,
                size: file.size
            }));
        }

        // Post yaratish
        const result = await pool.query(`
            INSERT INTO posts (title, description, media_files, admin_id, salon_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [title.trim(), description?.trim() || null, JSON.stringify(mediaFiles), admin_id, salon_id || null]);

        const post = result.rows[0];

        res.status(201).json({
            message: 'Post muvaffaqiyatli yaratildi',
            data: post
        });

    } catch (error) {
        console.error('Post yaratishda xatolik:', error);
        res.status(500).json({ message: 'Server xatosi yuz berdi' });
    }
};

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Barcha postlarni olish
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Sahifa raqami
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Sahifadagi postlar soni
 *       - in: query
 *         name: salon_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Salon bo'yicha filtrlash
 *       - in: query
 *         name: admin_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Admin bo'yicha filtrlash
 *     responses:
 *       200:
 *         description: Postlar ro'yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 */
const getAllPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const offset = (page - 1) * limit;
        const { salon_id, admin_id } = req.query;

        // Filter conditions
        let whereConditions = ['p.is_active = true'];
        let queryParams = [];
        let paramIndex = 1;

        if (salon_id) {
            whereConditions.push(`p.salon_id = $${paramIndex}`);
            queryParams.push(salon_id);
            paramIndex++;
        }

        if (admin_id) {
            whereConditions.push(`p.admin_id = $${paramIndex}`);
            queryParams.push(admin_id);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Posts olish
        const postsQuery = `
            SELECT 
                p.*,
                a.username as admin_username,
                a.full_name as admin_full_name,
                s.salon_name
            FROM posts p
            LEFT JOIN admins a ON p.admin_id = a.id
            LEFT JOIN salons s ON p.salon_id = s.id
            ${whereClause}
            ORDER BY p.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(limit, offset);
        const postsResult = await pool.query(postsQuery, queryParams);

        // Total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM posts p
            ${whereClause}
        `;
        const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
        const total = parseInt(countResult.rows[0].total);

        res.json({
            data: postsResult.rows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Postlarni olishda xatolik:', error);
        res.status(500).json({ message: 'Server xatosi yuz berdi' });
    }
};

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Bitta postni olish
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post ma'lumotlari
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post topilmadi
 */
const getPostById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT 
                p.*,
                a.username as admin_username,
                a.full_name as admin_full_name,
                s.salon_name
            FROM posts p
            LEFT JOIN admins a ON p.admin_id = a.id
            LEFT JOIN salons s ON p.salon_id = s.id
            WHERE p.id = $1 AND p.is_active = true
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Post topilmadi' });
        }

        // View count ni oshirish
        await pool.query(`
            UPDATE posts SET view_count = view_count + 1 WHERE id = $1
        `, [id]);

        const post = result.rows[0];
        post.view_count = parseInt(post.view_count) + 1;

        res.json({ data: post });

    } catch (error) {
        console.error('Postni olishda xatolik:', error);
        res.status(500).json({ message: 'Server xatosi yuz berdi' });
    }
};

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Postni yangilash (Admin)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               salon_id:
 *                 type: string
 *                 format: uuid
 *               media_files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               keep_existing_media:
 *                 type: boolean
 *                 description: Mavjud media fayllarni saqlab qolish
 *     responses:
 *       200:
 *         description: Post muvaffaqiyatli yangilandi
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 *       403:
 *         description: Ruxsat yo'q
 *       404:
 *         description: Post topilmadi
 */
const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, salon_id, keep_existing_media } = req.body;
        const admin_id = req.user.id;

        // Postni tekshirish va admin huquqini tekshirish
        const existingPost = await pool.query(`
            SELECT * FROM posts WHERE id = $1 AND admin_id = $2 AND is_active = true
        `, [id, admin_id]);

        if (existingPost.rows.length === 0) {
            return res.status(404).json({ message: 'Post topilmadi yoki sizga tegishli emas' });
        }

        const post = existingPost.rows[0];

        // Validation
        if (title && title.length > 255) {
            return res.status(400).json({ message: 'Sarlavha 255 belgidan oshmasligi kerak' });
        }

        // Media fayllarni qayta ishlash
        let mediaFiles = [];
        
        if (keep_existing_media === 'true' && post.media_files) {
            mediaFiles = post.media_files;
        }

        if (req.files && req.files.length > 0) {
            const newMediaFiles = req.files.map(file => ({
                type: file.mimetype.startsWith('image/') ? 'image' : 'video',
                url: `/uploads/${file.filename}`,
                alt: title || post.title,
                originalName: file.originalname,
                size: file.size
            }));
            
            if (keep_existing_media === 'true') {
                mediaFiles = [...mediaFiles, ...newMediaFiles];
            } else {
                mediaFiles = newMediaFiles;
            }
        }

        // Postni yangilash
        const result = await pool.query(`
            UPDATE posts 
            SET 
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                media_files = $3,
                salon_id = COALESCE($4, salon_id),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5 AND admin_id = $6
            RETURNING *
        `, [
            title?.trim() || null,
            description?.trim() || null,
            JSON.stringify(mediaFiles),
            salon_id || null,
            id,
            admin_id
        ]);

        res.json({
            message: 'Post muvaffaqiyatli yangilandi',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Postni yangilashda xatolik:', error);
        res.status(500).json({ message: 'Server xatosi yuz berdi' });
    }
};

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Postni o'chirish (Admin)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post muvaffaqiyatli o'chirildi
 *       401:
 *         description: Avtorizatsiya talab qilinadi
 *       403:
 *         description: Ruxsat yo'q
 *       404:
 *         description: Post topilmadi
 */
const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const admin_id = req.user.id;

        // Postni tekshirish va admin huquqini tekshirish
        const result = await pool.query(`
            UPDATE posts 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND admin_id = $2 AND is_active = true
            RETURNING *
        `, [id, admin_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Post topilmadi yoki sizga tegishli emas' });
        }

        res.json({ message: 'Post muvaffaqiyatli o\'chirildi' });

    } catch (error) {
        console.error('Postni o\'chirishda xatolik:', error);
        res.status(500).json({ message: 'Server xatosi yuz berdi' });
    }
};

/**
 * @swagger
 * /api/posts/{id}/like:
 *   post:
 *     summary: Postni yoqtirish/yoqtirmaslik
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Like holati o'zgartirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 like_count:
 *                   type: integer
 *       404:
 *         description: Post topilmadi
 */
const toggleLike = async (req, res) => {
    try {
        const { id } = req.params;

        // Postni tekshirish
        const postResult = await pool.query(`
            SELECT id, like_count FROM posts WHERE id = $1 AND is_active = true
        `, [id]);

        if (postResult.rows.length === 0) {
            return res.status(404).json({ message: 'Post topilmadi' });
        }

        // Like count ni oshirish
        const result = await pool.query(`
            UPDATE posts 
            SET like_count = like_count + 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING like_count
        `, [id]);

        res.json({
            message: 'Post yoqtirildi',
            like_count: parseInt(result.rows[0].like_count)
        });

    } catch (error) {
        console.error('Like qo\'shishda xatolik:', error);
        res.status(500).json({ message: 'Server xatosi yuz berdi' });
    }
};

module.exports = {
    createPost,
    getAllPosts,
    getPostById,
    updatePost,
    deletePost,
    toggleLike
};