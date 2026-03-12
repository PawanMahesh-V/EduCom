const pool = require('../config/database');
const { TEACHING_ROLES } = require('../config/constants');

module.exports = (io, socket, connectedUsers) => {

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
        const { communityId, message, senderId, senderName, notificationOnly, subject } = data;

        try {
            const senderRole = await pool.query(
                'SELECT role FROM users WHERE id = $1',
                [senderId]
            );
            const isAdmin = senderRole.rows.length > 0 && senderRole.rows[0].role === 'Admin';

            // Check community status
            const communityStatus = await pool.query(
                'SELECT status FROM communities WHERE id = $1',
                [communityId]
            );

            if (communityStatus.rows.length > 0 && communityStatus.rows[0].status === 'inactive' && !isAdmin) {
                socket.emit('message-error', { error: 'This community is inactive. You cannot send messages.' });
                return;
            }

            // If notificationOnly flag is set (from admin modal), skip saving to chat
            if (!notificationOnly) {
                // Save message to database and broadcast to chat (normal chat behavior)
                const result = await pool.query(
                    `INSERT INTO messages (community_id, sender_id, content, status)
                     VALUES ($1, $2, $3, 'approved')
                     RETURNING id, community_id, sender_id, content, status, created_at`,
                    [communityId, senderId, message]
                );

                const newMessage = result.rows[0];

                // Broadcast to all users in the community
                io.to(`community-${communityId}`).emit('new-message', {
                    ...newMessage,
                    sender_name: senderName
                });
            }

            // Create notifications if admin or notificationOnly flag
            // Delegate back to notification handler via event or direct call? 
            // Better to keep logic here if it's tightly coupled or trigger a local event.
            // For now, I will keep the notification logic duplication or extraction here as in original server.js
            // Ideally, this should be in a Service. I'll rely on the existing logic flow.

            if (notificationOnly || isAdmin) {
                // ... logic for notifying recipients ...
                // To keep this file clean, let's extract this to a helper if possible, 
                // but for this refactor I will copy the working logic to ensure stability.
                const communityDetails = await pool.query(
                    `SELECT c.name, co.name as course_name, co.code as course_code, co.id as course_id
                     FROM communities c
                     JOIN courses co ON c.course_id = co.id
                     WHERE c.id = $1`,
                    [communityId]
                );

                if (communityDetails.rows.length > 0) {
                    const community = communityDetails.rows[0];
                    const enrolledStudents = await pool.query(
                        `SELECT DISTINCT e.student_id as user_id
                         FROM enrollments e
                         JOIN communities c ON e.course_id = c.course_id
                         WHERE c.id = $1 AND e.student_id != $2`,
                        [communityId, senderId]
                    );
                    const courseTeacher = await pool.query(
                        `SELECT teacher_id as user_id
                         FROM courses
                         WHERE id = (SELECT course_id FROM communities WHERE id = $1)
                         AND teacher_id IS NOT NULL
                         AND teacher_id != $2`,
                        [communityId, senderId]
                    );

                    const allRecipients = [
                        ...enrolledStudents.rows,
                        ...courseTeacher.rows
                    ].filter(r => r.user_id);

                    const notificationPromises = allRecipients.map(recipient => {
                        const notifTitle = subject
                            ? `${subject} (${community.course_code})`
                            : `New message in ${community.course_code}`;
                        const notifMessage = `${senderName}: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`;

                        return pool.query(
                            `INSERT INTO notifications (user_id, sender_id, title, message, type, is_read, course_id)
                             VALUES ($1, $2, $3, $4, 'info', false, $5)
                             RETURNING id, user_id, sender_id, title, message, type, is_read, created_at`,
                            [recipient.user_id, senderId, notifTitle, notifMessage, community.course_id]
                        ).then(notifResult => {
                            const notification = notifResult.rows[0];
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
            console.error('Send message error:', error);
        }
    });

    // Delete message
    socket.on('delete-message', async (data) => {
        const { messageId, communityId } = data;
        try {
            await pool.query('DELETE FROM messages WHERE id = $1', [messageId]);
            io.to(`community-${communityId}`).emit('message-deleted', { messageId });
        } catch (error) {
            console.error('Delete message error:', error);
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

    // Direct message events
    socket.on('send-direct-message', async (data) => {
        const { senderId, receiverId, message, senderName, isAnonymous = false } = data;

        try {
            if (isAnonymous) {
                const senderResult = await pool.query('SELECT role FROM users WHERE id = $1', [senderId]);
                const receiverResult = await pool.query('SELECT role FROM users WHERE id = $1', [receiverId]);

                if (senderResult.rows.length === 0 || receiverResult.rows.length === 0) {
                    socket.emit('message-error', { error: 'User not found' });
                    return;
                }

                const senderRole = senderResult.rows[0].role;
                const receiverRole = receiverResult.rows[0].role;

                if (senderRole !== 'Student' || !TEACHING_ROLES.includes(receiverRole)) {
                    socket.emit('message-error', { error: 'Anonymous messaging is only available for students messaging teachers, HODs, or PMs' });
                    return;
                }
            }

            const result = await pool.query(
                `INSERT INTO messages (sender_id, receiver_id, content, is_read, is_anonymous, community_id, status)
                 VALUES ($1, $2, $3, false, $4, NULL, 'approved')
                 RETURNING id, sender_id, receiver_id, content, is_read, is_anonymous, created_at`,
                [senderId, receiverId, message, isAnonymous]
            );

            const newMessage = result.rows[0];
            const receiverSocketId = connectedUsers.get(parseInt(receiverId));

            if (receiverSocketId) {
                io.to(receiverSocketId).emit('new-direct-message', {
                    ...newMessage,
                    sender_name: isAnonymous ? 'Anonymous Student' : senderName
                });
            }

            socket.emit('direct-message-sent', {
                ...newMessage,
                sender_name: senderName
            });
        } catch (error) {
            console.error('Error sending direct message:', error);
            socket.emit('message-error', { error: 'Failed to send message' });
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
};
