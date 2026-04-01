import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../src/store/authStore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const menuItems = [
    { label: 'Announcements', icon: 'megaphone-outline' as const, route: '/(resident)/announcements' },
    { label: 'Community Polls', icon: 'stats-chart-outline' as const, route: '/(resident)/polls' },
    { label: 'Notices', icon: 'newspaper-outline' as const, route: '/(resident)/notices' },
    { label: 'Documents', icon: 'document-text-outline' as const, route: '/(resident)/documents' },
    { label: 'Parking', icon: 'car-outline' as const, route: '/(resident)/parking' },
    { label: 'My Family', icon: 'people-outline' as const, route: '/(resident)/family' },
    { label: 'Delivery Tracker', icon: 'cube-outline' as const, route: '/(resident)/delivery' },
    { label: 'Notifications', icon: 'notifications-outline' as const, route: '/(resident)/notifications' },
];

export default function ResidentCommunityScreen() {
    const logout = useAuthStore((state) => state.logout);
    const router = useRouter();

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: () => {
                        logout();
                        router.replace('/(auth)/login');
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <View className="bg-white border-b border-slate-100 px-4 py-4">
                <Text className="text-2xl font-bold text-slate-900">More</Text>
                <Text className="text-sm text-slate-500">Community features & settings</Text>
            </View>

            <ScrollView className="flex-1 px-4 pt-4">
                <View className="bg-white rounded-2xl overflow-hidden mb-4 border border-slate-100">
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={item.route}
                            onPress={() => router.push(item.route as any)}
                            className={`flex-row items-center px-4 py-4 ${index < menuItems.length - 1 ? 'border-b border-slate-100' : ''}`}
                        >
                            <View className="w-9 h-9 rounded-full bg-indigo-50 items-center justify-center mr-3">
                                <Ionicons name={item.icon} size={18} color="#4f46e5" />
                            </View>
                            <Text className="flex-1 text-slate-800 font-medium">{item.label}</Text>
                            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    onPress={handleLogout}
                    className="bg-red-50 p-4 rounded-2xl border border-red-100 flex-row justify-center items-center mb-8"
                >
                    <Ionicons name="log-out-outline" size={20} color="#dc2626" />
                    <Text className="text-red-600 font-semibold text-base ml-2">Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
