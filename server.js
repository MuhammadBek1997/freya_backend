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
const i18next = require('./config/i18n');
const { languageDetection, responseLocalization, setLanguageCookie } = require('./middleware/languageMiddleware');
require('dotenv').config();

const salonRoutes = require('./routes/salonRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const authRoutes = require('./routes/authRoutes');
const swaggerProxyRoutes = require('./routes/swagger-proxy');
const scheduleRoutes = require('./routes/scheduleRoutes');
const userRoutes = require('./routes/userRoutes');
const userSalonRoutes = require('./routes/userSalonRoutes');
const userChatRoutes = require('./routes/userChatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const i18nRoutes = require('./routes/i18nRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const postRoutes = require('./routes/postRoutes');
const serviceRoutes = require('./routes/serviceRoutes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Socket.io
const io = initializeSocket(server);

// Middleware - CSP sozlamalari Swagger UI uchun (Heroku uchun yangilangan)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com", "https://cdn.jsdelivr.net", "https://*.herokuapp.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com", "https://cdn.jsdelivr.net", "https://*.herokuapp.com"],
            imgSrc: ["'self'", "data:", "https:", "https://unpkg.com", "https://cdn.jsdelivr.net", "https://*.herokuapp.com"],
            connectSrc: ["'self'", "https://freya-backend-1.onrender.com", "https://*.onrender.com", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://*.herokuapp.com", "https://freya-salon-backend-cc373ce6622a.herokuapp.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://unpkg.com", "https://cdn.jsdelivr.net", "https://*.herokuapp.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false
}));

// CORS Proxy Middleware (birinchi)
app.use(corsProxy);

// CORS konfiguratsiyasi (Production va Development uchun)
const corsOptions = {
    origin: function (origin, callback) {
        // Ruxsat etilgan originlar ro'yxati
        const allowedOrigins = [
            'https://freya-salon-backend-cc373ce6622a.herokuapp.com',
            'https://freya-admin-c1sq6y8b4-muhammads-projects-3a6ae627.vercel.app',
            'https://freya-admin.vercel.app',
            'https://*.vercel.app',
            'https://your-frontend-domain.com',
            'https://*.herokuapp.com',
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:8080',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:5174'
        ];
        
        // Origin yo'q bo'lsa (masalan, Postman) yoki ruxsat etilgan origin bo'lsa
        if (!origin || allowedOrigins.some(allowed => 
            allowed.includes('*') ? origin.includes(allowed.replace('*', '')) : origin === allowed
        )) {
            callback(null, true);
        } else {
            console.log('CORS rad etildi:', origin);
            callback(new Error('CORS policy tomonidan rad etildi'), false);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true,
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
    preflightContinue: false,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// OPTIONS handler for preflight requests (Barcha originlarga ruxsat)
app.options('*', (req, res) => {
    const origin = req.headers.origin;
    
    // Barcha originlarga ruxsat berish
    res.header('Access-Control-Allow-Origin', origin || '*');
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Max-Age', '86400');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Content-Length, X-Foo, X-Bar');
    res.sendStatus(200);
});

// Logging
app.use(morgan('combined'));

// Body parser (Swagger UI'dan oldin bo'lishi kerak)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// I18n middleware
app.use(languageDetection);
app.use(responseLocalization);
app.use(setLanguageCookie);

// Swagger UI middleware with enhanced CORS for Heroku
app.use('/api-docs', (req, res, next) => {
    // CORS headers for Swagger UI
    const origin = req.headers.origin;
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    
    // CSP headers for Swagger UI
    res.header('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net https://*.herokuapp.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com https://cdn.jsdelivr.net https://*.herokuapp.com; " +
        "font-src 'self' https://fonts.gstatic.com https://unpkg.com https://cdn.jsdelivr.net https://*.herokuapp.com; " +
        "img-src 'self' data: https: https://unpkg.com https://cdn.jsdelivr.net https://*.herokuapp.com; " +
        "connect-src 'self' https://*.herokuapp.com https://freya-salon-backend-cc373ce6622a.herokuapp.com https://unpkg.com https://cdn.jsdelivr.net;"
    );
    
    next();
}, swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));



// Swagger JSON uchun CORS headers
app.get('/api/swagger.json', (req, res) => {
    const origin = req.headers.origin;
    
    // Barcha originlarga ruxsat berish
    res.header('Access-Control-Allow-Origin', origin || '*');
    
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    
    res.json(specs);
});

// CSP middleware for all API routes
app.use('/api', (req, res, next) => {
    res.header('Content-Security-Policy', 
        "default-src 'self'; " +
        "connect-src 'self' https://freya-backend-1.onrender.com https://*.onrender.com https://*.herokuapp.com https://freya-salon-backend-cc373ce6622a.herokuapp.com; " +
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

// SMS test route
app.get('/api/test-sms-config', async (req, res) => {
    try {
        const smsService = require('./services/smsService');
        
        // Environment variables check
        const config = {
            email: process.env.ESKIZ_EMAIL || 'NOT_SET',
            password: process.env.ESKIZ_PASSWORD ? 'SET' : 'NOT_SET',
            token: process.env.ESKIZ_TOKEN ? 'SET' : 'NOT_SET',
            baseUrl: process.env.ESKIZ_BASE_URL || 'NOT_SET'
        };
        
        // Try to get balance to test token
        const balanceResult = await smsService.getBalance();
        
        res.json({
            success: true,
            config: config,
            tokenTest: balanceResult,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
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

// SMS test endpoint
app.get('/api/test-sms', async (req, res) => {
    try {
        const smsService = require('./services/smsService');
        
        // Environment variables check
        const envCheck = {
            ESKIZ_EMAIL: process.env.ESKIZ_EMAIL || 'NOT_SET',
            ESKIZ_PASSWORD: process.env.ESKIZ_PASSWORD ? 'SET' : 'NOT_SET',
            ESKIZ_TOKEN: process.env.ESKIZ_TOKEN ? 'SET' : 'NOT_SET',
            ESKIZ_BASE_URL: process.env.ESKIZ_BASE_URL || 'NOT_SET'
        };
        
        // Test SMS sending
        const testResult = await smsService.sendVerificationCode('+998901234567', '123456');
        
        res.json({
            success: true,
            environment: envCheck,
            smsTest: testResult,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Swagger proxy route
app.use('/api', swaggerProxyRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user-salons', userSalonRoutes);
app.use('/api/user-chat', userChatRoutes);
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

// I18n routes
app.use('/api/i18n', i18nRoutes);

// Appointment routes
app.use('/api/appointments', appointmentRoutes);

// Post routes
app.use('/api/posts', postRoutes);

// Service routes
app.use('/api', serviceRoutes);

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
    console.log(`Server is running on port ${PORT}`);
    console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});

// Error handling for server
server.on('error', (err) => {
    console.error('Server error:', err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    server.close(() => {
        // Process terminated
    });
});

// Export the app for testing purposes
module.exports = app;