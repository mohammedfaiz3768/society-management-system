import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { useGatePassDetail } from '../../../src/api/gatepass/gatepass.hooks';

/**
 * Gate Pass Detail Screen
 * 
 * Features:
 * 1. Display QR code
 * 2. Show visitor details
 * 3. Display validity period
 * 4. Show used status
 */

export default function GatePassDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    // Parse id to number and validate
    const gatePassId = id ? parseInt(id, 10) : undefined;

    const { data: gatePass, isLoading, error } = useGatePassDetail(gatePassId, {
        enabled: !!gatePassId && !isNaN(gatePassId),
    });

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center">
                <ActivityIndicator size="large" color="#0f172a" />
            </SafeAreaView>
        );
    }

    if (error || !gatePass) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center px-6">
                <Text className="text-red-500 text-lg mb-4">Failed to load gate pass</Text>
                <TouchableOpacity onPress={() => router.back()} className="bg-slate-900 px-6 py-3 rounded-xl">
                    <Text className="text-white font-medium">Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="bg-white px-6 py-4 border-b border-slate-200 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Text className="text-slate-600 text-lg">← Back</Text>
                </TouchableOpacity>
                <Text className="text-xl font-bold text-slate-900">Gate Pass</Text>
            </View>

            {/* Content */}
            <View className="flex-1 px-6 py-6">
                {/* QR Code */}
                <View className="bg-white rounded-xl p-6 items-center mb-6 shadow-sm">
                    <Text className="text-sm font-medium text-slate-500 mb-4">SCAN THIS QR</Text>
                    <QRCode value={gatePass.qr_code || String(gatePass.id)} size={200} />
                    <Text className="text-xs text-slate-400 mt-4">Show this to the guard</Text>
                </View>

                {/* Guest Details */}
                <View className="bg-white rounded-xl p-4 mb-4">
                    <Text className="text-xs font-semibold text-slate-500 uppercase mb-3">Visitor Details</Text>

                    <View className="space-y-3">
                        <View className="flex-row justify-between py-2 border-b border-slate-100">
                            <Text className="text-slate-600">Name</Text>
                            <Text className="font-medium text-slate-900">{gatePass.visitor_name}</Text>
                        </View>

                        <View className="flex-row justify-between py-2 border-b border-slate-100">
                            <Text className="text-slate-600">Phone</Text>
                            <Text className="font-medium text-slate-900">{gatePass.visitor_phone}</Text>
                        </View>


                        {gatePass.vehicle_number && (
                            <View className="flex-row justify-between py-2 border-b border-slate-100">
                                <Text className="text-slate-600">Vehicle</Text>
                                <Text className="font-medium text-slate-900">{gatePass.vehicle_number}</Text>
                            </View>
                        )}

                        <View className="flex-row justify-between py-2">
                            <Text className="text-slate-600">Valid Until</Text>
                            <Text className="font-medium text-slate-900">
                                {new Date(gatePass.valid_until).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Show if gate pass was used */}
                {gatePass.used && (
                    <View className="bg-blue-50 rounded-xl p-4">
                        <Text className="text-xs font-semibold text-blue-600 uppercase mb-2">Status</Text>
                        <Text className="text-slate-700">This gate pass has been used</Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}
