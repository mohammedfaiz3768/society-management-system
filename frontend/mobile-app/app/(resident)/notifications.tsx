import React from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsRead,
    NotificationItem,
} from '../../src/api/notifications/notifications.api';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen() {
    const queryClient = useQueryClient();

    const { data: notifications, isLoading, refetch } = useQuery({
        queryKey: ['notifications'],
        queryFn: getNotifications,
    });

    const readMutation = useMutation({
        mutationFn: markNotificationAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const readAllMutation = useMutation({
        mutationFn: markAllNotificationsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const handlePress = (item: NotificationItem) => {
        if (!item.is_read) {
            readMutation.mutate(item.id);
        }
    };

    const unreadCount = notifications?.filter(n => !n.is_read).length ?? 0;

    const renderItem = ({ item }: { item: NotificationItem }) => (
        <TouchableOpacity
            onPress={() => handlePress(item)}
            className={`flex-row p-4 border-b border-slate-100 ${item.is_read ? 'bg-white' : 'bg-indigo-50'}`}
        >
            <View className={`h-10 w-10 rounded-full items-center justify-center mr-3 flex-shrink-0 ${item.is_read ? 'bg-slate-100' : 'bg-indigo-100'}`}>
                <Ionicons
                    name={item.type === 'alert' ? 'alert' : 'notifications'}
                    size={20}
                    color={item.is_read ? '#94a3b8' : '#4f46e5'}
                />
            </View>
            <View className="flex-1">
                <View className="flex-row justify-between mb-1">
                    <Text className={`text-sm font-bold flex-1 mr-2 ${item.is_read ? 'text-slate-700' : 'text-slate-900'}`}>
                        {item.title}
                    </Text>
                    <Text className="text-xs text-slate-400 flex-shrink-0">
                        {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </View>
                <Text
                    className={`text-sm ${item.is_read ? 'text-slate-500' : 'text-slate-800'}`}
                    numberOfLines={2}
                >
                    {item.message}
                </Text>
            </View>
            {!item.is_read && (
                <View className="w-2 h-2 rounded-full bg-indigo-500 mt-1 ml-2 flex-shrink-0" />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-white">
            <Stack.Screen options={{ title: 'Notifications', headerShadowVisible: false }} />

            {unreadCount > 0 && (
                <View className="flex-row justify-between items-center px-4 py-2 border-b border-slate-100">
                    <Text className="text-sm text-slate-500">{unreadCount} unread</Text>
                    <TouchableOpacity
                        onPress={() => readAllMutation.mutate()}
                        disabled={readAllMutation.isPending}
                    >
                        <Text className="text-sm text-indigo-600 font-semibold">
                            {readAllMutation.isPending ? 'Marking...' : 'Mark all read'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={{ flexGrow: 1 }}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
                ListEmptyComponent={
                    <View className="items-center justify-center flex-1 mt-20">
                        <Ionicons name="notifications-off-outline" size={64} color="#e2e8f0" />
                        <Text className="text-slate-400 mt-4 text-lg">No notifications</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}
