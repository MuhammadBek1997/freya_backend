const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { pool } = require('./database');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:3010', 'http://localhost:5173'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_this_in_production');
      console.log('Socket auth - decoded token:', decoded);
      
      // Check if it's an employee or user
      let userQuery, userResult;
      if (decoded.role === 'employee') {
        userQuery = 'SELECT id, name, surname, email FROM employees WHERE id = $1';
        userResult = await pool.query(userQuery, [decoded.id]);
      } else {
        userQuery = 'SELECT id, username, email FROM users WHERE id = $1';
        userResult = await pool.query(userQuery, [decoded.id || decoded.userId]);
      }
      
      if (userResult.rows.length === 0) {
        return next(new Error('User not found'));
      }

      socket.userId = decoded.id || decoded.userId;
      socket.user = userResult.rows[0];
      socket.userRole = decoded.role;
      console.log(`Socket authenticated: ${socket.user.name || socket.user.username} (${decoded.role})`);
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  // Socket connection handling
  io.on('connection', (socket) => {
    console.log(`User ${socket.user.username} connected with socket ID: ${socket.id}`);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Handle joining conversation rooms
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`User ${socket.user.username} joined conversation ${conversationId}`);
    });

    // Handle leaving conversation rooms
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`User ${socket.user.username} left conversation ${conversationId}`);
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { receiver_id, content } = data;
        
        // Save message to database
        const messageQuery = `
          INSERT INTO messages (sender_id, receiver_id, content)
          VALUES ($1, $2, $3)
          RETURNING id, sender_id, receiver_id, content, is_read, created_at
        `;
        const messageResult = await pool.query(messageQuery, [socket.userId, receiver_id, content]);
        const message = messageResult.rows[0];

        // Get sender info
        const senderQuery = 'SELECT username FROM users WHERE id = $1';
        const senderResult = await pool.query(senderQuery, [socket.userId]);
        message.sender_username = senderResult.rows[0].username;

        // Emit to receiver
        socket.to(`user_${receiver_id}`).emit('new_message', message);
        
        // Emit back to sender for confirmation
        socket.emit('message_sent', message);

        console.log(`Message sent from ${socket.user.username} to user ${receiver_id}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { receiver_id } = data;
      socket.to(`user_${receiver_id}`).emit('user_typing', {
        user_id: socket.userId,
        username: socket.user.username
      });
    });

    socket.on('typing_stop', (data) => {
      const { receiver_id } = data;
      socket.to(`user_${receiver_id}`).emit('user_stopped_typing', {
        user_id: socket.userId
      });
    });

    // Handle marking messages as read
    socket.on('mark_message_read', async (data) => {
      try {
        const { message_id } = data;
        
        const updateQuery = `
          UPDATE messages 
          SET is_read = true 
          WHERE id = $1 AND receiver_id = $2
          RETURNING sender_id
        `;
        const result = await pool.query(updateQuery, [message_id, socket.userId]);
        
        if (result.rows.length > 0) {
          const sender_id = result.rows[0].sender_id;
          // Notify sender that message was read
          socket.to(`user_${sender_id}`).emit('message_read', {
            message_id,
            read_by: socket.userId
          });
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Handle user status updates
    socket.on('update_status', (status) => {
      socket.broadcast.emit('user_status_update', {
        user_id: socket.userId,
        username: socket.user.username,
        status
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.username} disconnected`);
      socket.broadcast.emit('user_status_update', {
        user_id: socket.userId,
        username: socket.user.username,
        status: 'offline'
      });
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO
};