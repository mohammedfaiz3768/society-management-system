import React from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getGatePasses } from '../../../src/api/gatepass/gatepass.api';

export default function GuardLogScreen() {
    const { data: passes, isLoading, refetch } = useQuery({
        queryKey: ['gate-passes', 'history'],
        queryFn: () => getGatePasses(), // In a real app, filtering by date/status would improve performance
    });

    // Filter for completed/entered passes
    const history = passes?.filter(p => ['ENTERED', 'EXITED'].includes(p.status)) || [];

    const renderItem = ({ item }: { item: any }) => (
        <View className="bg-white p-4 rounded-xl mb-3 border border-gray-100 shadow-sm">
            <View className="flex-row justify-between mb-1">
                <Text className="font-bold text-gray-900 text-base">{item.guest_name}</Text>
                <View className={`px-2 py-1 rounded ${item.status === 'ENTERED' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                    <Text className={`text-xs font-bold uppercase ${item.status === 'ENTERED' ? 'text-blue-700' : 'text-gray-600'
                        }`}>
                        {item.status}
                    </Text>
                </View>
            </View>
            <Text className="text-gray-600 text-sm mb-1">{item.type} • {item.guest_phone || 'No Phone'}</Text>
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
                            <Text className="text-gray-400">No activity recorded</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
