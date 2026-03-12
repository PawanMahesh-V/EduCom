const pool = require('../config/database');
const registerChatHandlers = require('./chatHandler');
const registerNotificationHandlers = require('./notificationHandler');

const connectedUsers = new Map(); // Map of userId to socket.id

const initSocket = (io) => {
    io.on('connection', (socket) => {
        // User authentication and registration
        socket.on('register', async (userId) => {
            // Always store userId as integer for consistent lookup
            const numericUserId = parseInt(userId);
            connectedUsers.set(numericUserId, socket.id);
            socket.userId = numericUserId;

            // Join user-specific room
            socket.join(`user-${numericUserId}`);

            // Check if user is Admin and join admin room
            try {
                const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [numericUserId]);
                if (userResult.rows.length > 0 && userResult.rows[0].role === 'Admin') {
                    socket.join('admin-room');
                }
            } catch (err) {
                console.error('Error joining admin room:', err);
            }

            // Notify user is online
            io.emit('user-status', { userId: numericUserId, status: 'online' });
        });

        // Register handlers
        registerChatHandlers(io, socket, connectedUsers);
        registerNotificationHandlers(io, socket, connectedUsers);

        // Handle disconnection
        socket.on('disconnect', () => {
            if (socket.userId) {
                connectedUsers.delete(socket.userId);
                io.emit('user-status', { userId: socket.userId, status: 'offline' });
            }
        });
    });
};

module.exports = { initSocket };
