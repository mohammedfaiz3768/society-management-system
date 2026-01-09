import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getMyBills } from '../../src/api/maintenance/maintenance.api';
import { Ionicons } from '@expo/vector-icons';

export default function MaintenanceScreen() {
    const { data: bills, isLoading } = useQuery({
        queryKey: ['maintenance'],
        queryFn: getMyBills,
    });

    const renderBill = ({ item }: { item: any }) => (
        <View className="bg-white p-4 rounded-xl mb-4 shadow-sm border border-slate-100 flex-row justify-between items-center">
            <View>
                <Text className="text-base font-bold text-slate-900">
                    {new Date(0, item.month - 1).toLocaleString('default', { month: 'long' })} {item.year}
                </Text>
                <Text className="text-slate-500 text-sm">₹{item.amount}</Text>
            </View>
            <View>
                {item.status === 'PAID' ? (
                    <View className="bg-green-100 px-3 py-1.5 rounded-full">
                        <Text className="text-green-700 font-bold text-xs">PAID</Text>
                    </View>
                ) : (
                    <TouchableOpacity className="bg-blue-600 px-4 py-2 rounded-lg">
                        <Text className="text-white font-bold text-xs">PAY NOW</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-50 px-4 pt-2">
            <Stack.Screen options={{ title: 'Maintenance', headerShadowVisible: false }} />

            <View className="mb-4">
                <Text className="text-2xl font-bold text-slate-900">Bills</Text>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color="#0f172a" />
            ) : (
                <FlatList
                    data={bills}
                    renderItem={renderBill}
                    keyExtractor={item => item.id.toString()}
                    ListEmptyComponent={
                        <View className="items-center mt-20">
                            <Ionicons name="receipt-outline" size={48} color="#cbd5e1" />
                            <Text className="text-slate-400 mt-2">No bills found</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
