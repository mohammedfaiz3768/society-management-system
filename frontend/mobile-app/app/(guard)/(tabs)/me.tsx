import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../src/store/authStore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function GuardMeScreen() {
    const { user, logout } = useAuthStore();
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
                <Text className="text-2xl font-bold text-slate-900">My Profile</Text>
                <Text className="text-sm text-slate-500">Guard account details</Text>
            </View>

            <ScrollView className="flex-1 px-4 pt-6">
                {/* Avatar */}
                <View className="items-center mb-6">
                    <View className="w-20 h-20 bg-slate-900 rounded-full items-center justify-center mb-3">
                        <Text className="text-3xl font-bold text-white">
                            {user?.name?.charAt(0)?.toUpperCase() ?? 'G'}
                        </Text>
                    </View>
                    <Text className="text-xl font-bold text-slate-900">{user?.name ?? '—'}</Text>
                    <View className="mt-1 px-3 py-0.5 bg-slate-900 rounded-full">
                        <Text className="text-xs text-white font-semibold uppercase tracking-wide">Guard</Text>
                    </View>
                </View>

                {/* Info card */}
                <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-4">
                    <View className="flex-row items-center px-4 py-4 border-b border-slate-100">
                        <View className="w-8 h-8 bg-slate-100 rounded-full items-center justify-center mr-3">
                            <Ionicons name="mail-outline" size={16} color="#64748b" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xs text-slate-400 uppercase font-semibold mb-0.5">Email</Text>
                            <Text className="text-slate-900 font-medium">{user?.email ?? '—'}</Text>
                        </View>
                    </View>

                    <View className="flex-row items-center px-4 py-4 border-b border-slate-100">
                        <View className="w-8 h-8 bg-slate-100 rounded-full items-center justify-center mr-3">
                            <Ionicons name="call-outline" size={16} color="#64748b" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xs text-slate-400 uppercase font-semibold mb-0.5">Phone</Text>
                            <Text className="text-slate-900 font-medium">{(user as any)?.phone ?? 'Not set'}</Text>
                        </View>
                    </View>

                    <View className="flex-row items-center px-4 py-4">
                        <View className="w-8 h-8 bg-slate-100 rounded-full items-center justify-center mr-3">
                            <Ionicons name="shield-checkmark-outline" size={16} color="#64748b" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xs text-slate-400 uppercase font-semibold mb-0.5">Role</Text>
                            <Text className="text-slate-900 font-medium capitalize">{user?.role ?? '—'}</Text>
                        </View>
                    </View>
                </View>

                {/* Logout */}
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
