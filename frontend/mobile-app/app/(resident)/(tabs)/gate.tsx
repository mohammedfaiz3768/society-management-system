import React from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGatePassList } from '../../../src/api/gatepass/gatepass.hooks';
import type { GatePass } from '../../../src/api/gatepass/gatepass.schema';

/**
 * Resident Gate Screen
 * 
 * Features:
 * 1. List active gate passes
 * 2. Create new pass (navigates to form)
 * 3. View QR code (navigates to detail)
 * 4. Status badges (PENDING, APPROVED, etc.)
 */

export default function ResidentGateScreen() {
    const router = useRouter();
    const { data: gatePasses, isLoading, error, refetch } = useGatePassList();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return 'bg-green-100 text-green-800';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'ENTERED':
                return 'bg-blue-100 text-blue-800';
            case 'EXITED':
                return 'bg-gray-100 text-gray-800';
            case 'EXPIRED':
                return 'bg-red-100 text-red-800';
            case 'REJECTED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const renderGatePass = ({ item }: { item: GatePass }) => (
        <TouchableOpacity
            onPress={() => router.push(`/(resident)/gatepass/${item.id}` as any)}
            className="bg-white rounded-xl p-4 mb-3 border border-slate-200"
        >
            <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                    <Text className="text-lg font-semibold text-slate-900">{item.guest_name}</Text>
                    <Text className="text-sm text-slate-500">{item.guest_phone}</Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
                    <Text className="text-xs font-medium">{item.status}</Text>
                </View>
            </View>

            <View className="flex-row items-center gap-4 mt-2">
                <View className="flex-row items-center">
                    <Text className="text-xs text-slate-400 mr-1">Type:</Text>
                    <Text className="text-xs font-medium text-slate-700">{item.type}</Text>
                </View>
                <View className="flex-row items-center">
                    <Text className="text-xs text-slate-400 mr-1">Valid:</Text>
                    <Text className="text-xs font-medium text-slate-700">
                        {new Date(item.valid_from).toLocaleDateString()}
                    </Text>
                </View>
            </View>

            {item.vehicle_number && (
                <View className="mt-2 pt-2 border-t border-slate-100">
                    <Text className="text-xs text-slate-500">
                        Vehicle: <Text className="font-medium text-slate-700">{item.vehicle_number}</Text>
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="bg-white border-b border-slate-200 px-6 py-4">
                <Text className="text-2xl font-bold text-slate-900">Gate Passes</Text>
                <Text className="text-sm text-slate-500 mt-1">Manage your visitor access</Text>
            </View>

            {/* Content */}
            <View className="flex-1 px-6 pt-4">
                {isLoading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#0f172a" />
                    </View>
                ) : error ? (
                    <View className="flex-1 justify-center items-center">
                        <Text className="text-red-500 mb-4">Failed to load gate passes</Text>
                        <TouchableOpacity onPress={() => refetch()} className="bg-slate-900 px-6 py-3 rounded-xl">
                            <Text className="text-white font-medium">Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={gatePasses}
                        renderItem={renderGatePass}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        ListEmptyComponent={
                            <View className="items-center justify-center py-12">
                                <Text className="text-5xl mb-4">🚪</Text>
                                <Text className="text-lg font-medium text-slate-900">No Gate Passes</Text>
                                <Text className="text-sm text-slate-500 mt-1">Create one to get started</Text>
                            </View>
                        }
                    />
                )}
            </View>

            {/* Floating Action Button */}
            <TouchableOpacity
                onPress={() => router.push('/(resident)/gatepass/create' as any)}
                className="absolute bottom-6 right-6 bg-slate-900 w-16 h-16 rounded-full items-center justify-center shadow-lg"
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                }}
            >
                <Text className="text-white text-3xl font-light">+</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}
