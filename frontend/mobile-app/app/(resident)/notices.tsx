import React from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getAnnouncements } from '../../src/api/announcements/announcements.api';
import { Ionicons } from '@expo/vector-icons';

export default function NoticesScreen() {
    const { data: list, isLoading } = useQuery({
        queryKey: ['announcements'],
        queryFn: getAnnouncements,
    });

    const renderItem = ({ item }: { item: any }) => (
        <View className="bg-white p-5 rounded-xl mb-4 shadow-sm border border-slate-100">
            <View className="flex-row justify-between mb-2">
                <View className="bg-indigo-50 px-2 py-1 rounded">
                    <Text className="text-indigo-600 text-xs font-bold uppercase">{item.type}</Text>
                </View>
                <Text className="text-slate-400 text-xs">{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
            <Text className="text-lg font-bold text-slate-900 mb-2">{item.title}</Text>
            <Text className="text-slate-600 leading-relaxed">{item.message}</Text>
            <View className="mt-3 pt-3 border-t border-slate-50">
                <Text className="text-slate-400 text-xs">Posted by {item.admin_name}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-50 px-4 pt-2">
            <Stack.Screen options={{ title: 'Notices Board', headerShadowVisible: false }} />

            {isLoading ? (
                <ActivityIndicator size="large" color="#4f46e5" className="mt-10" />
            ) : (
                <FlatList
                    data={list}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                        <View className="items-center mt-20">
                            <Ionicons name="notifications-off-outline" size={48} color="#cbd5e1" />
                            <Text className="text-slate-400 mt-2">No active notices</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
