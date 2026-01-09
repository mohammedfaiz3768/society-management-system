import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GuardMeScreen() {
    return (
        <SafeAreaView className="flex-1 justify-center items-center bg-white">
            <Text className="text-xl font-bold">Guard Profile</Text>
            <Text className="text-slate-500">Shift & Device Health</Text>
        </SafeAreaView>
    );
}
