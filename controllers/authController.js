const bcrypt = require('bcrypt');
const { query, get, run } = require('../config/sqlite_database');
const { generateToken } = require('../middleware/authMiddleware');

// Superadmin login
const superadminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username va password talab qilinadi' });
        }

        // Superadmin ni database dan topish
        const superadmin = await get(
            'SELECT id, username, email, password_hash, full_name, role, is_active, created_at, updated_at FROM admins WHERE username = ? AND role = ? AND is_active = 1',
            [username, 'superadmin']
        );

        if (!superadmin) {
            return res.status(401).json({ message: 'Noto\'g\'ri username yoki password' });
        }

        // Password tekshirish
        const isValidPassword = await bcrypt.compare(password, superadmin.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Noto\'g\'ri username yoki password' });
        }

        // Token yaratish
        const token = generateToken({
            id: superadmin.id,
            username: superadmin.username,
            role: 'superadmin'
        });

        res.json({
            message: 'Superadmin muvaffaqiyatli login qildi',
            token,
            user: {
                id: superadmin.id,
                username: superadmin.username,
                email: superadmin.email,
                full_name: superadmin.full_name,
                role: 'superadmin'
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

        // Admin ni database dan topish (faqat admin role'li userlar)
        const admin = await get(
            'SELECT id, username, email, password_hash, full_name, role, is_active, created_at, updated_at FROM admins WHERE username = ? AND is_active = 1',
            [username]
        );

        if (!admin) {
            return res.status(401).json({ message: 'Noto\'g\'ri username yoki password' });
        }

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
                role: admin.role,
                salon_id: admin.salon_id
            }
        });

    } catch (error) {
        console.error('Admin login xatosi:', {
            error: error.message,
            stack: error.stack,
            body: req.body,
            headers: req.headers
        });
        
        // Agar response allaqachon yuborilgan bo'lsa, qayta yubormaslik
        if (!res.headersSent) {
            res.status(500).json({ 
                message: 'Server xatosi',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
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
        const salon = await get('SELECT id FROM salons WHERE id = ?', [salon_id]);
        if (!salon) {
            return res.status(404).json({
                message: 'Salon topilmadi'
            });
        }

        // Check if admin already exists
        const existingAdmin = await get(
            'SELECT id FROM admins WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingAdmin) {
            return res.status(400).json({
                message: 'Admin allaqachon mavjud'
            });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create admin
        const result = await run(
            `INSERT INTO admins (username, email, password_hash, full_name, salon_id)
             VALUES (?, ?, ?, ?, ?)`,
            [username, email, hashedPassword, full_name, salon_id]
        );

        // Get the created admin
        const newAdmin = await get(
            'SELECT id, username, email, full_name, salon_id, created_at FROM admins WHERE id = ?',
            [result.id]
        );

        res.status(201).json({
            success: true,
            message: 'Admin muvaffaqiyatli yaratildi',
            data: newAdmin
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

        // Employee ni admins jadvalidan topish (username yoki email orqali)
        const employee = await get(
            'SELECT id, username, email, password_hash, full_name, role, salon_id, is_active, created_at, updated_at FROM admins WHERE (username = ? OR email = ?) AND role = ? AND is_active = 1',
            [username, username, 'employee']
        );

        if (!employee) {
            return res.status(401).json({ message: 'Noto\'g\'ri username yoki password' });
        }

        // Password tekshirish
        const isValidPassword = await bcrypt.compare(password, employee.password_hash);
        
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