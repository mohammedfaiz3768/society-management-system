import React from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getMySlot, getMyVehicles } from '../../src/api/parking/parking.api';
import { Ionicons } from '@expo/vector-icons';

export default function ParkingScreen() {
    const { data: slot, isLoading: loadingSlot, error: slotError } = useQuery({
        queryKey: ['parking', 'slot'],
        queryFn: getMySlot,
        retry: 1,
    });

    const { data: vehicles, isLoading: loadingVehicles, error: vehiclesError } = useQuery({
        queryKey: ['parking', 'vehicles'],
        queryFn: getMyVehicles,
        retry: 1,
    });

    const isLoading = loadingSlot || loadingVehicles;
    const hasError = slotError || vehiclesError;

    return (
        <SafeAreaView className="flex-1 bg-slate-50 px-4 pt-2">
            <Stack.Screen options={{ title: 'My Parking', headerShadowVisible: false }} />

            {isLoading ? (
                <View className="items-center mt-10">
                    <ActivityIndicator size="large" color="#4f46e5" />
                    <Text className="text-slate-500 mt-4">Loading parking details...</Text>
                </View>
            ) : hasError ? (
                <View className="items-center mt-10 px-6">
                    <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
                    <Text className="text-slate-900 font-bold text-lg mt-4 text-center">Unable to Load</Text>
                    <Text className="text-slate-500 mt-2 text-center">
                        {(slotError as any)?.response?.status === 404
                            ? 'Parking module not available for residents'
                            : 'Failed to load parking information. Please try again later.'}
                    </Text>
                </View>
            ) : (
                <View>
                    {/* Parking Slot Card */}
                    <View className="bg-indigo-600 rounded-2xl p-6 mb-6 shadow-md shadow-indigo-200">
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="car-sport" size={24} color="white" />
                            <Text className="text-white font-semibold ml-2 text-lg">Assigned Slot</Text>
                        </View>
                        {slot && slot.slot_number ? (
                            <View>
                                <Text className="text-white text-4xl font-bold mt-2">{slot.slot_number}</Text>
                                <Text className="text-indigo-100 mt-1 uppercase">{slot.type} Parking ({slot.status})</Text>
                            </View>
                        ) : (
                            <View>
                                <Text className="text-indigo-100 mt-2">No parking slot assigned yet.</Text>
                            </View>
                        )}
                    </View>

                    <Text className="text-slate-900 text-lg font-bold mb-4">My Vehicles</Text>

                    {vehicles && vehicles.length > 0 ? (
                        vehicles.map((vehicle: any) => (
                            <View key={vehicle.id} className="bg-white p-4 rounded-xl mb-3 shadow-sm border border-slate-100 flex-row items-center justify-between">
                                <View className="flex-row items-center">
                                    <View className="bg-slate-100 p-2 rounded-lg mr-3">
                                        <Ionicons name={vehicle.vehicle_type === 'bike' ? 'bicycle' : 'car'} size={24} color="#64748b" />
                                    </View>
                                    <View>
                                        <Text className="text-slate-900 font-bold text-base">{vehicle.vehicle_number}</Text>
                                        <Text className="text-slate-500 text-sm">{vehicle.model} • {vehicle.color}</Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View className="bg-white p-6 rounded-xl items-center border border-dashed border-slate-300">
                            <Text className="text-slate-400">No vehicles registered</Text>
                        </View>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}
