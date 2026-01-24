import { Stack } from 'expo-router';

export default function ResidentStackLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#f8fafc' }, // slate-50
            }}
        >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            {/* Feature Screens */}
            <Stack.Screen name="complaints" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="notices" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="maintenance" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="documents" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="directory" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="family" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="parking" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="polls" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="profile" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="sos" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="notifications" options={{ headerShown: false, presentation: 'card' }} />

            {/* Gate Pass Screens */}
            <Stack.Screen name="gatepass/[id]" options={{ headerShown: false, presentation: 'modal' }} />
            {/* If there are other gatepass screens like create, ensure they are handled if in a subfolder */}
        </Stack>
    );
}
