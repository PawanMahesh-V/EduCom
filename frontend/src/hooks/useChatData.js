import { useQuery } from '@tanstack/react-query';
import directMessageApi from '../api/directMessages';
import communityApi from '../api/communities';

// --- Direct Messages ---

export const useConversations = (userId) => {
    return useQuery({
        queryKey: ['conversations', userId],
        queryFn: async () => {
            if (!userId) return [];
            const convs = await directMessageApi.getConversations(userId);
            console.log('[useConversations] Fetched conversations:', convs.length);
            return convs;
        },
        enabled: !!userId,
        staleTime: 10 * 1000, // 10 seconds for conversation list
        refetchOnMount: true,
        refetchOnWindowFocus: false,
    });
};

export const useDMMessages = (userId, otherUserId) => {
    return useQuery({
        queryKey: ['dm-messages', userId, otherUserId],
        queryFn: async () => {
            if (!userId || !otherUserId) return [];
            const messages = await directMessageApi.getMessages(userId, otherUserId);
            console.log('[useDMMessages] Fetched messages:', messages.length);
            return messages;
        },
        enabled: !!userId && !!otherUserId,
        staleTime: 0, // Always consider data stale for real-time updates
        refetchOnMount: true,
        refetchOnWindowFocus: false,
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
            // Logic extracted from original MessageLayout to fetch based on role
            if (!role || !userId) return [];
            if (role === 'Student') return await communityApi.getStudentCommunities(userId);
            if (role === 'Teacher') return await communityApi.getTeacherCommunities(userId);
            if (role === 'HOD') return await communityApi.getHodCommunities(userId);
            if (role === 'Admin') return await communityApi.getAll();
            // PM maps to PM communities if api exists, or maybe generic getAll?
            // Assuming similar pattern or generic
            return [];
        },
        enabled: !!role && !!userId,
        staleTime: 60 * 1000,
    });
};

export const useCommunityMessages = (communityId, userId) => {
    return useQuery({
        queryKey: ['community-messages', communityId],
        queryFn: async () => {
            if (!communityId) return [];
            const messages = await communityApi.getMessages(communityId, userId);
            console.log('[useCommunityMessages] Fetched messages:', messages.length);
            return messages;
        },
        enabled: !!communityId,
        staleTime: 0, // Always consider data stale for real-time updates
        refetchOnMount: true,
        refetchOnWindowFocus: false,
    });
};
