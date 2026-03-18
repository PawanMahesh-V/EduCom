import { useMutation, useQueryClient } from '@tanstack/react-query';
import directMessageApi from '../api/directMessages';
import communityApi from '../api/communities';
import { useSocket } from '../context/SocketContext';

export const useChatMutations = () => {
    const queryClient = useQueryClient();
    const { socketService } = useSocket();

    // --- Direct Messages ---

    const sendDM = useMutation({
        mutationFn: async ({ senderId, receiverId, message, senderName, isAnonymous, clientMessageId }) => {
            return new Promise((resolve, reject) => {
                try {
                    // Correct payload structure matching useSocket.js
                    socketService.sendDirectMessage({
                        senderId,
                        receiverId,
                        message, // Changed from text to message
                        senderName,
                        isAnonymous,
                        clientMessageId
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
        mutationFn: async ({ communityId, userId, text, senderName, clientMessageId }) => {
            return new Promise((resolve, reject) => {
                try {
                    socketService.sendMessage({
                        communityId,
                        senderId: userId,
                        senderName,
                        message: text,
                        clientMessageId
                    });
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

