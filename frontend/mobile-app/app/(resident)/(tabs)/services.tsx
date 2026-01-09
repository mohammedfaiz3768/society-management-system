import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResidentServicesScreen() {
    return (
        <SafeAreaView className="flex-1 justify-center items-center bg-white">
            <Text className="text-xl font-bold">Services</Text>
            <Text className="text-slate-500">Staff, Directory, Parking</Text>
        </SafeAreaView>
    );
}
