import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen() {
    const { user, logout } = useAuthStore();

    return (
        <View className="flex-1 bg-gray-50 pt-12 px-5">
            <Text className="text-2xl font-bold text-gray-900 mb-8">My Profile</Text>

            <View className="bg-white p-6 rounded-2xl items-center shadow-sm mb-6">
                <View className="h-24 w-24 bg-blue-100 rounded-full items-center justify-center mb-4">
                    <Text className="text-4xl">{user?.name?.charAt(0) || 'U'}</Text>
                </View>
                <Text className="text-xl font-bold text-gray-900">{user?.name}</Text>
                <Text className="text-gray-500 mb-4">{user?.role?.toUpperCase()}</Text>

                <View className="flex-row gap-4 mb-2 w-full">
                    <View className="flex-1 bg-gray-50 p-3 rounded-xl items-center">
                        <Text className="text-gray-400 text-xs uppercase font-bold">Flat</Text>
                        <Text className="text-gray-900 font-bold text-lg">{user?.flat_number || '-'}</Text>
                    </View>
                    <View className="flex-1 bg-gray-50 p-3 rounded-xl items-center">
                        <Text className="text-gray-400 text-xs uppercase font-bold">Block</Text>
                        <Text className="text-gray-900 font-bold text-lg">A</Text>
                    </View>
                </View>
            </View>

            <View className="bg-white rounded-xl overflow-hidden shadow-sm">
                <TouchableOpacity className="p-4 border-b border-gray-100 flex-row justify-between">
                    <Text className="text-gray-700">Notifications</Text>
                    <Text className="text-gray-400">On</Text>
                </TouchableOpacity>
                <TouchableOpacity className="p-4 border-b border-gray-100 flex-row justify-between">
                    <Text className="text-gray-700">Help & Support</Text>
                    <Text className="text-gray-400">&gt;</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={logout} className="p-4 flex-row justify-between">
                    <Text className="text-red-600 font-bold">Sign Out</Text>
                </TouchableOpacity>
            </View>

            <Text className="text-center text-gray-400 mt-8 text-xs">Version 1.0.0 • Enterprise Edition</Text>
        </View>
    );
}
