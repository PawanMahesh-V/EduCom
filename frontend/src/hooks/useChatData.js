import { useQuery } from '@tanstack/react-query';
import directMessageApi from '../api/directMessages';
import communityApi from '../api/communities';

// --- Direct Messages ---

export const useConversations = (userId) => {
    return useQuery({
        queryKey: ['conversations', userId],
        queryFn: async () => {
            if (!userId) return [];
            return await directMessageApi.getConversations(userId);
        },
        enabled: !!userId,
        staleTime: 0,
    });
};

export const useDMMessages = (userId, otherUserId) => {
    return useQuery({
        queryKey: ['dm-messages', userId, otherUserId],
        queryFn: async () => {
            if (!userId || !otherUserId) return [];
            return await directMessageApi.getMessages(userId, otherUserId);
        },
        enabled: !!userId && !!otherUserId,
        staleTime: 0,
    });
};

export const useAvailableUsers = (userId) => {
    return useQuery({
        queryKey: ['available-users', userId],
        queryFn: async () => {
            if (!userId) return [];
            return await directMessageApi.getUsers(userId);
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

// --- Community Chats ---

export const useCommunities = (role, userId) => {
    return useQuery({
        queryKey: ['communities', role, userId],
        queryFn: async () => {
            if (!role || !userId) return [];
            if (role === 'Student') return await communityApi.getStudentCommunities(userId);
            if (role === 'Teacher' || role === 'PM') return await communityApi.getTeacherCommunities(userId);
            if (role === 'HOD') return await communityApi.getHodCommunities(userId);
            if (role === 'Admin') {
                const res = await communityApi.getAll();
                return res?.communities || res || [];
            }
            return [];
        },
        enabled: !!role && !!userId,
        staleTime: 0,
    });
};

export const useCommunityMessages = (communityId, userId) => {
    return useQuery({
        queryKey: ['community-messages', communityId],
        queryFn: async () => {
            if (!communityId) return [];
            return await communityApi.getMessages(communityId, userId);
        },
        enabled: !!communityId,
        staleTime: 0,
    });
};
