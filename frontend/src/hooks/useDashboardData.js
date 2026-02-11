import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api';

export const useDashboardData = (role) => {
    return useQuery({
        queryKey: ['adminProfile'],
        queryFn: async () => {
            const data = await authApi.getCurrentUser();
            return data.user || data;
        },
        enabled: role === 'admin',
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
    });
};
