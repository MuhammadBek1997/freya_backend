const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const { generateToken } = require('../middleware/authMiddleware');

// Superadmin login
const superadminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username va password talab qilinadi' });
        }

        // Superadmin ni database dan topish
        console.log('Login attempt:', { username, password });
        const result = await pool.query(
            'SELECT * FROM admins WHERE username = $1 AND role = $2 AND is_active = true',
            [username, 'superadmin']
        );
        console.log('Database result:', result.rows);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Noto\'g\'ri username yoki password' });
        }

        const superadmin = result.rows[0];

        // Password tekshirish
        const isValidPassword = await bcrypt.compare(password, superadmin.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Noto\'g\'ri username yoki password' });
        }

        // Token yaratish
        const token = generateToken({
            id: superadmin.id,
            username: superadmin.username,
            role: superadmin.role
        });

        res.json({
            message: 'Superadmin muvaffaqiyatli login qildi',
            token,
            user: {
                id: superadmin.id,
                username: superadmin.username,
                email: superadmin.email,
                full_name: superadmin.full_name,
                role: superadmin.role
            }
        });

    } catch (error) {
        console.error('Superadmin login xatosi:', error);
        res.status(500).json({ message: 'Server xatosi' });
    }
};

// Admin login
const adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username va password talab qilinadi' });
        }

        // Admin ni database dan topish
        const result = await pool.query(
            'SELECT * FROM admins WHERE username = $1 AND role = $2 AND is_active = true',
            [username, 'admin']
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Noto\'g\'ri username yoki password' });
        }

        const admin = result.rows[0];

        // Password tekshirish
        const isValidPassword = await bcrypt.compare(password, admin.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Noto\'g\'ri username yoki password' });
        }

        // Token yaratish
        const token = generateToken({
            id: admin.id,
            username: admin.username,
            role: admin.role
        });

        res.json({
            message: 'Admin muvaffaqiyatli login qildi',
            token,
            user: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                full_name: admin.full_name,
                role: admin.role
            }
        });

    } catch (error) {
        console.error('Admin login xatosi:', error);
        res.status(500).json({ message: 'Server xatosi' });
    }
};

// Create admin
const createAdmin = async (req, res) => {
    try {
        const { username, email, password, full_name, salon_id } = req.body;

        // Validate required fields
        if (!username || !email || !password || !full_name || !salon_id) {
            return res.status(400).json({
                message: 'Barcha maydonlar majburiy'
            });
        }

        // Check if salon exists
        const salonCheck = await pool.query('SELECT id FROM salons WHERE id = $1', [salon_id]);
        if (salonCheck.rows.length === 0) {
            return res.status(404).json({
                message: 'Salon topilmadi'
            });
        }

        // Check if admin already exists
        const existingAdmin = await pool.query(
            'SELECT id FROM admins WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existingAdmin.rows.length > 0) {
            return res.status(400).json({
                message: 'Admin allaqachon mavjud'
            });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create admin
        const result = await pool.query(
            `INSERT INTO admins (username, email, password_hash, full_name, role, salon_id)
             VALUES ($1, $2, $3, $4, 'admin', $5)
             RETURNING id, username, email, full_name, role, salon_id, created_at`,
            [username, email, hashedPassword, full_name, salon_id]
        );

        res.status(201).json({
            success: true,
            message: 'Admin muvaffaqiyatli yaratildi',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Admin yaratish xatosi:', error);
        res.status(500).json({ message: 'Server xatosi' });
    }
};

// Employee login
const employeeLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username va password talab qilinadi' });
        }

        // Employee ni database dan topish
        const result = await pool.query(
            'SELECT * FROM employees WHERE username = $1 AND is_active = true',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Noto\'g\'ri username yoki password' });
        }

        const employee = result.rows[0];

        // Password tekshirish
        const isValidPassword = await bcrypt.compare(password, employee.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Noto\'g\'ri username yoki password' });
        }

        // Token yaratish
        const token = generateToken({
            id: employee.id,
            username: employee.username,
            role: 'employee',
            salon_id: employee.salon_id
        });

        res.json({
            message: 'Employee muvaffaqiyatli login qildi',
            token,
            user: {
                id: employee.id,
                username: employee.username,
                email: employee.email,
                name: employee.name,
                surname: employee.surname,
                role: 'employee',
                salon_id: employee.salon_id
            }
        });

    } catch (error) {
        console.error('Employee login xatosi:', error);
        res.status(500).json({ message: 'Server xatosi' });
    }
};

module.exports = {
    superadminLogin,
    adminLogin,
    createAdmin,
    employeeLogin
};