import React, { useState } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGatePasses, markExit } from '../../../src/api/gatepass/gatepass.api';

export default function GuardLogScreen() {
    const queryClient = useQueryClient();
    const { data: passes, isLoading, refetch } = useQuery({
        queryKey: ['gate-passes', 'history'],
        queryFn: () => getGatePasses(),
    });

    const exitMutation = useMutation({
        mutationFn: (id: number) => markExit(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gate-passes'] });
        },
        onError: () => {
            Alert.alert('Error', 'Failed to mark exit. Please try again.');
        },
    });

    // Show passes that have had activity (entered or exited)
    const history = passes?.filter(p => p.status === 'ENTERED' || p.status === 'EXITED') ?? [];

    const renderItem = ({ item }: { item: any }) => (
        <View className="bg-white p-4 rounded-xl mb-3 border border-gray-100 shadow-sm">
            <View className="flex-row justify-between mb-1">
                <Text className="font-bold text-gray-900 text-base">{item.visitor_name}</Text>
                <View className={`px-2 py-1 rounded ${item.status === 'ENTERED' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Text className={`text-xs font-bold uppercase ${item.status === 'ENTERED' ? 'text-blue-700' : 'text-gray-600'}`}>
                        {item.status}
                    </Text>
                </View>
            </View>
            <Text className="text-gray-600 text-sm mb-1">
                {item.purpose || 'No purpose'} • {item.visitor_phone || 'No Phone'}
            </Text>
            {item.vehicle_number ? (
                <Text className="text-gray-500 text-xs mb-1">🚗 {item.vehicle_number}</Text>
            ) : null}
            {item.entry_time && (
                <Text className="text-green-600 text-xs">
                    In: {new Date(item.entry_time).toLocaleTimeString()}
                </Text>
            )}
            {item.exit_time && (
                <Text className="text-red-500 text-xs">
                    Out: {new Date(item.exit_time).toLocaleTimeString()}
                </Text>
            )}
            {item.status === 'ENTERED' && (
                <TouchableOpacity
                    onPress={() => exitMutation.mutate(item.id)}
                    disabled={exitMutation.isPending}
                    className="mt-3 bg-red-500 py-2 rounded-lg items-center"
                >
                    <Text className="text-white text-sm font-bold">Mark Exit</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50 px-4 pt-4">
            <View className="mb-6">
                <Text className="text-2xl font-bold text-gray-900">Activity Log</Text>
                <Text className="text-gray-500">Recent entries and exits</Text>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color="#0f172a" />
            ) : (
                <FlatList
                    data={history}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    refreshControl={
                        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
                    }
                    ListEmptyComponent={
                        <View className="py-10 items-center">
                            <Text className="text-gray-400">No activity recorded today</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
