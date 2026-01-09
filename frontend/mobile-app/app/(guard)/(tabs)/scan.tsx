import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useVerifyGatePass, useMarkEntry, useMarkExit } from '../../../src/api/gatepass/gatepass.hooks';
import type { VerifyGatePassResponse } from '../../../src/api/gatepass/gatepass.schema';

/**
 * Guard Scan Screen
 * 
 * Flow:
 * 1. Request camera permission
 * 2. Scan QR code
 * 3. Verify pass with backend
 * 4. Show result (Valid/Invalid with reason)
 * 5. Allow Mark Entry/Exit based on state
 * 
 * State Machine Enforcement:
 * - APPROVED → Can mark ENTRY
 * - ENTERED → Can mark EXIT
 * - Other states → Show error
 */

export default function GuardScanScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scannedData, setScannedData] = useState<string | null>(null);
    const [verificationResult, setVerificationResult] = useState<VerifyGatePassResponse | null>(null);

    const verifyMutation = useVerifyGatePass();
    const markEntryMutation = useMarkEntry();
    const markExitMutation = useMarkExit();

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (scannedData) return; // Prevent multiple scans

        setScannedData(data);

        try {
            const result = await verifyMutation.mutateAsync(data);
            setVerificationResult(result);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to verify QR code');
            setScannedData(null);
        }
    };

    const handleMarkEntry = async () => {
        if (!verificationResult?.gatePass.id) return;

        try {
            await markEntryMutation.mutateAsync(verificationResult.gatePass.id);
            Alert.alert('Success', 'Entry marked successfully', [
                { text: 'OK', onPress: () => resetScan() },
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to mark entry');
        }
    };

    const handleMarkExit = async () => {
        if (!verificationResult?.gatePass.id) return;

        try {
            await markExitMutation.mutateAsync(verificationResult.gatePass.id);
            Alert.alert('Success', 'Exit marked successfully', [
                { text: 'OK', onPress: () => resetScan() },
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to mark exit');
        }
    };

    const resetScan = () => {
        setScannedData(null);
        setVerificationResult(null);
    };

    // Permission handling
    if (!permission) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center">
                <ActivityIndicator size="large" color="#0f172a" />
            </SafeAreaView>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center px-6">
                <Text className="text-6xl mb-6">📷</Text>
                <Text className="text-xl font-bold text-slate-900 mb-2">Camera Access Required</Text>
                <Text className="text-slate-500 text-center mb-6">
                    We need camera access to scan QR codes
                </Text>
                <TouchableOpacity
                    onPress={requestPermission}
                    className="bg-slate-900 px-8 py-4 rounded-xl"
                >
                    <Text className="text-white font-semibold">Grant Permission</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // Show verification result
    if (verificationResult) {
        const { gatePass, isValid, reason } = verificationResult;
        const canMarkEntry = isValid && gatePass.status === 'APPROVED';
        const canMarkExit = isValid && gatePass.status === 'ENTERED';

        return (
            <SafeAreaView className="flex-1 bg-white">
                {/* Result Header */}
                <View className={`p-8 ${isValid ? 'bg-green-500' : 'bg-red-500'}`}>
                    <Text className="text-6xl text-center mb-4">{isValid ? '✓' : '✗'}</Text>
                    <Text className="text-3xl font-bold text-white text-center">
                        {isValid ? 'VALID PASS' : 'INVALID'}
                    </Text>
                    {!isValid && reason && (
                        <Text className="text-white text-center mt-2 text-lg">{reason}</Text>
                    )}
                </View>

                {/* Guest Details */}
                {isValid && (
                    <View className="p-6">
                        <View className="bg-slate-50 rounded-xl p-4 mb-6">
                            <View className="mb-3">
                                <Text className="text-xs text-slate-500 uppercase mb-1">Guest Name</Text>
                                <Text className="text-2xl font-bold text-slate-900">{gatePass.guest_name}</Text>
                            </View>

                            <View className="mb-3">
                                <Text className="text-xs text-slate-500 uppercase mb-1">Phone</Text>
                                <Text className="text-lg text-slate-900">{gatePass.guest_phone || 'N/A'}</Text>
                            </View>

                            <View className="mb-3">
                                <Text className="text-xs text-slate-500 uppercase mb-1">Type</Text>
                                <Text className="text-lg text-slate-900">{gatePass.type}</Text>
                            </View>

                            {gatePass.vehicle_number && (
                                <View className="mb-3">
                                    <Text className="text-xs text-slate-500 uppercase mb-1">Vehicle</Text>
                                    <Text className="text-lg font-semibold text-slate-900">{gatePass.vehicle_number}</Text>
                                </View>
                            )}

                            <View>
                                <Text className="text-xs text-slate-500 uppercase mb-1">Status</Text>
                                <Text className="text-lg font-bold text-blue-600">{gatePass.status}</Text>
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View className="space-y-3">
                            {canMarkEntry && (
                                <TouchableOpacity
                                    onPress={handleMarkEntry}
                                    disabled={markEntryMutation.isPending}
                                    className="bg-green-600 py-4 rounded-xl"
                                >
                                    {markEntryMutation.isPending ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text className="text-white text-center font-bold text-lg">MARK ENTRY</Text>
                                    )}
                                </TouchableOpacity>
                            )}

                            {canMarkExit && (
                                <TouchableOpacity
                                    onPress={handleMarkExit}
                                    disabled={markExitMutation.isPending}
                                    className="bg-orange-600 py-4 rounded-xl"
                                >
                                    {markExitMutation.isPending ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text className="text-white text-center font-bold text-lg">MARK EXIT</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                {/* Reset Button */}
                <View className="px-6 pb-6">
                    <TouchableOpacity
                        onPress={resetScan}
                        className="bg-slate-200 py-4 rounded-xl"
                    >
                        <Text className="text-slate-900 text-center font-semibold">Scan Another</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Camera View
    return (
        <SafeAreaView className="flex-1 bg-black">
            <CameraView
                style={{ flex: 1 }}
                facing="back"
                onBarcodeScanned={scannedData ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                }}
            >
                {/* Overlay */}
                <View className="flex-1 justify-center items-center">
                    <View className="w-72 h-72 border-4 border-white rounded-3xl opacity-70" />
                    <Text className="text-white text-xl font-bold mt-8">Scan Gate Pass QR</Text>
                    <Text className="text-white text-sm mt-2">Align QR code within the frame</Text>
                </View>

                {verifyMutation.isPending && (
                    <View className="absolute inset-0 bg-black/80 justify-center items-center">
                        <ActivityIndicator size="large" color="white" />
                        <Text className="text-white mt-4">Verifying...</Text>
                    </View>
                )}
            </CameraView>
        </SafeAreaView>
    );
}
