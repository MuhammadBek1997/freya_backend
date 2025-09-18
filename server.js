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

// Middleware - CSP sozlamalari Swagger UI uchun
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://freya-backend.onrender.com", "https://*.onrender.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false
}));

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

// Swagger UI uchun custom HTML page
app.get('/api-docs', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Freya API Documentation</title>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
        <style>
            .swagger-ui .topbar { display: none }
            body { margin: 0; padding: 0; }
        </style>
    </head>
    <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
        <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
        <script>
            window.onload = function() {
                const ui = SwaggerUIBundle({
                    url: '/api/swagger.json',
                    dom_id: '#swagger-ui',
                    deepLinking: true,
                    presets: [
                        SwaggerUIBundle.presets.apis,
                        SwaggerUIStandalonePreset
                    ],
                    plugins: [
                        SwaggerUIBundle.plugins.DownloadUrl
                    ],
                    layout: "StandaloneLayout",
                    validatorUrl: null,
                    tryItOutEnabled: true,
                    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch', 'options']
                });
            };
        </script>
    </body>
    </html>
    `;
    res.send(html);
});

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