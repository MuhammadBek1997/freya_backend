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

// Middleware
app.use(helmet());

// CORS Proxy Middleware (birinchi)
app.use(corsProxy);

// CORS konfiguratsiyasi (Render.com uchun yangilangan)
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://freyabackend-parfa7zy7-muhammads-projects-3a6ae627.vercel.app',
        'https://freya-web-frontend.vercel.app',
        'https://freya-frontend.onrender.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true,
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
    preflightContinue: false,
    optionsSuccessStatus: 200
}));

// OPTIONS handler for preflight requests (Render.com uchun yangilangan)
app.options('*', (req, res) => {
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
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Max-Age', '86400');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Content-Length, X-Foo, X-Bar');
    res.sendStatus(200);
});

// Logging
app.use(morgan('combined'));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger UI (Render.com uchun CORS yangilangan)
app.use('/api-docs', (req, res, next) => {
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
    next();
}, swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));

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
        database_configured: !!process.env.DATABASE_URL
    });
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
});