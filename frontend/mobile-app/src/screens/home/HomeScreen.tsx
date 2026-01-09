import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getResidentStats } from '../../services/residentDashboardService';
import { triggerSOS } from '../../services/sosService';
import HomeSkeleton from './HomeSkeleton';

export default function HomeScreen({ navigation }: any) {
    const { user } = useAuthStore();

    const { data: stats, isLoading, refetch } = useQuery({
        queryKey: ['resident-stats'],
        queryFn: getResidentStats,
    });

    const handleSOS = async () => {
        Alert.alert("CONFIRM SOS", "Are you sure? This will alert all guards.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "YES, HELP!", style: "destructive", onPress: async () => {
                    try {
                        await triggerSOS();
                        Alert.alert("ALARM SENT", "Guards have been notified!");
                    } catch (e) {
                        Alert.alert("Failed", "Could not send SOS");
                    }
                }
            }
        ]);
    };

    if (isLoading && !stats) {
        return <HomeSkeleton />;
    }

    const notices = stats?.latest_announcements || [];

    return (
        <View className="flex-1 bg-gray-100 dark:bg-gray-900">
            {/* Header */}
            <View className="bg-white dark:bg-gray-800 px-6 pt-12 pb-6 rounded-b-[30px] shadow-sm z-10">
                <View className="flex-row justify-between items-center mb-4">
                    <View>
                        <Text className="text-gray-500 dark:text-gray-400 text-sm font-medium">Welcome Back,</Text>
                        <Text className="text-gray-900 dark:text-white text-2xl font-bold">{user?.name}</Text>
                        {stats?.flat && (
                            <Text className="text-indigo-600 dark:text-indigo-400 text-xs font-bold mt-1">
                                {stats.flat.block} - {stats.flat.flat_number}
                            </Text>
                        )}
                    </View>
                    <TouchableOpacity className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full relative">
                        <Ionicons name="notifications-outline" size={24} color={user ? '#4F46E5' : '#6B7280'} />
                        {(stats?.notifications_unread ?? 0) > 0 && (
                            <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-gray-800" />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Quick Stats Row */}
                <View className="flex-row justify-between mt-2">
                    <View className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl flex-1 mr-2 items-center">
                        <Text className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold">Complaints</Text>
                        <Text className={`text-xl font-bold ${(stats?.complaints_open ?? 0) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {stats?.complaints_open || 0}
                        </Text>
                    </View>
                    <View className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl flex-1 mx-2 items-center">
                        <Text className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold">Visitors</Text>
                        <Text className="text-xl font-bold text-gray-900 dark:text-white">{stats?.today_visitors || 0}</Text>
                    </View>
                    <View className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl flex-1 ml-2 items-center">
                        <Text className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold">Services</Text>
                        <Text className="text-xl font-bold text-indigo-500">{stats?.services_open || 0}</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                className="flex-1 px-6 pt-6"
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#4F46E5" />}
            >
                {/* Emergency SOS */}
                <TouchableOpacity onPress={handleSOS} className="bg-red-500 rounded-2xl p-4 flex-row items-center justify-center mb-8 shadow-lg shadow-red-200">
                    <View className="bg-white/20 p-2 rounded-full mr-3">
                        <Ionicons name="warning" size={24} color="white" />
                    </View>
                    <View>
                        <Text className="text-white font-bold text-lg">Emergency SOS</Text>
                        <Text className="text-red-100 text-xs">Tap for immediate assistance</Text>
                    </View>
                </TouchableOpacity>

                {/* Quick Actions Grid */}
                <Text className="text-gray-900 dark:text-white text-lg font-bold mb-4">Quick Actions</Text>
                <View className="flex-row justify-between flex-wrap mb-6">
                    <TouchableOpacity onPress={() => navigation.navigate('Visitors')} className="w-[48%] bg-white dark:bg-gray-800 p-4 rounded-xl mb-4 shadow-sm items-center">
                        <View className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-full mb-2">
                            <Ionicons name="people" size={24} color="#4F46E5" />
                        </View>
                        <Text className="text-gray-900 dark:text-white font-semibold">Visitors</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Payments')} className="w-[48%] bg-white dark:bg-gray-800 p-4 rounded-xl mb-4 shadow-sm items-center">
                        <View className="bg-green-100 dark:bg-green-900 p-3 rounded-full mb-2">
                            <Ionicons name="card" size={24} color="#10B981" />
                        </View>
                        <Text className="text-gray-900 dark:text-white font-semibold">Payments</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Polls')} className="w-[48%] bg-white dark:bg-gray-800 p-4 rounded-xl mb-4 shadow-sm items-center">
                        <View className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full mb-2">
                            <Ionicons name="stats-chart" size={24} color="#8B5CF6" />
                        </View>
                        <Text className="text-gray-900 dark:text-white font-semibold">Polls</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Events')} className="w-[48%] bg-white dark:bg-gray-800 p-4 rounded-xl mb-4 shadow-sm items-center">
                        <View className="bg-pink-100 dark:bg-pink-900 p-3 rounded-full mb-2">
                            <Ionicons name="calendar" size={24} color="#EC4899" />
                        </View>
                        <Text className="text-gray-900 dark:text-white font-semibold">Events</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Complaints')} className="w-[48%] bg-white dark:bg-gray-800 p-4 rounded-xl mb-4 shadow-sm items-center">
                        <View className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full mb-2">
                            <Ionicons name="alert-circle" size={24} color="#F59E0B" />
                        </View>
                        <Text className="text-gray-900 dark:text-white font-semibold">Issues</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Directory')} className="w-[48%] bg-white dark:bg-gray-800 p-4 rounded-xl mb-4 shadow-sm items-center">
                        <View className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mb-2">
                            <Ionicons name="book" size={24} color="#3B82F6" />
                        </View>
                        <Text className="text-gray-900 dark:text-white font-semibold">Directory</Text>
                    </TouchableOpacity>
                </View>

                {/* Recent Notices */}
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-gray-900 dark:text-white text-lg font-bold">Community Board</Text>
                    <TouchableOpacity>
                        <Text className="text-indigo-600 dark:text-indigo-400 font-semibold">View All</Text>
                    </TouchableOpacity>
                </View>

                {(!notices || notices.length === 0) ? (
                    <View className="bg-white dark:bg-gray-800 p-6 rounded-xl items-center mb-20">
                        <Ionicons name="notifications-off-outline" size={48} color="#9CA3AF" />
                        <Text className="text-gray-400 mt-2">No active notices</Text>
                    </View>
                ) : (
                    notices.map((notice: any) => (
                        <View key={notice.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl mb-4 border-l-4 border-indigo-500 shadow-sm">
                            <View className="flex-row justify-between items-start mb-2">
                                <Text className="text-gray-900 dark:text-white font-bold text-base flex-1 mr-2">{notice.title}</Text>
                                <Text className="text-gray-400 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                    {new Date(notice.created_at).toLocaleDateString()}
                                </Text>
                            </View>
                            <Text className="text-gray-500 dark:text-gray-400 text-sm leading-5" numberOfLines={2}>
                                {notice.body}
                            </Text>
                        </View>
                    ))
                )}
                <View className="h-24" />
            </ScrollView>
        </View>
    );
}
