import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GuardAlertsScreen() {
    return (
        <SafeAreaView className="flex-1 justify-center items-center bg-white">
            <Text className="text-xl font-bold text-red-600">Active Alerts</Text>
            <Text className="text-slate-500">SOS Notifications</Text>
        </SafeAreaView>
    );
}
