import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { getNotifications } from '../../../src/api/notifications/notifications.api';

export default function HomeScreen() {
    const router = useRouter();
    const { user, logout } = useAuthStore();

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

    const handleSOS = () => {
        Alert.alert(
            '🚨 Emergency SOS',
            'This will alert security and management. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send SOS', style: 'destructive', onPress: () => {
                        Alert.alert('SOS Sent', 'Help is on the way!');
                    }
                }
            ]
        );
    };

    const quickActions = [
        { name: 'Visitors', icon: 'people', route: '/(resident)/visitors', color: '#06B6D4' },
        { name: 'Maintenance', icon: 'construct', route: '/(resident)/maintenance', color: '#F59E0B' },
        { name: 'Polls', icon: 'bar-chart', route: '/(resident)/polls', color: '#14B8A6' },
        { name: 'Complaints', icon: 'warning', route: '/(resident)/complaints', color: '#EF4444' },
        { name: 'Directory', icon: 'book', route: '/(resident)/directory', color: '#3B82F6' },
        { name: 'Documents', icon: 'document-text', route: '/(resident)/documents', color: '#10B981' },
        { name: 'Parking', icon: 'car', route: '/(resident)/parking', color: '#64748B' },
        { name: 'Delivery', icon: 'cube', route: '/(resident)/delivery', color: '#EC4899' },
        { name: 'Activity', icon: 'calendar', route: '/(resident)/activity', color: '#0D9488' },
        { name: 'Family', icon: 'heart', route: '/(resident)/family', color: '#F43F5E' },
    ];

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header with Teal/Cyan Gradient */}
            <LinearGradient
                colors={['#0D9488', '#06B6D4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="px-6 pt-4 pb-8"
            >
                <View className="flex-row justify-between items-center mb-6">
                    <TouchableOpacity onPress={() => router.push('/(resident)/profile')}>
                        <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
                            <Ionicons name="person" size={24} color="white" />
                        </View>
                    </TouchableOpacity>

                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            onPress={() => router.push('/(resident)/notifications')}
                            className="relative"
                        >
                            <Ionicons name="notifications-outline" size={26} color="white" />
                            {unreadCount > 0 && (
                                <View className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center">
                                    <Text className="text-white text-xs font-bold">{unreadCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleLogout}>
                            <Ionicons name="log-out-outline" size={26} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                <Text className="text-white text-3xl font-bold mb-1">Welcome Back,</Text>
                <Text className="text-white/90 text-xl font-medium">{user?.name || 'Resident'}</Text>
                <Text className="text-white/70 text-sm mt-1">{(user as any)?.block || 'A'} - {user?.flat_number || '101'}</Text>
            </LinearGradient>

            {/* FIXED: Add contentContainerStyle for proper ScrollView layout */}
            <ScrollView
                className="flex-1 -mt-4"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
            >
                {/* Stats Cards */}
                <View className="px-6 mb-6">
                    <View className="flex-row gap-3">
                        <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                            <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mb-2">
                                <Ionicons name="warning" size={20} color="#F97316" />
                            </View>
                            <Text className="text-2xl font-bold text-gray-900">1</Text>
                            <Text className="text-gray-500 text-sm">Complaints</Text>
                        </View>

                        <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                            <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mb-2">
                                <Ionicons name="people" size={20} color="#3B82F6" />
                            </View>
                            <Text className="text-2xl font-bold text-gray-900">0</Text>
                            <Text className="text-gray-500 text-sm">Visitors</Text>
                        </View>

                        <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                            <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mb-2">
                                <Ionicons name="construct" size={20} color="#10B981" />
                            </View>
                            <Text className="text-2xl font-bold text-gray-900">0</Text>
                            <Text className="text-gray-500 text-sm">Services</Text>
                        </View>
                    </View>
                </View>

                {/* Emergency SOS Card */}
                <View className="px-6 mb-6">
                    <TouchableOpacity
                        onPress={handleSOS}
                        className="bg-red-500 rounded-2xl p-6 shadow-lg"
                    >
                        <View className="flex-row items-center">
                            <View className="w-14 h-14 bg-white/20 rounded-full items-center justify-center mr-4">
                                <Ionicons name="alert-circle" size={32} color="white" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white text-xl font-bold mb-1">Emergency SOS</Text>
                                <Text className="text-white/80 text-sm">Tap for immediate assistance</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Quick Actions */}
                <View className="px-6 mb-6">
                    <Text className="text-gray-900 text-lg font-bold mb-4">Quick Actions</Text>
                    {/* FIXED: Use flex-row flex-wrap instead of grid */}
                    <View className="flex-row flex-wrap -mx-1.5">
                        {quickActions.map((action) => (
                            <View key={action.name} className="w-1/2 px-1.5 mb-3">
                                <TouchableOpacity
                                    onPress={() => router.push(action.route as any)}
                                    className="bg-white rounded-2xl p-4 shadow-sm"
                                >
                                    <View
                                        className="w-12 h-12 rounded-xl items-center justify-center mb-3"
                                        style={{ backgroundColor: `${action.color}15` }}
                                    >
                                        <Ionicons name={action.icon as any} size={24} color={action.color} />
                                    </View>
                                    <Text className="text-gray-900 font-semibold text-base">{action.name}</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Community Board */}
                <View className="px-6 mb-6">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-gray-900 text-lg font-bold">Community Board</Text>
                        <TouchableOpacity onPress={() => router.push('/(resident)/notices')}>
                            <Text className="text-teal-600 font-medium">View All</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="bg-white rounded-2xl p-4 shadow-sm">
                        <Text className="text-gray-500 text-center py-4">No announcements yet</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Floating SOS Button - Removed since we have card now */}
        </SafeAreaView>
    );
}
