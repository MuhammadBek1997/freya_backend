const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const corsProxy = require('./middleware/cors-proxy');
const path = require('path');
const http = require('http');

const { pool } = require('./config/database');
const swaggerUi = require('swagger-ui-express');
const { specs, swaggerUiOptions } = require('./config/swagger');
const { initializeSocket } = require('./config/socket');
require('dotenv').config();

const salonRoutes = require('./routes/salonRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const authRoutes = require('./routes/authRoutes');
const swaggerProxyRoutes = require('./routes/swagger-proxy');
const scheduleRoutes = require('./routes/scheduleRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.io
const io = initializeSocket(server);

// Middleware - CSP sozlamalari Swagger UI uchun (yangilangan)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:", "https://unpkg.com", "https://cdn.jsdelivr.net"],
            connectSrc: ["'self'", "https://freya-backend.onrender.com", "https://*.onrender.com", "https://cdn.jsdelivr.net", "https://unpkg.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://unpkg.com", "https://cdn.jsdelivr.net"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false
}));

// CORS Proxy Middleware (birinchi)
app.use(corsProxy);

// CORS konfiguratsiyasi (Production uchun to'liq sozlangan)
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            // Development URLs
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'http://localhost:5176',
            'http://localhost:5177',
            'http://localhost:5178',
            'http://localhost:5179',
            // Production URLs
            'https://freyabackend-parfa7zy7-muhammads-projects-3a6ae627.vercel.app',
            'https://freya-web-frontend.vercel.app',
            'https://freya-frontend.onrender.com',
            'https://freya-admin.vercel.app',
            'https://freya-admin.netlify.app'
        ];
        
        if (allowedOrigins.includes(origin) || origin.match(/^http:\/\/localhost:\d+$/)) {
            return callback(null, true);
        }
        
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With', 
        'Accept', 
        'Origin',
        'Cache-Control',
        'X-File-Name'
    ],
    credentials: false,
    exposedHeaders: ['Content-Length', 'X-Total-Count', 'X-Page-Count'],
    preflightContinue: false,
    optionsSuccessStatus: 200,
    maxAge: 86400 // 24 soat cache
}));

// OPTIONS handler for preflight requests (Production uchun to'liq sozlangan)
app.options('*', (req, res) => {
    const allowedOrigins = [
        // Development URLs
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'http://localhost:5177',
        'http://localhost:5178',
        'http://localhost:5179',
        // Production URLs
        'https://freyabackend-parfa7zy7-muhammads-projects-3a6ae627.vercel.app',
        'https://freya-web-frontend.vercel.app',
        'https://freya-frontend.onrender.com',
        'https://freya-admin.vercel.app',
        'https://freya-admin.netlify.app'
    ];
    
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    } else {
        // Development uchun localhost pattern ni tekshirish
        if (origin && origin.match(/^http:\/\/localhost:\d+$/)) {
            res.header('Access-Control-Allow-Origin', origin);
        } else {
            res.header('Access-Control-Allow-Origin', '*');
        }
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-File-Name');
    res.header('Access-Control-Max-Age', '86400');
    res.header('Access-Control-Allow-Credentials', 'false');
    res.header('Access-Control-Expose-Headers', 'Content-Length, X-Total-Count, X-Page-Count');
    res.sendStatus(200);
});

// Logging
app.use(morgan('combined'));

// Swagger UI middleware
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));



// Swagger JSON uchun CORS headers
app.get('/api/swagger.json', (req, res) => {
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://freyabackend-parfa7zy7-muhammads-projects-3a6ae627.vercel.app',
        'https://freya-web-frontend.vercel.app',
        'https://freya-frontend.onrender.com'
    ];
    
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    } else {
        res.header('Access-Control-Allow-Origin', '*');
    }
    
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    
    res.json(specs);
});

// CSP middleware for all API routes
app.use('/api', (req, res, next) => {
    res.header('Content-Security-Policy', 
        "default-src 'self'; " +
        "connect-src 'self' https://freya-backend.onrender.com https://*.onrender.com; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:;"
    );
    next();
});

