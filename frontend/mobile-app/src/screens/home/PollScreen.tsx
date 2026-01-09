import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getActivePolls, votePoll, Poll } from '../../services/pollService';

import SkeletonLoader from '../../components/SkeletonLoader';

export default function PollScreen() {
    const queryClient = useQueryClient();
    const { data: polls, isLoading } = useQuery({
        queryKey: ['polls'],
        queryFn: getActivePolls,
    });

    const mutation = useMutation({
        mutationFn: ({ pollId, optionId }: { pollId: number; optionId: number }) => votePoll(pollId, optionId),
        onSuccess: () => {
            Alert.alert('Voted!', 'Your vote has been counted.');
            queryClient.invalidateQueries({ queryKey: ['polls'] });
        },
        onError: (err: any) => Alert.alert('Error', err.response?.data?.message || 'Vote failed')
    });

    const handleVote = (pollId: number, optionId: number) => {
        mutation.mutate({ pollId, optionId });
    };

    const PollSkeleton = () => (
        <View className="flex-1 bg-gray-50 pt-12 px-5">
            <SkeletonLoader width={150} height={28} style={{ marginBottom: 24 }} />

            {[1, 2].map(key => (
                <View key={key} className="bg-white p-5 rounded-xl mb-4 shadow-sm border border-gray-100">
                    <SkeletonLoader width="90%" height={24} style={{ marginBottom: 8 }} />
                    <SkeletonLoader width="40%" height={14} style={{ marginBottom: 16 }} />

                    <SkeletonLoader width="100%" height={48} borderRadius={8} style={{ marginBottom: 8 }} />
                    <SkeletonLoader width="100%" height={48} borderRadius={8} style={{ marginBottom: 8 }} />
                </View>
            ))}
        </View>
    );

    const renderPoll = ({ item }: { item: Poll }) => (
        <View className="bg-white p-5 rounded-xl mb-4 shadow-sm border border-gray-100">
            <Text className="text-lg font-bold text-gray-900 mb-2">{item.title}</Text>
            <Text className="text-gray-400 text-xs mb-4">
                Expires: {(item.end_date || item.expires_at) ? new Date(item.end_date || item.expires_at!).toLocaleDateString() : 'No expiry'}
            </Text>

            {item.options.map(opt => (
                <TouchableOpacity
                    key={opt.id}
                    onPress={() => handleVote(item.id, opt.id)}
                    className="bg-gray-50 p-3 rounded-lg mb-2 border border-blue-100 flex-row justify-between items-center active:bg-blue-50"
                >
                    <Text className="text-gray-700 font-medium">{opt.text}</Text>
                    {/* Show votes only if previously voted or backend sends it. For now showing simple count if available */}
                    <Text className="text-gray-400 text-xs">{opt.votes} votes</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    if (isLoading && !polls) {
        return <PollSkeleton />;
    }

    return (
        <View className="flex-1 bg-gray-50 pt-12 px-5">
            <Text className="text-2xl font-bold text-gray-900 mb-6">Active Polls</Text>
            <FlatList
                data={polls}
                renderItem={renderPoll}
                keyExtractor={item => item.id.toString()}
                ListEmptyComponent={!isLoading ? <Text className="text-center text-gray-400 mt-10">No active polls.</Text> : null}
            />
        </View>
    );
}
