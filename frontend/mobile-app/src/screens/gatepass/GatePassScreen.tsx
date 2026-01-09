import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createGatePass, getMyPasses } from '../../services/gatePassService';
import QRCode from 'react-native-qrcode-svg';

export default function GatePassScreen() {
    const [visitorName, setVisitorName] = useState('');
    const [type, setType] = useState('Guest'); // Default
    const [showModal, setShowModal] = useState(false);
    const [qrCodeData, setQrCodeData] = useState<string | null>(null);

    const queryClient = useQueryClient();

    // Fetch History
    const { data: passes, isLoading } = useQuery({
        queryKey: ['my-passes'],
        queryFn: getMyPasses,
    });

    // Create Mutation
    const mutation = useMutation({
        mutationFn: createGatePass,
        onSuccess: (data) => {
            // Data likely contains { pass_code: "XYZ" }
            setQrCodeData(data.pass_code);
            setShowModal(true);
            setVisitorName('');
            queryClient.invalidateQueries({ queryKey: ['my-passes'] });
        },
        onError: (error: any) => {
            Alert.alert("Error", error.response?.data?.message || "Failed to create pass");
        }
    });

    const handleCreate = () => {
        if (!visitorName) { Alert.alert("Missing Name"); return; }
        // Create validUntil (24 hours from now for demo)
        const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        mutation.mutate({ visitorName, type, validUntil });
    };

    return (
        <ScrollView className="flex-1 bg-gray-50 p-5 pt-12">
            <Text className="text-2xl font-bold text-gray-900 mb-6">Gate Pass</Text>

            {/* Creation Form */}
            <View className="bg-white p-5 rounded-xl shadow-sm mb-6 border border-gray-100">
                <Text className="text-lg font-bold mb-4">New Visitor</Text>

                <TextInput
                    className="bg-gray-100 p-3 rounded-lg mb-3"
                    placeholder="Visitor Name"
                    value={visitorName}
                    onChangeText={setVisitorName}
                />

                <View className="flex-row gap-2 mb-4">
                    {['Guest', 'Delivery', 'Cab'].map(t => (
                        <TouchableOpacity
                            key={t}
                            onPress={() => setType(t)}
                            className={`px-4 py-2 rounded-full border ${type === t ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
                        >
                            <Text className={`${type === t ? 'text-white' : 'text-gray-600'}`}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    className="bg-blue-600 p-4 rounded-xl items-center"
                    onPress={handleCreate}
                    disabled={mutation.isPending}
                >
                    <Text className="text-white font-bold text-lg">
                        {mutation.isPending ? 'Generating...' : 'Generate Pass'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* History */}
            <Text className="text-lg font-bold text-gray-900 mb-3">Recent Passes</Text>
            {passes?.map(pass => (
                <View key={pass.id} className="bg-white p-4 rounded-lg mb-2 flex-row justify-between items-center border border-gray-100">
                    <View>
                        <Text className="font-bold text-gray-800">{pass.visitor_name}</Text>
                        <Text className="text-gray-500 text-xs">{pass.visitor_type} • {pass.pass_code}</Text>
                    </View>
                    <View className={`px-2 py-1 rounded text-xs ${pass.status === 'active' ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <Text className={`${pass.status === 'active' ? 'text-green-700' : 'text-gray-500'} text-xs uppercase`}>{pass.status}</Text>
                    </View>
                </View>
            ))}

            {/* QR Code Modal */}
            <Modal visible={showModal} transparent animationType="slide">
                <View className="flex-1 bg-black/80 justify-center items-center p-6">
                    <View className="bg-white p-8 rounded-2xl items-center w-full">
                        <Text className="text-2xl font-bold mb-2">Visitor Pass</Text>
                        <Text className="text-gray-500 mb-6">Show this to the guard</Text>

                        {qrCodeData && (
                            <QRCode value={qrCodeData} size={200} />
                        )}

                        <Text className="text-3xl font-mono font-bold mt-6 tracking-widest">{qrCodeData}</Text>

                        <TouchableOpacity className="mt-8" onPress={() => setShowModal(false)}>
                            <Text className="text-blue-600 text-lg font-bold">Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </ScrollView>
    );
}