// Database connection test
app.get('/api/db-test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ 
            status: 'Database ulanishi muvaffaqiyatli', 
            timestamp: result.rows[0].now,
            database_url: process.env.DATABASE_URL ? 'O\'rnatilgan' : 'O\'rnatilmagan'
        });
    } catch (error) {
        console.error('Database test xatosi:', error);
        res.status(500).json({ 
            status: 'Database ulanish xatosi', 
            error: error.message,
            database_url: process.env.DATABASE_URL ? 'O\'rnatilgan' : 'O\'rnatilmagan'
        });
    }
});

// Routes
app.get('/', (req, res) => {
    res.json({ 
        message: 'Freya Backend API ishlamoqda!',
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
        database_configured: !!process.env.DATABASE_URL
    });
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database_configured: !!process.env.DATABASE_URL,
        version: '1.0.3',
        message: 'Server ishlamoqda'
    });
});

// Test salon route (birinchi)
app.get('/api/salons/test', (req, res) => {
    res.json({ message: 'Salon route is working!', timestamp: new Date().toISOString() });
});

// Debug route - database URL ma'lumotlarini olish uchun (faqat development)
app.get('/api/debug/db-url', (req, res) => {
    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
        return res.json({
            success: false,
            message: "DATABASE_URL topilmadi"
        });
    }
    
    // URL'ning faqat host va database nomini ko'rsatamiz (xavfsizlik uchun)
    const urlParts = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    
    if (urlParts) {
        res.json({
            success: true,
            database_info: {
                host: urlParts[3],
                port: urlParts[4],
                database: urlParts[5],
                username: urlParts[1],
                // Password'ni xavfsizlik uchun ko'rsatmaymiz
                url_format: `postgresql://${urlParts[1]}:[password]@${urlParts[3]}:${urlParts[4]}/${urlParts[5]}`,
                full_url_available: true
            },
            note: "To'liq URL uchun Heroku dashboard'dan config vars'ni ko'ring yoki migration script'ni ishlatish uchun environment variable o'rnating"
        });
    } else {
        res.json({
            success: false,
            message: "DATABASE_URL format noto'g'ri",
            raw_url_length: dbUrl.length
        });
    }
});

// Debug route - barcha route'larni ko'rish uchun
app.get('/api/debug/routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            routes.push({
                path: middleware.route.path,
                methods: Object.keys(middleware.route.methods)
            });
        } else if (middleware.name === 'router') {
            middleware.handle.stack.forEach((handler) => {
                if (handler.route) {
                    routes.push({
                        path: middleware.regexp.source + handler.route.path,
                        methods: Object.keys(handler.route.methods)
                    });
                }
            });
        }
    });
    res.json({ routes });
});

// Swagger proxy route
app.use('/api', swaggerProxyRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/salons', salonRoutes);

// Employee routes
app.use('/api', employeeRoutes);

// Schedule routes
app.use('/api', scheduleRoutes);

// Message routes
app.use('/api/messages', messageRoutes);

// Payment routes
app.use('/api/payments', paymentRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server xatosi:', err.stack);
    console.error('Xato tafsilotlari:', {
        message: err.message,
        name: err.name,
        code: err.code
    });
    res.status(500).json({ 
        message: 'Server xatosi yuz berdi!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    console.log(`404 - Route topilmadi: ${req.method} ${req.originalUrl}`);
    console.log('Headers:', req.headers);
    res.status(404).json({ 
        message: 'Route topilmadi',
        method: req.method,
        url: req.originalUrl,
        availableRoutes: [
            'GET /',
            'GET /api/health',
            'GET /api/db-test',
            'GET /api/debug/routes',
            'GET /api/salons/test',
            'GET /api/salons',
            'GET /api-docs',
            'POST /api/auth/superadmin/login',
            'POST /api/auth/admin/login',
            'POST /api/auth/employee/login'
        ]
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`Server ${PORT} portda ishlamoqda`);
    console.log(`Socket.io server ham ishga tushdi`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database URL: ${process.env.DATABASE_URL ? 'O\'rnatilgan' : 'O\'rnatilmagan'}`);
});

// Error handling for server
server.on('error', (err) => {
    console.error('Server error:', err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});