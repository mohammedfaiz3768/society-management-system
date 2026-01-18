import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';

export default function ResidentLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#0f172a', // slate-900
                tabBarInactiveTintColor: '#94a3b8', // slate-400
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                    marginBottom: 5,
                },
                tabBarStyle: {
                    borderTopWidth: 0,
                    backgroundColor: '#ffffff',
                    height: 70, // Premium height
                    paddingBottom: 10,
                    paddingTop: 10,
                    elevation: 20, // Stronger shadow for floating feel
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                },
            }}
        >
            <Tabs.Screen
                name="(tabs)/home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="(tabs)/gate"
                options={{
                    title: 'Gate',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="shield-checkmark-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="(tabs)/services"
                options={{
                    title: 'Services',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="construct-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="(tabs)/community"
                options={{
                    title: 'Community',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
