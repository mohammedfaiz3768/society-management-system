import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { useGatePassDetail } from '../../../src/api/gatepass/gatepass.hooks';

/**
 * Gate Pass Detail Screen
 * 
 * Features:
 * 1. Display QR code (only if APPROVED)
 * 2. Show status with color coding
 * 3. Auto-refresh status every 5 seconds (for PENDING → APPROVED)
 * 4. Entry/Exit timestamps if available
 * 5. Share QR functionality
 */

export default function GatePassDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [shouldPoll, setShouldPoll] = useState(true);

    // Parse id to number and validate
    const gatePassId = id ? parseInt(id, 10) : undefined;

    const { data: gatePass, isLoading, error } = useGatePassDetail(gatePassId, {
        enabled: !!gatePassId && !isNaN(gatePassId),
        pollingInterval: shouldPoll ? 5000 : undefined, // Poll every 5s for status updates
    });

    // Stop polling once approved or rejected
    useEffect(() => {
        if (gatePass && ['APPROVED', 'REJECTED', 'EXPIRED'].includes(gatePass.status)) {
            setShouldPoll(false);
        }
    }, [gatePass?.status]);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return { bg: 'bg-green-100', text: 'text-green-800', icon: '✓' };
            case 'PENDING':
                return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳' };
            case 'ENTERED':
                return { bg: 'bg-blue-100', text: 'text-blue-800', icon: '→' };
            case 'EXITED':
                return { bg: 'bg-gray-100', text: 'text-gray-800', icon: '✓' };
            case 'EXPIRED':
                return { bg: 'bg-red-100', text: 'text-red-800', icon: '⚠️' };
            case 'REJECTED':
                return { bg: 'bg-red-100', text: 'text-red-800', icon: '✗' };
            default:
                return { bg: 'bg-gray-100', text: 'text-gray-800', icon: '•' };
        }
    };

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

    const statusConfig = getStatusConfig(gatePass.status);

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
                {/* Status Banner */}
                <View className={`${statusConfig.bg} rounded-xl p-4 mb-6`}>
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <Text className="text-2xl mr-3">{statusConfig.icon}</Text>
                            <View>
                                <Text className={`text-lg font-bold ${statusConfig.text}`}>{gatePass.status}</Text>
                                {gatePass.status === 'PENDING' && (
                                    <Text className="text-sm text-slate-600">Waiting for approval...</Text>
                                )}
                            </View>
                        </View>
                    </View>
                </View>

                {/* QR Code (Only for APPROVED) */}
                {gatePass.status === 'APPROVED' && (
                    <View className="bg-white rounded-xl p-6 items-center mb-6 shadow-sm">
                        <Text className="text-sm font-medium text-slate-500 mb-4">SCAN THIS QR</Text>
                        <QRCode value={gatePass.qr_code} size={200} />
                        <Text className="text-xs text-slate-400 mt-4">Show this to the guard</Text>
                    </View>
                )}

                {/* Guest Details */}
                <View className="bg-white rounded-xl p-4 mb-4">
                    <Text className="text-xs font-semibold text-slate-500 uppercase mb-3">Guest Details</Text>

                    <View className="space-y-3">
                        <View className="flex-row justify-between py-2 border-b border-slate-100">
                            <Text className="text-slate-600">Name</Text>
                            <Text className="font-medium text-slate-900">{gatePass.guest_name}</Text>
                        </View>

                        <View className="flex-row justify-between py-2 border-b border-slate-100">
                            <Text className="text-slate-600">Phone</Text>
                            <Text className="font-medium text-slate-900">{gatePass.guest_phone}</Text>
                        </View>

                        <View className="flex-row justify-between py-2 border-b border-slate-100">
                            <Text className="text-slate-600">Type</Text>
                            <Text className="font-medium text-slate-900">{gatePass.type}</Text>
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
                                {new Date(gatePass.valid_to).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Entry/Exit Timestamps */}
                {(gatePass.entry_time || gatePass.exit_time) && (
                    <View className="bg-white rounded-xl p-4">
                        <Text className="text-xs font-semibold text-slate-500 uppercase mb-3">Activity Log</Text>

                        {gatePass.entry_time && (
                            <View className="flex-row items-center py-2">
                                <Text className="text-green-600 mr-2">→</Text>
                                <Text className="text-slate-600">Entry: </Text>
                                <Text className="font-medium text-slate-900">
                                    {new Date(gatePass.entry_time).toLocaleString()}
                                </Text>
                            </View>
                        )}

                        {gatePass.exit_time && (
                            <View className="flex-row items-center py-2">
                                <Text className="text-red-600 mr-2">←</Text>
                                <Text className="text-slate-600">Exit: </Text>
                                <Text className="font-medium text-slate-900">
                                    {new Date(gatePass.exit_time).toLocaleString()}
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}
