import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getActivePolls, votePoll } from '../../src/api/polls/polls.api';
import { Ionicons } from '@expo/vector-icons';

export default function PollsScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data: polls, isLoading, error } = useQuery({
        queryKey: ['polls'],
        queryFn: getActivePolls,
        retry: 1,
    });

    const voteMutation = useMutation({
        mutationFn: ({ pollId, optionId }: { pollId: number; optionId: number }) =>
            votePoll(pollId, optionId),
        onSuccess: () => {
            Alert.alert("Success", "Vote submitted!");
            queryClient.invalidateQueries({ queryKey: ['polls'] });
        },
        onError: (err: any) => {
            Alert.alert("Error", err.message || "Failed to vote");
        }
    });

    const handleVote = (pollId: number, optionId: number) => {
        voteMutation.mutate({ pollId, optionId });
    };

    const renderPoll = ({ item }: { item: any }) => {
        const totalVotes = item.options.reduce((sum: number, opt: any) => sum + Number(opt.votes), 0);

        return (
            <View className="bg-white p-4 rounded-xl mb-4 shadow-sm border border-slate-100">
                <Text className="text-lg font-bold text-slate-900 mb-3">{item.question}</Text>

                <View className="space-y-3">
                    {item.options.map((opt: any) => {
                        const percent = totalVotes > 0 ? Math.round((Number(opt.votes) / totalVotes) * 100) : 0;
                        return (
                            <TouchableOpacity
                                key={opt.id}
                                disabled={voteMutation.isPending}
                                onPress={() => handleVote(item.id, opt.id)}
                                className="relative overflow-hidden rounded-lg bg-slate-50 border border-slate-200 p-3"
                            >
                                <View
                                    className="absolute top-0 bottom-0 left-0 bg-blue-100 opacity-50"
                                    style={{ width: `${percent}%` }}
                                />
                                <View className="flex-row justify-between relative z-10">
                                    <Text className="font-semibold text-slate-700">{opt.text}</Text>
                                    <Text className="text-slate-500">{percent}%</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
                <View className="mt-3 flex-row justify-between items-center">
                    <Text className="text-xs text-slate-400">Total Votes: {totalVotes}</Text>
                    {item.closes_at && (
                        <Text className="text-xs text-slate-400">
                            Closes: {new Date(item.closes_at).toLocaleDateString()}
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <Stack.Screen options={{ title: 'Community Polls', headerShadowVisible: false }} />

            <View className="px-4 py-2">
                {isLoading ? (
                    <View className="items-center mt-10">
                        <ActivityIndicator size="large" color="#0f172a" />
                        <Text className="text-slate-500 mt-4">Loading polls...</Text>
                    </View>
                ) : error ? (
                    <View className="items-center mt-10 px-6">
                        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
                        <Text className="text-slate-900 font-bold text-lg mt-4 text-center">Unable to Load</Text>
                        <Text className="text-slate-500 mt-2 text-center">
                            Polls module not available. Please contact admin.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={polls}
                        renderItem={renderPoll}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        ListEmptyComponent={
                            <View className="items-center justify-center mt-20">
                                <Ionicons name="stats-chart-outline" size={48} color="#cbd5e1" />
                                <Text className="text-slate-400 mt-2">No active polls</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
