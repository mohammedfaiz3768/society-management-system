import React from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { getGatePasses } from '../../../src/api/gatepass/gatepass.api';
import { Ionicons } from '@expo/vector-icons';

export default function GuardQueueScreen() {
    const router = useRouter();
    const { data: passes, isLoading, refetch } = useQuery({
        queryKey: ['gate-passes', 'queue'],
        queryFn: () => getGatePasses(),
        refetchInterval: 30000,
    });

    // Only PENDING passes are waiting to be processed
    const activePasses = passes?.filter(p => p.status === 'PENDING') ?? [];

    const renderItem = ({ item }: { item: any }) => (
        <View className="bg-white p-4 rounded-xl mb-3 border border-gray-100 shadow-sm">
            <View className="flex-row justify-between mb-1">
                <Text className="font-bold text-gray-900 text-base">{item.visitor_name}</Text>
                <View className="px-2 py-1 rounded bg-yellow-100">
                    <Text className="text-xs font-bold uppercase text-yellow-700">
                        PENDING
                    </Text>
                </View>
            </View>
            <Text className="text-gray-600 text-sm mb-1">
                {item.purpose || 'No purpose specified'} • {item.visitor_phone || 'No Phone'}
            </Text>
            {item.vehicle_number && (
                <Text className="text-gray-500 text-xs">🚗 {item.vehicle_number}</Text>
            )}
            {item.number_of_people > 1 && (
                <Text className="text-gray-500 text-xs">👥 {item.number_of_people} people</Text>
            )}
            <Text className="text-gray-400 text-xs mt-2">
                Valid until: {new Date(item.valid_until).toLocaleString()}
            </Text>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50 px-4 pt-4">
            <View className="mb-6 flex-row justify-between items-center">
                <View>
                    <Text className="text-2xl font-bold text-gray-900">Pending Queue</Text>
                    <Text className="text-gray-500">Gate passes awaiting entry approval</Text>
                </View>
                <TouchableOpacity
                    onPress={() => router.push('/(guard)/delivery-entry')}
                    className="bg-indigo-100 p-3 rounded-full"
                >
                    <Ionicons name="cube-outline" size={24} color="#4f46e5" />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color="#0f172a" />
            ) : (
                <FlatList
                    data={activePasses}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    refreshControl={
                        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
                    }
                    ListEmptyComponent={
                        <View className="py-10 items-center">
                            <Ionicons name="checkmark-circle-outline" size={48} color="#86efac" />
                            <Text className="text-gray-400 mt-3 text-base font-medium">All clear!</Text>
                            <Text className="text-gray-400 text-sm">No pending gate passes</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
