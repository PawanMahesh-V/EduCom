const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const result = dotenv.config({ debug: false, quiet: true });

if (result.error) {
    console.error('Error loading .env file:', result.error);
    process.exit(1);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

const pool = require('./config/database');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const dashboardRoutes = require('./routes/dashboard');
const communityRoutes = require('./routes/communities');
const notificationRoutes = require('./routes/notifications');
const sectionRoutes = require('./routes/sections');
const directMessageRoutes = require('./routes/directMessages');

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/direct-messages', directMessageRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
});

// Socket.IO connection handling
const connectedUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
    // User authentication and registration
    socket.on('register', (userId) => {
        connectedUsers.set(userId, socket.id);
        socket.userId = userId;
        
        // Notify user is online
        io.emit('user-status', { userId, status: 'online' });
    });

    // Join a community/course room
    socket.on('join-community', (communityId) => {
        socket.join(`community-${communityId}`);
    });

    // Leave a community/course room
    socket.on('leave-community', (communityId) => {
        socket.leave(`community-${communityId}`);
    });

    // Send message to community
    socket.on('send-message', async (data) => {
        const { communityId, message, senderId, senderName, isAnonymous, notificationOnly } = data;
        
        try {
            // Check if sender is Admin
            const senderRole = await pool.query(
                'SELECT role FROM users WHERE id = $1',
                [senderId]
            );

            const isAdmin = senderRole.rows.length > 0 && senderRole.rows[0].role === 'Admin';

            // If notificationOnly flag is set (from admin modal), skip saving to chat
            if (notificationOnly || isAdmin) {
                // Only create notifications, don't save to messages table or broadcast to chat
            } else {
                // Save message to database and broadcast to chat (normal chat behavior)
                const result = await pool.query(
                    `INSERT INTO messages (community_id, sender_id, content, is_anonymous, status)
                     VALUES ($1, $2, $3, $4, 'approved')
                     RETURNING id, community_id, sender_id, content, is_anonymous, status, created_at`,
                    [communityId, senderId, message, isAnonymous]
                );

                const newMessage = result.rows[0];
                
                // Broadcast to all users in the community
                io.to(`community-${communityId}`).emit('new-message', {
                    ...newMessage,
                    sender_name: isAnonymous ? 'Anonymous' : senderName
                });
            }

            // Create notifications if admin or notificationOnly flag
            if (notificationOnly || isAdmin) {
                // Get community details
                const communityDetails = await pool.query(
                    `SELECT c.name, co.name as course_name, co.code as course_code, co.id as course_id
                     FROM communities c
                     JOIN courses co ON c.course_id = co.id
                     WHERE c.id = $1`,
                    [communityId]
                );

                if (communityDetails.rows.length > 0) {
                    const community = communityDetails.rows[0];
                    
                    // Get all enrolled students in this community's course
                    const enrolledStudents = await pool.query(
                        `SELECT DISTINCT e.student_id as user_id
                         FROM enrollments e
                         JOIN communities c ON e.course_id = c.course_id
                         WHERE c.id = $1 AND e.student_id != $2`,
                        [communityId, senderId]
                    );

                    // Get the teacher of this course
                    const courseTeacher = await pool.query(
                        `SELECT teacher_id as user_id
                         FROM courses
                         WHERE id = (SELECT course_id FROM communities WHERE id = $1)
                         AND teacher_id IS NOT NULL
                         AND teacher_id != $2`,
                        [communityId, senderId]
                    );

                    console.log('📧 Notification recipients:');
                    console.log('Students:', enrolledStudents.rows);
                    console.log('Teachers:', courseTeacher.rows);

                    // Combine students and teachers (filter out any nulls)
                    const allRecipients = [
                        ...enrolledStudents.rows,
                        ...courseTeacher.rows
                    ].filter(r => r.user_id);

                    // Create notification for each recipient
                    const notificationPromises = allRecipients.map(recipient => {
                        const notifTitle = `New message in ${community.course_code}`;
                        const notifMessage = `${senderName}: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`;
                        
                        return pool.query(
                            `INSERT INTO notifications (user_id, sender_id, title, message, type, is_read, course_id)
                             VALUES ($1, $2, $3, $4, 'info', false, $5)
                             RETURNING id, user_id, sender_id, title, message, type, is_read, created_at`,
                            [recipient.user_id, senderId, notifTitle, notifMessage, community.course_id]
                        ).then(notifResult => {
                            const notification = notifResult.rows[0];
                            // Send real-time notification if user is online
                            const targetSocketId = connectedUsers.get(recipient.user_id);
                            if (targetSocketId) {
                                io.to(targetSocketId).emit('new-notification', notification);
                            }
                            return notification;
                        });
                    });

                    await Promise.all(notificationPromises);
                }
            }
        } catch (error) {
            // Error event removed: not handled on frontend
        }
    });

    // Delete message
    socket.on('delete-message', async (data) => {
        const { messageId, communityId } = data;
        
        try {
            await pool.query('DELETE FROM messages WHERE id = $1', [messageId]);
            
            // Notify all users in the community
            io.to(`community-${communityId}`).emit('message-deleted', { messageId });
        } catch (error) {
            // Error event removed: not handled on frontend
        }
    });

    // Typing indicator
    socket.on('typing', (data) => {
        const { communityId, userName, isTyping } = data;
        socket.to(`community-${communityId}`).emit('user-typing', {
            userName,
            isTyping
        });
    });

    // Send notification
    socket.on('send-notification', async (data) => {
        const { userId, title, message, type, senderId } = data;
        
        try {
            // Save notification to database
            const result = await pool.query(
                `INSERT INTO notifications (user_id, sender_id, title, message, type, is_read)
                 VALUES ($1, $2, $3, $4, $5, false)
                 RETURNING id, user_id, sender_id, title, message, type, is_read, created_at`,
                [userId, senderId, title, message, type]
            );

            const notification = result.rows[0];
            
            // Send to specific user if online
            const targetSocketId = connectedUsers.get(userId);
            if (targetSocketId) {
                io.to(targetSocketId).emit('new-notification', notification);
            }
        } catch (error) {
            // Notification failed silently
        }
    });

    // Broadcast notification to role
    socket.on('broadcast-notification', async (data) => {
        const { role, title, message, type, senderId } = data;
        
        try {
            // Get all users with the specified role
            const users = await pool.query(
                'SELECT id FROM users WHERE role = $1',
                [role]
            );

            // Insert notifications for all users
            const insertPromises = users.rows.map(user =>
                pool.query(
                    `INSERT INTO notifications (user_id, sender_id, title, message, type, target_role, is_read)
                     VALUES ($1, $2, $3, $4, $5, $6, false)
                     RETURNING id, user_id, sender_id, title, message, type, is_read, created_at`,
                    [user.id, senderId, title, message, type, role]
                )
            );

            const results = await Promise.all(insertPromises);
            
            // Broadcast to all connected users with that role
            results.forEach(result => {
                const notification = result.rows[0];
                const targetSocketId = connectedUsers.get(notification.user_id);
                if (targetSocketId) {
                    io.to(targetSocketId).emit('new-notification', notification);
                }
            });
        } catch (error) {
            // Broadcast failed silently
        }
    });

    // Direct message events
    socket.on('send-direct-message', async (data) => {
        const { senderId, receiverId, message, senderName, isAnonymous = false } = data;
        
        try {
            // Save message to database (community_id is NULL for direct messages)
            const result = await pool.query(
                `INSERT INTO messages (sender_id, receiver_id, content, is_read, community_id, is_anonymous, status)
                 VALUES ($1, $2, $3, false, NULL, $4, 'approved')
                 RETURNING id, sender_id, receiver_id, content, is_read, is_anonymous, created_at`,
                [senderId, receiverId, message, isAnonymous]
            );

            const newMessage = result.rows[0];
            
            // Send to receiver if online
            const receiverSocketId = connectedUsers.get(parseInt(receiverId));
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('new-direct-message', {
                    ...newMessage,
                    sender_name: isAnonymous ? 'Anonymous' : senderName
                });
            }

            // Send confirmation to sender
            socket.emit('direct-message-sent', {
                ...newMessage,
                sender_name: isAnonymous ? 'Anonymous' : senderName
            });
        } catch (error) {
            // Error event removed: not handled on frontend
        }
    });

    // Direct message typing indicator
    socket.on('dm-typing', (data) => {
        const { receiverId, senderName, isTyping } = data;
        const receiverSocketId = connectedUsers.get(parseInt(receiverId));
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('dm-user-typing', {
                senderName,
                isTyping
            });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        if (socket.userId) {
            connectedUsers.delete(socket.userId);
            io.emit('user-status', { userId: socket.userId, status: 'offline' });
        }
    });
});

// Make io accessible to routes
app.set('io', io);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
    console.log(`Socket.IO is ready for connections`);
    console.log(`Access from network: http://192.168.1.107:${PORT}`);
});