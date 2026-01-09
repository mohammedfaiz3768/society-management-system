import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useAuthStore } from '../src/store/authStore';

// CRITICAL: Import global CSS for NativeWind
import "../global.css";

import { registerForPushNotificationsAsync } from '../src/utils/notifications';
import { apiClient } from '../src/api/client';
import * as Notifications from 'expo-notifications';

const queryClient = new QueryClient();

export default function RootLayout() {
    const { token, userRole, isLoading } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();

    // Notification Listener - DISABLED FOR EXPO GO
    // Push notifications only work in production/development builds, not Expo Go
    // Uncomment this code when building for production
    /*
    useEffect(() => {
        if (token) {
            registerForPushNotificationsAsync().then(async (pushToken) => {
                if (pushToken) {
                    try {
                        await apiClient.post('/auth/save-token', { fcm_token: pushToken });
                        console.log("FCM Token saved to backend");
                    } catch (e) {
                        console.error("Failed to save FCM token", e);
                    }
                }
            });

            // Listen for incoming notifications
            const subscription = Notifications.addNotificationReceivedListener(notification => {
                console.log("Notification Received:", notification);
            });

            return () => subscription.remove();
        }
    }, [token]);
    */

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';

        // Use setTimeout to ensure router is mounted
        const navigationTimeout = setTimeout(() => {
            if (!token && !inAuthGroup) {
                // Redirect to login if not authenticated
                router.replace('/(auth)/login');
            } else if (token && inAuthGroup) {
                // Redirect to appropriate dashboard if already authenticated
                if (userRole === 'resident') {
                    router.replace('/(resident)/(tabs)/home');
                } else if (userRole === 'guard') {
                    router.replace('/(guard)/(tabs)/scan');
                }
            }
        }, 100);

        return () => clearTimeout(navigationTimeout);
    }, [token, segments, isLoading, userRole]);

    return (
        <QueryClientProvider client={queryClient}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(resident)" />
                <Stack.Screen name="(guard)" />
            </Stack>
            <StatusBar style="auto" />
            {/* Global SOS Overlay Placeholder */}
            {/* <SOSOverlay /> */}
        </QueryClientProvider>
    );
}
