import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateGatePassSchema, type CreateGatePass, GatePassTypeEnum } from '../../../src/api/gatepass/gatepass.schema';
import { useCreateGatePass } from '../../../src/api/gatepass/gatepass.hooks';

/**
 * Create Gate Pass Screen
 * 
 * Form fields:
 * - Guest Name
 * - Guest Phone
 * - Type (Visitor/Delivery/Cab)
 * - Valid From/To
 * - Vehicle Number (optional)
 * - Purpose (optional)
 * 
 * On submit: Creates PENDING pass, shows confirmation
 */

export default function CreateGatePassScreen() {
    const router = useRouter();
    const createMutation = useCreateGatePass();
    const [selectedType, setSelectedType] = useState<'Visitor' | 'Delivery' | 'Cab'>('Visitor');

    const { control, handleSubmit, formState: { errors } } = useForm<CreateGatePass>({
        resolver: zodResolver(CreateGatePassSchema) as any,
        defaultValues: {
            type: 'Visitor',
            validFrom: new Date(),
            validTo: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        },
    });

    const onSubmit = async (data: CreateGatePass) => {
        try {
            await createMutation.mutateAsync({
                ...data,
                type: selectedType,
            });
            Alert.alert(
                'Success',
                'Gate pass created! It will be active once approved by the guard.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to create gate pass');
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="px-6 py-4 border-b border-slate-200 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Text className="text-slate-600 text-lg">← Back</Text>
                </TouchableOpacity>
                <Text className="text-xl font-bold text-slate-900">Create Gate Pass</Text>
            </View>

            <ScrollView className="flex-1 px-6 py-6" keyboardShouldPersistTaps="handled">
                {/* Type Selector */}
                <View className="mb-6">
                    <Text className="text-sm font-medium text-slate-700 mb-2">Pass Type</Text>
                    <View className="flex-row gap-3">
                        {(['Visitor', 'Delivery', 'Cab'] as const).map((type) => (
                            <TouchableOpacity
                                key={type}
                                onPress={() => setSelectedType(type)}
                                className={`flex-1 py-3 rounded-xl border ${selectedType === type
                                    ? 'bg-slate-900 border-slate-900'
                                    : 'bg-white border-slate-200'
                                    }`}
                            >
                                <Text
                                    className={`text-center font-medium ${selectedType === type ? 'text-white' : 'text-slate-700'
                                        }`}
                                >
                                    {type}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Guest Name */}
                <View className="mb-4">
                    <Text className="text-sm font-medium text-slate-700 mb-1.5">Guest Name *</Text>
                    <Controller
                        control={control}
                        name="guestName"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900"
                                placeholder="John Doe"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                            />
                        )}
                    />
                    {errors.guestName && (
                        <Text className="text-red-500 text-sm mt-1">{errors.guestName.message}</Text>
                    )}
                </View>

                {/* Guest Phone */}
                <View className="mb-4">
                    <Text className="text-sm font-medium text-slate-700 mb-1.5">Guest Phone *</Text>
                    <Controller
                        control={control}
                        name="guestPhone"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900"
                                placeholder="9876543210"
                                keyboardType="phone-pad"
                                maxLength={10}
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                            />
                        )}
                    />
                    {errors.guestPhone && (
                        <Text className="text-red-500 text-sm mt-1">{errors.guestPhone.message}</Text>
                    )}
                </View>

                {/* Vehicle Number (Optional) */}
                <View className="mb-4">
                    <Text className="text-sm font-medium text-slate-700 mb-1.5">Vehicle Number</Text>
                    <Controller
                        control={control}
                        name="vehicleNumber"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900"
                                placeholder="KA-01-AB-1234"
                                autoCapitalize="characters"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                            />
                        )}
                    />
                </View>

                {/* Purpose (Optional) */}
                <View className="mb-6">
                    <Text className="text-sm font-medium text-slate-700 mb-1.5">Purpose</Text>
                    <Controller
                        control={control}
                        name="purpose"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900"
                                placeholder="Personal visit"
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                            />
                        )}
                    />
                </View>

                {/* Info Box */}
                <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <Text className="text-sm text-blue-900">
                        ℹ️ Your pass will be valid for 24 hours from creation. A guard must approve it before it becomes active.
                    </Text>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    onPress={handleSubmit(onSubmit)}
                    disabled={createMutation.isPending}
                    className={`w-full bg-slate-900 rounded-xl py-4 items-center ${createMutation.isPending ? 'opacity-70' : ''
                        }`}
                >
                    {createMutation.isPending ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-semibold text-base">Create Pass</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
