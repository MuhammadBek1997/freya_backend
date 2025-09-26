const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Upload papkasini yaratish
const uploadDir = path.join(__dirname, '../uploads/profile-images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage konfiguratsiyasi
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Fayl nomini unique qilish
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, 'profile-' + uniqueSuffix + extension);
    }
});

// Fayl filtri - faqat rasmlar
const fileFilter = (req, file, cb) => {
    // Ruxsat etilgan MIME turlari
    const allowedMimes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Faqat rasm fayllari ruxsat etilgan (JPEG, PNG, GIF, WebP)'), false);
    }
};

// Multer konfiguratsiyasi
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB maksimal hajm
        files: 1 // Faqat bitta fayl
    }
});

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Fayl hajmi juda katta. Maksimal 5MB ruxsat etilgan.'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Faqat bitta fayl yuklash mumkin.'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Kutilmagan fayl maydoni.'
            });
        }
    }
    
    if (error.message.includes('Faqat rasm fayllari')) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    return res.status(500).json({
        success: false,
        message: 'Fayl yuklashda xatolik yuz berdi.'
    });
};

// Base64 formatida image qaytarish
const getImageAsBase64 = (imagePath) => {
    try {
        if (!imagePath || !fs.existsSync(imagePath)) {
            return null;
        }
        
        const imageBuffer = fs.readFileSync(imagePath);
        const extension = path.extname(imagePath).toLowerCase();
        
        let mimeType = 'image/jpeg'; // default
        switch (extension) {
            case '.png':
                mimeType = 'image/png';
                break;
            case '.gif':
                mimeType = 'image/gif';
                break;
            case '.webp':
                mimeType = 'image/webp';
                break;
        }
        
        return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
    } catch (error) {
        console.error('Base64 ga o\'tkazishda xatolik:', error);
        return null;
    }
};

// Eski rasmni o'chirish
const deleteOldImage = (imagePath) => {
    try {
        if (imagePath && fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log('Eski rasm o\'chirildi:', imagePath);
        }
    } catch (error) {
        console.error('Eski rasmni o\'chirishda xatolik:', error);
    }
};

module.exports = {
    upload: upload.single('image'),
    handleUploadError,
    getImageAsBase64,
    deleteOldImage,
    uploadDir
};