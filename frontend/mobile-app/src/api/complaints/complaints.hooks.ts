import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createComplaint, getMyComplaints, CreateComplaintData } from './complaints.api';

export const useCreateComplaint = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createComplaint,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['complaints'] });
        },
    });
};

export const useMyComplaints = () => {
    return useQuery({
        queryKey: ['complaints'],
        queryFn: getMyComplaints,
    });
};
