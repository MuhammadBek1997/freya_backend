const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { swaggerUi, specs } = require('./config/swagger');
require('dotenv').config();

const adminRoutes = require('./routes/adminRoutes');
const mobileRoutes = require('./routes/mobileRoutes');
const salonRoutes = require('./routes/salonRoutes');
const masterSalonRoutes = require('./routes/masterSalonRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Freya Backend API ishlamoqda!' });
});

// Admin routes
app.use('/api/admin', adminRoutes);

// Mobile app routes
app.use('/api/mobile', mobileRoutes);

// Salon routes
app.use('/api/salons', salonRoutes);

// Master Salon routes
app.use('/api/masterSalons', masterSalonRoutes);

// Employee routes
app.use('/api', employeeRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server xatosi yuz berdi!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route topilmadi' });
});

app.listen(PORT, () => {
  console.log(`Server ${PORT} portda ishlamoqda`);
});