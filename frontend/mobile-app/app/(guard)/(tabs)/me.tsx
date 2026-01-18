import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../src/store/authStore';
import { useRouter } from 'expo-router';

export default function GuardMeScreen() {
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
        <SafeAreaView className="flex-1 bg-white p-4">
            <View className="items-center mb-8 mt-4">
                <Text className="text-2xl font-bold text-slate-900">Guard Profile</Text>
                <Text className="text-slate-500">Shift & Device Health</Text>
            </View>

            <TouchableOpacity
                onPress={handleLogout}
                className="bg-red-50 p-4 rounded-xl border border-red-100 flex-row justify-center items-center"
            >
                <Text className="text-red-600 font-semibold text-lg">Logout</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}
