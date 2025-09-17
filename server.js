const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
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
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:7001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'Freya Backend API ishlamoqda!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// User routes
app.use('/api/users', userRoutes);

// Salon routes
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
  console.error(err.stack);
  res.status(500).json({ message: 'Server xatosi yuz berdi!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route topilmadi' });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server ${PORT} portda ishlamoqda`);
  console.log(`Socket.io server ham ishga tushdi`);
});