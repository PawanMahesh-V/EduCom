import { useMutation, useQueryClient } from '@tanstack/react-query';
import directMessageApi from '../api/directMessages';
import communityApi from '../api/communities';
import { useSocket } from '../context/SocketContext';

export const useChatMutations = () => {
    const queryClient = useQueryClient();
    const { socketService } = useSocket();

    // --- Direct Messages ---

    const sendDM = useMutation({
        mutationFn: async ({ senderId, receiverId, message, senderName, isAnonymous }) => {
            console.log('[useChatMutations] Sending DM:', { senderId, receiverId, message, senderName, isAnonymous });
            
            if (!socketService || !socketService.socket || !socketService.socket.connected) {
                throw new Error('Socket not connected');
            }

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Message send timeout'));
                }, 10000); // 10 second timeout

                // Listen for confirmation
                const handleSent = (data) => {
                    console.log('[useChatMutations] Message sent confirmation:', data);
                    clearTimeout(timeout);
                    socketService.socket.off('direct-message-sent', handleSent);
                    socketService.socket.off('message-error', handleError);
                    resolve(data);
                };

                const handleError = (error) => {
                    console.error('[useChatMutations] Message send error:', error);
                    clearTimeout(timeout);
                    socketService.socket.off('direct-message-sent', handleSent);
                    socketService.socket.off('message-error', handleError);
                    reject(new Error(error.error || 'Failed to send message'));
                };

                socketService.socket.once('direct-message-sent', handleSent);
                socketService.socket.once('message-error', handleError);

                // Send the message
                socketService.sendDirectMessage({
                    senderId,
                    receiverId,
                    message,
                    senderName,
                    isAnonymous
                });
            });
        },
        onSuccess: async (data, variables) => {
            console.log('[useChatMutations] ✅ DM sent successfully, refetching queries');
            // Refetch all DM-related queries
            await Promise.all([
                queryClient.refetchQueries(['dm-messages']),
                queryClient.refetchQueries(['conversations'])
            ]);
        },
        onError: (error) => {
            console.error('[useChatMutations] ❌ Failed to send DM:', error);
        }
    });

    const deleteDM = useMutation({
        mutationFn: async (messageId) => {
            return await directMessageApi.deleteMessage(messageId);
        },
        onSuccess: (data, messageId) => {
            queryClient.invalidateQueries(['dm-messages']);
            queryClient.invalidateQueries(['conversations']);
        }
    });

    const deleteMultipleDMs = useMutation({
        mutationFn: async (messageIds) => {
            return await directMessageApi.deleteMultipleMessages(messageIds);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['dm-messages']);
            queryClient.invalidateQueries(['conversations']);
        }
    });


    // --- Community Messages ---

    const sendCommunityMessage = useMutation({
        mutationFn: async ({ communityId, senderId, senderName, text }) => {
            console.log('[useChatMutations] Sending community message:', { communityId, senderId, text });
            
            if (!socketService || !socketService.socket || !socketService.socket.connected) {
                throw new Error('Socket not connected');
            }

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    // For community messages, we'll resolve even on timeout since broadcast is fire-and-forget
                    console.warn('[useChatMutations] Community message send timeout, but continuing...');
                    resolve({ success: true });
                }, 5000);

                // Listen for the message to appear in the broadcast
                const handleNewMessage = (data) => {
                    if (data.community_id === communityId) {
                        console.log('[useChatMutations] Community message broadcast received:', data);
                        clearTimeout(timeout);
                        socketService.socket.off('new-message', handleNewMessage);
                        resolve(data);
                    }
                };

                socketService.socket.once('new-message', handleNewMessage);

                // Send the message
                socketService.sendMessage({ 
                    communityId, 
                    senderId, 
                    senderName,
                    message: text 
                });
            });
        },
        onSuccess: async (data, variables) => {
            console.log('[useChatMutations] ✅ Community message sent successfully, refetching');
            await Promise.all([
                queryClient.refetchQueries(['community-messages']),
                queryClient.refetchQueries(['communities'])
            ]);
        },
        onError: (error) => {
            console.error('[useChatMutations] ❌ Failed to send community message:', error);
        }
    });

    const deleteCommunityMessage = useMutation({
        mutationFn: async ({ communityId, messageId }) => {
            return await communityApi.deleteMessage(communityId, messageId);
        },
        onSuccess: async (data, variables) => {
            await queryClient.refetchQueries(['community-messages', variables.communityId]);
        }
    });

    const deleteMultipleCommunityMessages = useMutation({
        mutationFn: async ({ communityId, messageIds }) => {
            return await communityApi.deleteMultipleMessages(communityId, messageIds);
        },
        onSuccess: async (data, variables) => {
            await queryClient.refetchQueries(['community-messages', variables.communityId]);
        }
    });


    return {
        sendDM,
        deleteDM,
        deleteMultipleDMs,
        sendCommunityMessage,
        deleteCommunityMessage,
        deleteMultipleCommunityMessages
    };
};

