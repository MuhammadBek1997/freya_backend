const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { pool } = require('./config/database');
const swaggerUi = require('swagger-ui-express');
const { specs, swaggerUiOptions } = require('./config/swagger');
require('dotenv').config();

const salonRoutes = require('./routes/salonRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const authRoutes = require('./routes/authRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

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
  res.json({ message: 'Freya Backend API ishlamoqda!' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Salon routes
app.use('/api/salons', salonRoutes);

// Employee routes
app.use('/api', employeeRoutes);

// Schedule routes
app.use('/api', scheduleRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server xatosi yuz berdi!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route topilmadi' });
});

app.listen(PORT, async () => {
  console.log(`Server ${PORT} portda ishlamoqda`);
  
  // Test database connection
  try {
    const client = await pool.connect();
    console.log('Database connection successful');
    client.release();
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
});