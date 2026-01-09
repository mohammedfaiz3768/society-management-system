import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';
import { Ionicons } from '@expo/vector-icons';

export default function DeliveryEntryScreen() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        company: '',
        person: '',
        flat: '',
        passCode: ''
    });

    const entryMutation = useMutation({
        mutationFn: async () => {
            const res = await apiClient.post('/delivery/entry', {
                delivery_person: formData.person || 'Unknown',
                company: formData.company,
                flat_number: formData.flat,
                pass_code: formData.passCode || undefined,
                purpose: 'Delivery'
            });
            return res.data;
        },
        onSuccess: (data) => {
            Alert.alert("Success", `Delivery Logged! ID: ${data.id}`);
            router.back();
        },
        onError: (err: any) => {
            Alert.alert("Error", err.response?.data?.message || "Failed to log entry");
        }
    });

    const handleSubmit = () => {
        if (!formData.company || !formData.flat) {
            return Alert.alert("Missing Info", "Company and Flat Number are required");
        }
        entryMutation.mutate();
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-50 px-4 pt-2">
            <Stack.Screen options={{ title: 'Log Delivery', headerShadowVisible: false }} />

            <ScrollView className="mt-4">
                <View className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">

                    <View>
                        <Text className="font-semibold text-slate-700 mb-2">Company Name</Text>
                        <TextInput
                            value={formData.company}
                            onChangeText={t => setFormData({ ...formData, company: t })}
                            placeholder="e.g. Amazon, Zomato"
                            className="bg-slate-50 border border-slate-200 rounded-lg p-3"
                        />
                    </View>

                    <View>
                        <Text className="font-semibold text-slate-700 mb-2">Delivery Person (Optional)</Text>
                        <TextInput
                            value={formData.person}
                            onChangeText={t => setFormData({ ...formData, person: t })}
                            placeholder="Name"
                            className="bg-slate-50 border border-slate-200 rounded-lg p-3"
                        />
                    </View>

                    <View>
                        <Text className="font-semibold text-slate-700 mb-2">Flat Number</Text>
                        <TextInput
                            value={formData.flat}
                            onChangeText={t => setFormData({ ...formData, flat: t })}
                            placeholder="e.g. 101"
                            className="bg-slate-50 border border-slate-200 rounded-lg p-3"
                        />
                    </View>

                    <View>
                        <Text className="font-semibold text-slate-700 mb-2">Pass Code (Optional)</Text>
                        <View className="flex-row items-center border border-slate-200 bg-slate-50 rounded-lg px-3">
                            <Ionicons name="key-outline" size={20} color="#94a3b8" />
                            <TextInput
                                value={formData.passCode}
                                onChangeText={t => setFormData({ ...formData, passCode: t })}
                                placeholder="Enter code if resident provided"
                                className="flex-1 p-3"
                            />
                        </View>
                        <Text className="text-xs text-slate-400 mt-1">
                            If resident generated a pass, enter it here to auto-verify.
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={entryMutation.isPending}
                        className="bg-indigo-600 p-4 rounded-xl items-center mt-4"
                    >
                        <Text className="text-white font-bold text-lg">
                            {entryMutation.isPending ? "Logging..." : "Log Entry"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
