import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createDeliveryPass, getMyDeliveries } from '../../src/api/delivery/delivery.api';
import { Ionicons } from '@expo/vector-icons';

export default function DeliveryScreen() {
    const [company, setCompany] = useState('');
    const queryClient = useQueryClient();

    const { data: history, isLoading } = useQuery({
        queryKey: ['deliveries'],
        queryFn: getMyDeliveries,
    });

    const createPassMutation = useMutation({
        mutationFn: (companyName: string) => createDeliveryPass(companyName),
        onSuccess: (data) => {
            Alert.alert("Pass Created", `Code: ${data.pass_code}\nShare this with the delivery person.`);
            setCompany('');
            queryClient.invalidateQueries({ queryKey: ['deliveries'] }); // Ideally this would update a list of active passes
        },
        onError: (err: any) => {
            Alert.alert("Error", "Failed to create pass");
        }
    });

    const handleCreate = () => {
        if (!company) return Alert.alert("Required", "Enter company name (e.g. Amazon, Zomato)");
        createPassMutation.mutate(company);
    };

    const renderLog = ({ item }: { item: any }) => (
        <View className="bg-white p-4 rounded-xl mb-3 shadow-sm border border-slate-100 flex-row justify-between items-center">
            <View>
                <Text className="text-slate-900 font-bold">{item.company || "Delivery"}</Text>
                <Text className="text-slate-500 text-xs">{(item.delivery_person || "Unknown Person")}</Text>
            </View>
            <View className="items-end">
                <Text className="text-slate-700 font-medium">
                    {new Date(item.in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text className="text-slate-400 text-xs">
                    {new Date(item.in_time).toLocaleDateString()}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-50 px-4 pt-2">
            <Stack.Screen options={{ title: 'Delivery & Parcels', headerShadowVisible: false }} />

            {/* Create Pass Section */}
            <View className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 mb-6">
                <Text className="text-lg font-bold text-slate-900 mb-4">Pre-approve Delivery</Text>
                <View className="flex-row gap-2">
                    <TextInput
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3"
                        placeholder="Company (e.g. Swiggy)"
                        value={company}
                        onChangeText={setCompany}
                    />
                    <TouchableOpacity
                        className="bg-indigo-600 rounded-lg px-4 justify-center"
                        onPress={handleCreate}
                        disabled={createPassMutation.isPending}
                    >
                        {createPassMutation.isPending ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Ionicons name="add" size={24} color="white" />
                        )}
                    </TouchableOpacity>
                </View>
                <Text className="text-xs text-slate-400 mt-2">
                    Generates a code valid for 2 hours.
                </Text>
            </View>

            <Text className="text-slate-900 text-lg font-bold mb-4">Delivery History</Text>

            {isLoading ? (
                <ActivityIndicator size="large" color="#4f46e5" />
            ) : (
                <FlatList
                    data={history}
                    renderItem={renderLog}
                    keyExtractor={item => item.id.toString()}
                    ListEmptyComponent={
                        <View className="items-center mt-10">
                            <Text className="text-slate-400">No recent deliveries</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
