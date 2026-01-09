import React from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markNotificationAsRead, deleteNotification, NotificationItem } from '../../src/api/notifications/notifications.api';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data: notifications, isLoading, refetch } = useQuery({
        queryKey: ['notifications'],
        queryFn: getNotifications,
    });

    const readMutation = useMutation({
        mutationFn: markNotificationAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteNotification,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    const handlePress = (item: NotificationItem) => {
        if (!item.read) {
            readMutation.mutate(item.id);
        }
        // Navigate based on type if needed, e.g. router.push(...)
    };

    const handleDelete = (id: number) => {
        deleteMutation.mutate(id);
    };

    const renderItem = ({ item }: { item: NotificationItem }) => (
        <TouchableOpacity
            onPress={() => handlePress(item)}
            className={`flex-row p-4 border-b border-slate-100 ${item.read ? 'bg-white' : 'bg-indigo-50'}`}
        >
            <View className={`h-10 w-10 rounded-full items-center justify-center mr-3 ${item.read ? 'bg-slate-100' : 'bg-indigo-100'}`}>
                <Ionicons
                    name={item.type === 'alert' ? 'alert' : 'notifications'}
                    size={20}
                    color={item.read ? '#94a3b8' : '#4f46e5'}
                />
            </View>
            <View className="flex-1">
                <View className="flex-row justify-between mb-1">
                    <Text className={`text-sm font-bold ${item.read ? 'text-slate-700' : 'text-slate-900'}`}>{item.title}</Text>
                    <Text className="text-xs text-slate-400">{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
                <Text className={`text-sm ${item.read ? 'text-slate-500' : 'text-slate-800'}`} numberOfLines={2}>
                    {item.message}
                </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)} className="pl-2 justify-center">
                <Ionicons name="close-circle-outline" size={20} color="#cbd5e1" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-white">
            <Stack.Screen options={{ title: 'Notifications', headerShadowVisible: false }} />

            {/* Header / Filter could go here */}

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
