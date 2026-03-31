import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';
import { useFonts } from 'expo-font';
import { useQuery } from '@tanstack/react-query';
import { listSosAlerts } from '../../src/api/sos/sos.api';

export default function GuardLayout() {
    const [fontsLoaded] = useFonts({
        ...Ionicons.font,
    });

    const { data: sosAlerts } = useQuery({
        queryKey: ['sos', 'all'],
        queryFn: listSosAlerts,
        refetchInterval: 15000,
    });
    const activeAlertCount = sosAlerts?.filter(a => a.status !== 'RESOLVED').length || 0;

    if (!fontsLoaded) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0D9488" />
            </View>
        );
    }
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#0f172a',
                tabBarInactiveTintColor: '#94a3b8',
            }}
        >
            <Tabs.Screen
                name="(tabs)/scan"
                options={{
                    title: 'Scan',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="scan-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="(tabs)/queue"
                options={{
                    title: 'Queue',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="(tabs)/log"
                options={{
                    title: 'Log',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="list-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="(tabs)/alerts"
                options={{
                    title: 'Alerts',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="alert-circle-outline" size={size} color={color} />
                    ),
                    tabBarBadge: activeAlertCount > 0 ? activeAlertCount : undefined,
                }}
            />
            <Tabs.Screen
                name="(tabs)/me"
                options={{
                    title: 'Me',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
