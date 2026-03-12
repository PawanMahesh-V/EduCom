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
            return new Promise((resolve, reject) => {
                try {
                    // Correct payload structure matching useSocket.js
                    socketService.sendDirectMessage({
                        senderId,
                        receiverId,
                        message, // Changed from text to message
                        senderName,
                        isAnonymous
                    });
                    resolve({ success: true });
                } catch (e) {
                    reject(e);
                }
            });
        },
        onSuccess: (data, variables) => {
            // Invalidate messages query to force refetch
            queryClient.invalidateQueries(['dm-messages', variables.senderId, variables.receiverId]);
            queryClient.invalidateQueries(['conversations']);
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
        mutationFn: async ({ communityId, userId, text }) => {
            return new Promise((resolve, reject) => {
                try {
                    // Correct method name from sendCommunityMessage to sendMessage
                    // And typically community message payload needs communityId, userId, message (text)
                    // socket.js sendMessage takes 'data'.
                    // Let's see what socket.js sendMessage expects... it emits 'send-message' with data.
                    // Backend likely expects { communityId, userId, message }
                    socketService.sendMessage({ communityId, userId, message: text });
                    resolve({ success: true });
                } catch (e) {
                    reject(e);
                }
            });
        }
    });

    const deleteCommunityMessage = useMutation({
        mutationFn: async ({ communityId, messageId }) => {
            return await communityApi.deleteMessage(communityId, messageId);
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(['community-messages', variables.communityId]);
        }
    });

    const deleteMultipleCommunityMessages = useMutation({
        mutationFn: async ({ communityId, messageIds }) => {
            return await communityApi.deleteMultipleMessages(communityId, messageIds);
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(['community-messages', variables.communityId]);
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

