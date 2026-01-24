import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getStaffDirectory, getResidentDirectory } from '../../src/api/directory/directory.api';
import { Ionicons } from '@expo/vector-icons';

export default function DirectoryScreen() {
    const [tab, setTab] = useState<'staff' | 'residents'>('staff');

    const { data: staff, isLoading: loadingStaff, error: staffError } = useQuery({
        queryKey: ['directory', 'staff'],
        queryFn: getStaffDirectory,
        enabled: tab === 'staff',
        retry: 1,
    });

    const { data: residents, isLoading: loadingResidents, error: residentsError } = useQuery({
        queryKey: ['directory', 'residents'],
        queryFn: getResidentDirectory,
        enabled: tab === 'residents',
        retry: 1,
    });

    const callNumber = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
    };

    const renderStaff = ({ item }: { item: any }) => (
        <View className="bg-white p-4 rounded-xl mb-3 shadow-sm border border-slate-100 flex-row items-center">
            <View className="h-12 w-12 rounded-full bg-blue-100 items-center justify-center mr-4">
                <Text className="text-blue-600 font-bold text-lg">{item.name.charAt(0)}</Text>
            </View>
            <View className="flex-1">
                <Text className="font-bold text-slate-900 text-lg">{item.name}</Text>
                <Text className="text-slate-500 capitalize">{item.role}</Text>
                {item.shift_start && (
                    <Text className="text-slate-400 text-xs mt-1">
                        Shift: {item.shift_start} - {item.shift_end}
                    </Text>
                )}
            </View>
            <TouchableOpacity onPress={() => callNumber(item.phone)} className="p-3 bg-green-50 rounded-full">
                <Ionicons name="call" size={20} color="#10B981" />
            </TouchableOpacity>
        </View>
    );

    const renderResident = ({ item }: { item: any }) => (
        <View className="bg-white p-4 rounded-xl mb-3 shadow-sm border border-slate-100 flex-row items-center">
            <View className="h-12 w-12 rounded-full bg-purple-100 items-center justify-center mr-4">
                <Text className="text-purple-600 font-bold text-lg">{item.name.charAt(0)}</Text>
            </View>
            <View className="flex-1">
                <Text className="font-bold text-slate-900 text-lg">{item.name}</Text>
                <Text className="text-slate-500">{item.block} - {item.flat_number}</Text>
            </View>
            <TouchableOpacity onPress={() => callNumber(item.phone)} className="p-3 bg-green-50 rounded-full">
                <Ionicons name="call" size={20} color="#10B981" />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <Stack.Screen options={{ title: 'Directory', headerShadowVisible: false }} />

            <View className="flex-row px-4 mb-4 mt-2">
                <TouchableOpacity
                    onPress={() => setTab('staff')}
                    className={`flex-1 py-3 items-center rounded-l-lg border ${tab === 'staff' ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}
                >
                    <Text className={`font-bold ${tab === 'staff' ? 'text-white' : 'text-slate-600'}`}>Staff & Helpers</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setTab('residents')}
                    className={`flex-1 py-3 items-center rounded-r-lg border ${tab === 'residents' ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}
                >
                    <Text className={`font-bold ${tab === 'residents' ? 'text-white' : 'text-slate-600'}`}>Residents</Text>
                </TouchableOpacity>
            </View>

            <View className="px-4 flex-1">
                {(tab === 'staff' ? loadingStaff : loadingResidents) ? (
                    <View className="items-center mt-10">
                        <ActivityIndicator size="large" color="#2563eb" />
                        <Text className="text-slate-500 mt-4">Loading directory...</Text>
                    </View>
                ) : (tab === 'staff' ? staffError : residentsError) ? (
                    <View className="items-center mt-10 px-6">
                        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
                        <Text className="text-slate-900 font-bold text-lg mt-4 text-center">Unable to Load</Text>
                        <Text className="text-slate-500 mt-2 text-center">
                            Directory module not available. Please contact admin.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={tab === 'staff' ? staff : residents}
                        renderItem={tab === 'staff' ? renderStaff : renderResident}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        ListEmptyComponent={
                            <View className="items-center mt-20">
                                <Text className="text-slate-400">No contacts found</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
