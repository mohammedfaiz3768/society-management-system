import React from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getMyTimeline } from '../../src/api/timeline/timeline.api';
import { Ionicons } from '@expo/vector-icons';

export default function TimelineScreen() {
    const { data: activities, isLoading } = useQuery({
        queryKey: ['timeline'],
        queryFn: getMyTimeline,
    });

    const renderItem = ({ item }: { item: any }) => (
        <View className="bg-white p-4 rounded-xl mb-3 shadow-sm border border-slate-100 flex-row">
            <View className="mr-3 mt-1">
                <View className="w-2 h-2 rounded-full bg-blue-500" />
                <View className="w-0.5 bg-slate-200 flex-1 ml-[3px] mt-1" />
            </View>
            <View className="flex-1 pb-4">
                <Text className="font-bold text-slate-800 text-base">{item.title}</Text>
                <Text className="text-slate-500 text-sm mt-0.5">{item.description}</Text>
                <Text className="text-slate-400 text-xs mt-2">
                    {new Date(item.created_at).toLocaleString()}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-50 px-4 pt-2">
            <Stack.Screen options={{ title: 'My Activity', headerShadowVisible: false }} />

            {isLoading ? (
                <ActivityIndicator size="large" color="#3b82f6" className="mt-10" />
            ) : (
                <FlatList
                    data={activities}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                        <View className="items-center mt-20">
                            <Ionicons name="time-outline" size={48} color="#cbd5e1" />
                            <Text className="text-slate-400 mt-2">No recent activity</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
