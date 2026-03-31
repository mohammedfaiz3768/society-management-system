import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { getNotifications } from '../../../src/api/notifications/notifications.api';
import { apiClient } from '../../../src/api/client';

interface ResidentStats {
    complaints_open: number;
    services_open: number;
    today_visitors: number;
    notifications_unread: number;
    latest_announcements: { id: number; title: string; message: string; created_at: string }[];
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export default function HomeScreen() {
    const router = useRouter();
    const { user, logout } = useAuthStore();

    const { data: stats } = useQuery<ResidentStats>({
        queryKey: ['resident-stats'],
        queryFn: async () => {
            const res = await apiClient.get('/dashboard/resident-stats');
            return res.data;
        },
        staleTime: 60000,
    });

    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications'],
        queryFn: getNotifications,
    });

    const unreadCount = notifications.filter((n: any) => !n.is_read).length;

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => {
                        logout();
                        router.replace('/(auth)/login');
                    }
                }
            ]
        );
    };

    const quickActions = [
        { name: 'Visitors', icon: 'people-outline', route: '/(resident)/(tabs)/gate', color: '#06B6D4', bg: 'bg-cyan-50' },
        { name: 'Maintenance', icon: 'construct-outline', route: '/(resident)/maintenance', color: '#F59E0B', bg: 'bg-amber-50' },
        { name: 'Polls', icon: 'bar-chart-outline', route: '/(resident)/polls', color: '#14B8A6', bg: 'bg-teal-50' },
        { name: 'Complaints', icon: 'warning-outline', route: '/(resident)/complaints', color: '#EF4444', bg: 'bg-red-50' },
        { name: 'Directory', icon: 'book-outline', route: '/(resident)/directory', color: '#3B82F6', bg: 'bg-blue-50' },
        { name: 'Parking', icon: 'car-outline', route: '/(resident)/parking', color: '#64748B', bg: 'bg-slate-100' },
    ];

    const announcements = stats?.latest_announcements ?? [];

    return (
        <View className="flex-1 bg-slate-50">
            <LinearGradient
                colors={['#0f172a', '#334155']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="pt-12 pb-24 px-6 rounded-b-[40px]"
            >
                <View className="flex-row justify-between items-center mb-8">
                    <TouchableOpacity
                        onPress={() => router.push('/(resident)/profile')}
                        className="flex-row items-center bg-white/10 px-3 py-2 rounded-full border border-white/10"
                    >
                        <View className="w-8 h-8 rounded-full bg-indigo-500 items-center justify-center mr-3">
                            <Text className="text-white font-bold">{user?.name?.charAt(0)}</Text>
                        </View>
                        <View>
                            <Text className="text-white font-semibold text-sm">{user?.name}</Text>
                            <Text className="text-slate-300 text-xs">{(user as any)?.block || 'A'} - {user?.flat_number || '101'}</Text>
                        </View>
                    </TouchableOpacity>

                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            onPress={() => router.push('/(resident)/notifications')}
                            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/10 relative"
                        >
                            <Ionicons name="notifications-outline" size={20} color="white" />
                            {unreadCount > 0 && (
                                <View className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0f172a]" />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleLogout}
                            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/10"
                        >
                            <Ionicons name="log-out-outline" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View>
                    <Text className="text-slate-400 text-sm mb-1 uppercase tracking-wider">Dashboard</Text>
                    <Text className="text-3xl font-bold text-white">Overview</Text>
                </View>
            </LinearGradient>

            <ScrollView
                className="flex-1 -mt-16 px-6"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Stats Row */}
                <View className="flex-row gap-4 mb-6">
                    <TouchableOpacity
                        onPress={() => router.push('/(resident)/complaints')}
                        className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 items-center"
                    >
                        <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mb-2">
                            <Ionicons name="warning-outline" size={20} color="#F97316" />
                        </View>
                        <Text className="text-2xl font-bold text-slate-900">
                            {stats?.complaints_open ?? '—'}
                        </Text>
                        <Text className="text-xs text-slate-500 font-medium text-center">Open Complaints</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => router.push('/(resident)/(tabs)/gate')}
                        className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 items-center"
                    >
                        <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mb-2">
                            <Ionicons name="people-outline" size={20} color="#3B82F6" />
                        </View>
                        <Text className="text-2xl font-bold text-slate-900">
                            {stats?.today_visitors ?? '—'}
                        </Text>
                        <Text className="text-xs text-slate-500 font-medium text-center">Visitors Today</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => router.push('/(resident)/notifications')}
                        className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 items-center"
                    >
                        <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mb-2">
                            <Ionicons name="notifications-outline" size={20} color="#8B5CF6" />
                        </View>
                        <Text className="text-2xl font-bold text-slate-900">
                            {stats?.notifications_unread ?? '—'}
                        </Text>
                        <Text className="text-xs text-slate-500 font-medium text-center">Unread Alerts</Text>
                    </TouchableOpacity>
                </View>

                {/* SOS Card */}
                <TouchableOpacity
                    onPress={() => router.push('/(resident)/sos')}
                    activeOpacity={0.9}
                    className="mb-8 overflow-hidden rounded-2xl shadow-lg shadow-red-500/30"
                >
                    <LinearGradient
                        colors={['#EF4444', '#DC2626']}
                        className="p-5 flex-row items-center"
                    >
                        <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-4">
                            <Ionicons name="alert-circle" size={28} color="white" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-white text-lg font-bold">Emergency SOS</Text>
                            <Text className="text-red-100 text-sm">Tap to open emergency panel</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="white" style={{ opacity: 0.8 }} />
                    </LinearGradient>
                </TouchableOpacity>

                {/* Quick Actions */}
                <View className="mb-8">
                    <Text className="text-lg font-bold text-slate-900 mb-4">Quick Actions</Text>
                    <View className="flex-row flex-wrap justify-between">
                        {quickActions.map((action, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => router.push(action.route as any)}
                                className="w-[48%] bg-white p-4 rounded-2xl mb-4 border border-slate-100 shadow-sm flex-row items-center"
                            >
                                <View className={`w-10 h-10 ${action.bg} rounded-full items-center justify-center mr-3`}>
                                    <Ionicons name={action.icon as any} size={20} color={action.color} />
                                </View>
                                <Text className="font-semibold text-slate-700 flex-1" numberOfLines={1}>{action.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Community Board */}
                <View>
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-bold text-slate-900">Community Board</Text>
                        <TouchableOpacity onPress={() => router.push('/(resident)/notices')}>
                            <Text className="text-indigo-600 font-semibold text-sm">View All</Text>
                        </TouchableOpacity>
                    </View>

                    {announcements.length === 0 ? (
                        <View className="bg-white p-6 rounded-2xl border border-dashed border-slate-300 items-center justify-center py-8">
                            <View className="w-12 h-12 bg-slate-50 rounded-full items-center justify-center mb-3">
                                <Ionicons name="notifications-off-outline" size={24} color="#94a3b8" />
                            </View>
                            <Text className="text-slate-400 font-medium">No new announcements</Text>
                        </View>
                    ) : (
                        <View className="gap-3">
                            {announcements.map((item) => (
                                <View
                                    key={item.id}
                                    className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"
                                >
                                    <Text className="text-slate-900 font-semibold text-sm mb-1" numberOfLines={1}>
                                        {item.title}
                                    </Text>
                                    <Text className="text-slate-500 text-xs leading-5" numberOfLines={2}>
                                        {item.message}
                                    </Text>
                                    <Text className="text-slate-400 text-xs mt-2">{timeAgo(item.created_at)}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
