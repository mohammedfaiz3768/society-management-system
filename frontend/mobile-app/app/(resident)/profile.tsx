import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../src/api/client';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout, updateUser } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await apiClient.put(`/users/${user?.id}`, { name, phone });
            const updated = res.data;
            updateUser({ ...user!, name: updated.name ?? name, phone: updated.phone ?? phone });
            setIsEditing(false);
            Alert.alert("Success", "Profile updated successfully.");
        } catch (err) {
            Alert.alert("Error", "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", style: "destructive", onPress: logout }
        ]);
    };

    if (!user) return null;

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <Stack.Screen options={{ title: 'My Profile', headerShadowVisible: false }} />

            <ScrollView className="px-6 pt-4">
                <View className="items-center mb-8">
                    <View className="h-24 w-24 bg-indigo-100 rounded-full items-center justify-center mb-4 border-4 border-white shadow-sm">
                        <Text className="text-4xl font-bold text-indigo-600">{user.name?.charAt(0)}</Text>
                    </View>
                    <Text className="text-2xl font-bold text-slate-900">{user.name}</Text>
                    <Text className="text-slate-500">{user.role.toUpperCase()}</Text>
                </View>

                <View className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6 space-y-4">
                    <View>
                        <Text className="text-xs text-slate-400 font-bold uppercase mb-1">Full Name</Text>
                        {isEditing ? (
                            <TextInput
                                value={name}
                                onChangeText={setName}
                                className="border-b border-indigo-500 py-1 text-slate-900 font-medium"
                            />
                        ) : (
                            <Text className="text-slate-900 font-medium text-lg">{user.name}</Text>
                        )}
                    </View>

                    <View>
                        <Text className="text-xs text-slate-400 font-bold uppercase mb-1">Phone Number</Text>
                        {isEditing ? (
                            <TextInput
                                value={phone}
                                onChangeText={setPhone}
                                className="border-b border-indigo-500 py-1 text-slate-900 font-medium"
                                keyboardType="phone-pad"
                            />
                        ) : (
                            <Text className="text-slate-900 font-medium text-lg">{user.phone || 'Not set'}</Text>
                        )}
                    </View>

                    <View>
                        <Text className="text-xs text-slate-400 font-bold uppercase mb-1">Email</Text>
                        <Text className="text-slate-900 font-medium text-lg">{user.email}</Text>
                        <Text className="text-xs text-slate-300 mt-1">Email cannot be changed</Text>
                    </View>

                    <View>
                        <Text className="text-xs text-slate-400 font-bold uppercase mb-1">Flat Assignment</Text>
                        <Text className="text-slate-900 font-medium text-lg">
                            {user.flat_number ? `${(user as any).block || ''} - ${user.flat_number}` : 'Not Assigned'}
                        </Text>
                    </View>
                </View>

                {isEditing ? (
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={loading}
                        className="bg-indigo-600 p-4 rounded-xl items-center mb-3 shadow-md shadow-indigo-200"
                    >
                        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Save Changes</Text>}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPress={() => setIsEditing(true)}
                        className="bg-slate-900 p-4 rounded-xl items-center mb-3"
                    >
                        <Text className="text-white font-bold text-lg">Edit Profile</Text>
                    </TouchableOpacity>
                )}

                {!isEditing && (
                    <TouchableOpacity
                        onPress={handleLogout}
                        className="bg-red-50 p-4 rounded-xl items-center border border-red-100"
                    >
                        <Text className="text-red-600 font-bold text-lg">Log Out</Text>
                    </TouchableOpacity>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}
