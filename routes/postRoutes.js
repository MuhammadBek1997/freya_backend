const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/authMiddleware');
const {
    createPost,
    getAllPosts,
    getPostById,
    updatePost,
    deletePost,
    toggleLike
} = require('../controllers/postController');

// Upload directory yaratish
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer konfiguratsiyasi
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Fayl nomini unique qilish
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'post-' + uniqueSuffix + ext);
    }
});

// Fayl filtri
const fileFilter = (req, file, cb) => {
    // Ruxsat etilgan fayl turlari
    const allowedMimes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/x-msvideo', // .avi
        'video/webm'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Faqat rasm va video fayllar ruxsat etilgan'), false);
    }
};

// Multer middleware
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
        files: 10 // Maksimal 10ta fayl
    }
});

// Admin huquqini tekshirish middleware
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin huquqi talab qilinadi' });
    }
    next();
};

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Post boshqaruvi API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Post ID
 *         title:
 *           type: string
 *           description: Post sarlavhasi
 *         description:
 *           type: string
 *           description: Post tavsifi
 *         media_files:
 *           type: array
 *           items:
 *             type: string
 *           description: Media fayllar ro'yxati
 *         admin_id:
 *           type: string
 *           format: uuid
 *           description: Admin ID
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
 *           description: Yaratilgan vaqt
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Yangilangan vaqt
 *         admin_username:
 *           type: string
 *           description: Admin username
 *         admin_full_name:
 *           type: string
 *           description: Admin to'liq ismi
 *         salon_name:
 *           type: string
 *           description: Salon nomi
 *     PostCreate:
 *       type: object
 *       required:
 *         - title
 *         - description
 *       properties:
 *         title:
 *           type: string
 *           description: Post sarlavhasi
 *           example: "Yangi xizmat"
 *         description:
 *           type: string
 *           description: Post tavsifi
 *           example: "Bizda yangi soch turmagi xizmati mavjud"
 *         media_files:
 *           type: array
 *           items:
 *             type: string
 *             format: binary
 *           description: Yuklash uchun media fayllar
 *     PostUpdate:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Post sarlavhasi
 *         description:
 *           type: string
 *           description: Post tavsifi
 *         media_files:
 *           type: array
 *           items:
 *             type: string
 *             format: binary
 *           description: Yangi media fayllar
 */

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Barcha postlarni olish
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: Postlar ro'yxati muvaffaqiyatli olindi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       500:
 *         description: Server xatosi
 *   post:
 *     summary: Yangi post yaratish
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/PostCreate'
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
 *                   example: "Post muvaffaqiyatli yaratildi"
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *       401:
 *         description: Autentifikatsiya talab qilinadi
 *       403:
 *         description: Admin huquqi talab qilinadi
 *       500:
 *         description: Server xatosi
 */

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Bitta postni ID bo'yicha olish
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
 *         description: Post muvaffaqiyatli olindi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post topilmadi
 *       500:
 *         description: Server xatosi
 *   put:
 *     summary: Postni yangilash
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
 *             $ref: '#/components/schemas/PostUpdate'
 *     responses:
 *       200:
 *         description: Post muvaffaqiyatli yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post muvaffaqiyatli yangilandi"
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *       401:
 *         description: Autentifikatsiya talab qilinadi
 *       403:
 *         description: Admin huquqi talab qilinadi
 *       404:
 *         description: Post topilmadi
 *       500:
 *         description: Server xatosi
 *   delete:
 *     summary: Postni o'chirish
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post muvaffaqiyatli o'chirildi"
 *       401:
 *         description: Autentifikatsiya talab qilinadi
 *       403:
 *         description: Admin huquqi talab qilinadi
 *       404:
 *         description: Post topilmadi
 *       500:
 *         description: Server xatosi
 */

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
 *         description: Post yoqtirildi yoki yoqtirilmadi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post yoqtirildi"
 *                 like_count:
 *                   type: integer
 *                   description: Yangi like soni
 *       404:
 *         description: Post topilmadi
 *       500:
 *         description: Server xatosi
 */

// Public routes - hamma ko'ra oladi
router.get('/', getAllPosts);
router.get('/:id', getPostById);
router.post('/:id/like', toggleLike);

// Admin routes - faqat adminlar
router.post('/', authenticateToken, requireAdmin, upload.array('media_files', 10), createPost);
router.put('/:id', authenticateToken, requireAdmin, upload.array('media_files', 10), updatePost);
router.delete('/:id', authenticateToken, requireAdmin, deletePost);

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'Fayl hajmi 50MB dan oshmasligi kerak' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ message: 'Maksimal 10ta fayl yuklash mumkin' });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ message: 'Kutilmagan fayl maydoni' });
        }
    }
    
    if (error.message === 'Faqat rasm va video fayllar ruxsat etilgan') {
        return res.status(400).json({ message: error.message });
    }
    
    next(error);
});

module.exports = router;