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