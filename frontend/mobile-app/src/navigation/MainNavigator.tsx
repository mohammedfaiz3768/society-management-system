import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/home/HomeScreen';
import PollScreen from '../screens/home/PollScreen';
import DirectoryScreen from '../screens/services/DirectoryScreen';
import ComplaintScreen from '../screens/services/ComplaintScreen';
import GatePassScreen from '../screens/gatepass/GatePassScreen';
import { Text, View } from 'react-native';

import EventsScreen from '../screens/home/EventsScreen';
import ProfileScreen from '../screens/common/ProfileScreen';

// Create Home Stack to allow navigation from Dashboard -> Polls/Directory
const HomeStack = createNativeStackNavigator();

function HomeStackNavigator() {
    return (
        <HomeStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f9fafb' } }}>
            <HomeStack.Screen name="Dashboard" component={HomeScreen} />
            <HomeStack.Screen name="Polls" component={PollScreen} options={{ presentation: 'modal', headerShown: true }} />
            <HomeStack.Screen name="Directory" component={DirectoryScreen} options={{ presentation: 'modal', headerShown: true }} />
            <HomeStack.Screen name="Events" component={EventsScreen} options={{ presentation: 'modal', headerShown: true }} />
        </HomeStack.Navigator>
    );
}

const Tab = createBottomTabNavigator();
// function ProfileScreen() { return <View className="flex-1 justify-center items-center bg-white"><Text>Profile</Text></View>; }

export default function MainNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopColor: '#f3f4f6',
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8
                },
                tabBarActiveTintColor: '#2563EB',
                tabBarInactiveTintColor: '#9CA3AF',
            }}
        >
            <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ tabBarLabel: 'Home', tabBarIcon: ({ color }) => <Text style={{ color }}>🏠</Text> }} />
            <Tab.Screen
                name="Complaints"
                component={ComplaintScreen}
                options={{ tabBarIcon: ({ color }) => <Text style={{ color }}>⚠️</Text> }}
            />
            <Tab.Screen name="GatePass" component={GatePassScreen} options={{ tabBarLabel: 'Gate Pass', tabBarIcon: ({ color }) => <Text style={{ color }}>🎫</Text> }} />
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color }) => <Text style={{ color }}>👤</Text> }} />
        </Tab.Navigator>
    );
}
