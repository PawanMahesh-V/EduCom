const { TEACHING_ROLES } = require('../config/constants');
const ModerationService = require('../services/ModerationService');
const MessageService = require('../services/MessageService');

module.exports = (io, socket, connectedUsers) => {

    // Join a community/course room
    socket.on('join-community', async (data) => {
        const communityId = typeof data === 'object' ? data.communityId : data;
        const userId = typeof data === 'object' ? data.userId : null;
        const userName = typeof data === 'object' ? data.userName : null;

        socket.join(`community-${communityId}`);

        if (userId && userName) {
            socket.to(`community-${communityId}`).emit('user-joined-community', {
                communityId,
                userId,
                userName,
                joinedAt: new Date().toISOString()
            });
        }
    });

    // Leave a community/course room
    socket.on('leave-community', (communityId) => {
        socket.leave(`community-${communityId}`);
    });

    // Send message to community
    socket.on('send-message', async (data, callback) => {
        const { communityId, message, senderId, senderName, notificationOnly, subject, clientMessageId } = data;

        try {
            if (await MessageService.isUserChatBanned(senderId)) {
                socket.emit('message-error', { error: 'You are banned from chatting and can only view messages.' });
                socket.emit('message-blocked', { 
                    client_message_id: clientMessageId,
                    moderation_blocked: true,
                    blocked_reason: 'chat_banned',
                    content: message,
                    error: 'You are banned from chatting and can only view messages.'
                });
                if (typeof callback === 'function') {
                    callback({ success: false, error: 'You are banned from chatting and can only view messages.' });
                }
                return;
            }

            const senderRole = await MessageService.getUserRole(senderId);
            const isAdmin = senderRole === 'Admin';

            if (await MessageService.isCommunityInactive(communityId) && !isAdmin) {
                socket.emit('message-error', { error: 'This community is inactive. You cannot send messages.' });
                if (typeof callback === 'function') {
                    callback({ success: false, error: 'Community is inactive.' });
                }
                return;
            }

            const textToModerate = subject ? `${subject} ${message}` : message;
            const moderation = await ModerationService.moderateText(textToModerate);
            
            if (moderation.toxic) {
                if (!notificationOnly) {
                    const reportedMessage = await MessageService.saveCommunityMessage(communityId, senderId, message, 'pending_review');

                    socket.emit('message-blocked', {
                        id: reportedMessage.id,
                        client_message_id: clientMessageId,
                        community_id: communityId,
                        sender_id: senderId,
                        sender_name: senderName,
                        content: message,
                        created_at: reportedMessage.created_at,
                        moderation_blocked: true,
                        blocked_reason: 'pending_review',
                        confidence: moderation.confidence
                    });
                } else {
                    socket.emit('message-blocked', {
                        client_message_id: clientMessageId,
                        moderation_blocked: true,
                        blocked_reason: 'pending_review',
                        content: message,
                        confidence: moderation.confidence
                    });
                }
                
                socket.emit('message-error', {
                    error: 'Content pending admin review due to policy violation',
                    toxic: true,
                    confidence: moderation.confidence
                });
                
                io.emit('new-reported-message');
                if (typeof callback === 'function') {
                    callback({ success: true, blocked: true });
                }
                return;
            }

            if (!notificationOnly) {
                const newMessage = await MessageService.saveCommunityMessage(communityId, senderId, message, 'approved');

                io.to(`community-${communityId}`).emit('new-message', {
                    ...newMessage,
                    sender_name: senderName
                });

                if (typeof callback === 'function') {
                    callback({ success: true, message: newMessage });
                    callback = null; 
                }
            }

            if (notificationOnly) {
                const community = await MessageService.getCommunityDetails(communityId);

                if (community) {
                    const allRecipients = await MessageService.getCommunityNotificationRecipients(communityId, senderId);

                    const notifTitle = subject
                        ? `${subject} (${community.course_code})`
                        : `New message in ${community.course_code}`;
                    const notifMessage = `${senderName}: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`;

                    const notificationPromises = allRecipients.map(async recipient => {
                        const notification = await MessageService.createNotification(
                            recipient.user_id, senderId, notifTitle, notifMessage, community.course_id
                        );
                        
                        const targetSocketId = connectedUsers.get(recipient.user_id);
                        if (targetSocketId) {
                            io.to(targetSocketId).emit('new-notification', notification);
                        }
                        return notification;
                    });
                    
                    await Promise.all(notificationPromises);
                    if (typeof callback === 'function') {
                        callback({ success: true });
                    }
                } 
            }

        } catch (error) {
            console.error('Send message error:', error);
            if (typeof callback === 'function') {
                callback({ success: false, error: 'Server error' });
            }
        }
    });

    // Delete message
    socket.on('delete-message', async (data) => {
        const { messageId, communityId } = data;
        try {
            await MessageService.deleteMessage(messageId);
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
    socket.on('send-direct-message', async (data, callback) => {
        const { senderId, receiverId, message, senderName, isAnonymous = false, clientMessageId } = data;

        try {
            if (await MessageService.isUserChatBanned(senderId)) {
                const receiverRole = await MessageService.getUserRole(receiverId);
                const isReceiverAdmin = receiverRole === 'Admin';
                
                if (!isReceiverAdmin) {
                    socket.emit('message-error', { error: 'You are banned from chatting and can only view messages.' });
                    socket.emit('message-blocked', { 
                        client_message_id: clientMessageId,
                        moderation_blocked: true,
                        blocked_reason: 'chat_banned',
                        content: message,
                        error: 'You are banned from chatting and can only view messages.'
                    });
                    if (typeof callback === 'function') callback({ success: false, error: 'Banned' });
                    return;
                }
            }

            if (isAnonymous) {
                const senderRole = await MessageService.getUserRole(senderId);
                const receiverRole = await MessageService.getUserRole(receiverId);

                if (!senderRole || !receiverRole) {
                    socket.emit('message-error', { error: 'User not found' });
                    if (typeof callback === 'function') callback({ success: false, error: 'User not found' });
                    return;
                }

                if (senderRole !== 'Student' || !TEACHING_ROLES.includes(receiverRole)) {
                    socket.emit('message-error', { error: 'Anonymous messaging is only available for students messaging teachers, HODs, or PMs' });
                    if (typeof callback === 'function') {
                        callback({ success: false, error: 'Anonymous messaging eligibility error.' });
                    }
                    return;
                }
            }

            const moderation = await ModerationService.moderateText(message);
            if (moderation.toxic) {
                const reportedMessage = await MessageService.saveDirectMessage(senderId, receiverId, message, isAnonymous, 'pending_review');

                socket.emit('message-blocked', {
                    id: reportedMessage.id,
                    client_message_id: clientMessageId,
                    sender_id: senderId,
                    receiver_id: receiverId,
                    sender_name: isAnonymous ? 'Anonymous Student' : senderName,
                    content: message,
                    is_anonymous: isAnonymous,
                    created_at: reportedMessage.created_at,
                    moderation_blocked: true,
                    blocked_reason: 'pending_review',
                    confidence: moderation.confidence
                });
                
                socket.emit('message-error', {
                    error: 'Direct message pending admin review due to policy violation',
                    toxic: true,
                    confidence: moderation.confidence
                });
                
                io.emit('new-reported-message');
                if (typeof callback === 'function') {
                    callback({ success: true, message: reportedMessage, blocked: true });
                }
                return;
            }

            let newMessage = await MessageService.saveDirectMessage(senderId, receiverId, message, isAnonymous, 'approved');
            const receiverSocketId = connectedUsers.get(parseInt(receiverId));

            if (receiverSocketId) {
                const deliveredMsg = await MessageService.markMessageDelivered(newMessage.id);
                if (deliveredMsg) {
                    newMessage.delivered_at = deliveredMsg.delivered_at;
                }

                io.to(receiverSocketId).emit('new-direct-message', {
                    ...newMessage,
                    sender_name: isAnonymous ? 'Anonymous Student' : senderName
                });

                socket.emit('message-delivered', {
                    messageId: newMessage.id,
                    delivered_at: newMessage.delivered_at
                });
            }

            socket.emit('direct-message-sent', {
                ...newMessage,
                sender_name: senderName
            });

            if (typeof callback === 'function') {
                callback({ success: true, message: newMessage });
            }
        } catch (error) {
            console.error('Error sending direct message:', error);
            socket.emit('message-error', { error: 'Failed to send message' });
            if (typeof callback === 'function') {
                callback({ success: false, error: 'Server error' });
            }
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

    // Mark direct message as delivered
    socket.on('mark-message-delivered', async (data) => {
        const { messageId } = data;
        try {
            const deliveredData = await MessageService.markMessageDelivered(messageId);
            if (deliveredData) {
                const senderSocketId = connectedUsers.get(parseInt(deliveredData.sender_id));
                if (senderSocketId) {
                    io.to(senderSocketId).emit('message-delivered', {
                        messageId,
                        delivered_at: deliveredData.delivered_at
                    });
                }
            }
        } catch (error) {
            console.error('Error marking message as delivered:', error);
        }
    });

    // Mark direct message as read
    socket.on('mark-message-read', async (data) => {
        const { messageId, userId } = data;
        try {
            const readData = await MessageService.markMessageRead(messageId, userId);
            if (readData) {
                const senderSocketId = connectedUsers.get(parseInt(readData.sender_id));
                if (senderSocketId) {
                    io.to(senderSocketId).emit('message-read', {
                        messageId,
                        read_at: readData.read_at
                    });
                }
            }
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    });

    // Mark multiple messages as read (for conversation view)
    socket.on('mark-messages-read', async (data) => {
        const { messageIds, userId } = data;
        try {
            const updatedRows = await MessageService.markMultipleMessagesRead(messageIds, userId);
            
            const senderMap = {};
            updatedRows.forEach(row => {
                if (!senderMap[row.sender_id]) {
                    senderMap[row.sender_id] = [];
                }
                senderMap[row.sender_id].push({
                    messageId: row.id,
                    read_at: row.read_at
                });
            });

            Object.keys(senderMap).forEach(senderId => {
                const senderSocketId = connectedUsers.get(parseInt(senderId));
                if (senderSocketId) {
                    senderMap[senderId].forEach(msg => {
                        io.to(senderSocketId).emit('message-read', msg);
                    });
                }
            });
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    });
};
