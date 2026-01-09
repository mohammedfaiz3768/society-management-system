import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResidentCommunityScreen() {
    return (
        <SafeAreaView className="flex-1 justify-center items-center bg-white">
            <Text className="text-xl font-bold">Community</Text>
            <Text className="text-slate-500">Notices, Events, Polls</Text>
        </SafeAreaView>
    );
}
