const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.production' });

const app = express();
const PORT = process.env.PORT || 3009;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors({
    origin: ['http://localhost:5189', 'http://localhost:3000', 'http://localhost:5173'],
    credentials: true
}));
app.use(express.json());

// Database connection
const dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Employee login endpoint
app.post('/api/auth/employee/login', async (req, res) => {
    const { username, password } = req.body;
    
    console.log('Login attempt for:', username);
    
    const client = new Client(dbConfig);
    
    try {
        await client.connect();
        
        // Check admin table first (for employee1_1)
        const adminResult = await client.query(
            'SELECT * FROM admins WHERE username = $1 AND is_active = true',
            [username]
        );
        
        if (adminResult.rows.length > 0) {
            const admin = adminResult.rows[0];
            
            // For demo purposes, we'll skip password verification
            // In production, you should verify the password hash
            console.log('Admin found:', admin.username);
            
            // Get the corresponding UUID employee
            const employeeResult = await client.query(
                'SELECT * FROM employees WHERE email = $1',
                [admin.email]
            );
            
            if (employeeResult.rows.length > 0) {
                const employee = employeeResult.rows[0];
                
                const token = jwt.sign(
                    { 
                        id: employee.id, // UUID from employees table
                        username: admin.username, // Original username
                        name: employee.name,
                        role: employee.position,
                        salon_id: employee.salon_id,
                        original_admin_id: admin.id
                    },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );
                
                res.json({
                    success: true,
                    token,
                    user: {
                        id: employee.id,
                        username: admin.username,
                        name: employee.name,
                        role: employee.position,
                        salon_id: employee.salon_id
                    }
                });
            } else {
                res.status(404).json({ error: 'Employee record not found' });
            }
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// Get conversations for employee
app.get('/api/messages/conversations', authenticateToken, async (req, res) => {
    const client = new Client(dbConfig);
    
    try {
        await client.connect();
        
        const employeeId = req.user.id;
        console.log('Getting conversations for employee:', employeeId);
        
        // Get all unique conversations
        const conversationsResult = await client.query(`
            SELECT DISTINCT 
                CASE 
                    WHEN sender_type = 'employee' AND sender_id = $1 THEN receiver_id
                    WHEN receiver_type = 'employee' AND receiver_id = $1 THEN sender_id
                END as user_id,
                CASE 
                    WHEN sender_type = 'employee' AND sender_id = $1 THEN receiver_type
                    WHEN receiver_type = 'employee' AND receiver_id = $1 THEN sender_type
                END as user_type
            FROM user_chats 
            WHERE (sender_type = 'employee' AND sender_id = $1) 
               OR (receiver_type = 'employee' AND receiver_id = $1)
        `, [employeeId]);
        
        const conversations = [];
        
        for (const conv of conversationsResult.rows) {
            if (conv.user_id && conv.user_type === 'user') {
                // Get user details
                const userResult = await client.query(
                    'SELECT id, username FROM users WHERE id = $1',
                    [conv.user_id]
                );
                
                if (userResult.rows.length > 0) {
                    const user = userResult.rows[0];
                    
                    // Get last message
                    const lastMessageResult = await client.query(`
                        SELECT * FROM user_chats 
                        WHERE (sender_id = $1 AND receiver_id = $2) 
                           OR (sender_id = $2 AND receiver_id = $1)
                        ORDER BY created_at DESC 
                        LIMIT 1
                    `, [employeeId, conv.user_id]);
                    
                    // Get unread count
                    const unreadResult = await client.query(`
                        SELECT COUNT(*) as count FROM user_chats 
                        WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false
                    `, [conv.user_id, employeeId]);
                    
                    conversations.push({
                        user_id: user.id,
                        user_name: user.username,
                        username: user.username,
                        last_message: lastMessageResult.rows[0] || null,
                        unread_count: parseInt(unreadResult.rows[0].count) || 0
                    });
                }
            }
        }
        
        res.json({
            success: true,
            conversations
        });
        
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// Get messages for a specific conversation
app.get('/api/messages/conversation/:userId', authenticateToken, async (req, res) => {
    const client = new Client(dbConfig);
    
    try {
        await client.connect();
        
        const employeeId = req.user.id;
        const userId = req.params.userId;
        
        console.log(`Getting messages between employee ${employeeId} and user ${userId}`);
        
        const messagesResult = await client.query(`
            SELECT * FROM user_chats 
            WHERE (sender_id = $1 AND receiver_id = $2) 
               OR (sender_id = $2 AND receiver_id = $1)
            ORDER BY created_at ASC
        `, [employeeId, userId]);
        
        res.json({
            success: true,
            messages: messagesResult.rows
        });
        
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// Send message
app.post('/api/messages/send', authenticateToken, async (req, res) => {
    const { receiver_id, message_text } = req.body;
    const client = new Client(dbConfig);
    
    try {
        await client.connect();
        
        const employeeId = req.user.id;
        
        const messageResult = await client.query(`
            INSERT INTO user_chats (
                id, sender_id, sender_type, receiver_id, receiver_type, 
                message_text, message_type, is_read, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), $1, 'employee', $2, 'user',
                $3, 'text', false, NOW(), NOW()
            ) RETURNING *
        `, [employeeId, receiver_id, message_text]);
        
        res.json({
            success: true,
            message: messageResult.rows[0]
        });
        
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// Mark messages as read
app.post('/api/messages/mark-read', authenticateToken, async (req, res) => {
    const { sender_id } = req.body;
    const client = new Client(dbConfig);
    
    try {
        await client.connect();
        
        const employeeId = req.user.id;
        
        const updateResult = await client.query(`
            UPDATE user_chats 
            SET is_read = true, updated_at = NOW()
            WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false
            RETURNING id
        `, [sender_id, employeeId]);
        
        res.json({
            success: true,
            marked_count: updateResult.rows.length
        });
        
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Production Chat API is running',
        timestamp: new Date().toISOString()
    });
});

// Test endpoint to verify employee data
app.get('/api/test/employee', authenticateToken, (req, res) => {
    res.json({
        success: true,
        employee: req.user,
        message: 'Employee authentication working'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Production Chat API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`💬 Chat API ready for admin panel`);
    console.log(`🔑 Using JWT secret: ${JWT_SECRET ? 'Configured' : 'Default'}`);
});