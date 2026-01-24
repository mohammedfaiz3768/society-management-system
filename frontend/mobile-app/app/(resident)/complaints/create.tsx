import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCreateComplaint } from '../../../src/api/complaints/complaints.hooks';

export default function CreateComplaintScreen() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const createMutation = useCreateComplaint();

    const handleSubmit = async () => {
        if (!title.trim()) {
            Alert.alert('Required', 'Please enter a complaint title');
            return;
        }

        try {
            await createMutation.mutateAsync({ title, description });
            Alert.alert('Success', 'Complaint submitted successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to submit complaint');
        }
    };

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <LinearGradient
                colors={['#EF4444', '#B91C1C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="pt-12 pb-6 px-4 rounded-b-3xl shadow-lg shadow-red-500/30"
            >
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-white/20 rounded-full items-center justify-center border border-white/20"
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold">New Complaint</Text>
                    <View className="w-10" />
                </View>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView className="flex-1 px-4 mt-6">
                    {/* Title Input */}
                    <View className="mb-6">
                        <Text className="text-slate-700 font-semibold mb-3 ml-1">Complaint Title *</Text>
                        <View className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                            <TextInput
                                value={title}
                                onChangeText={setTitle}
                                placeholder="e.g., Water leakage in flat"
                                placeholderTextColor="#94a3b8"
                                className="text-slate-900 text-base"
                            />
                        </View>
                    </View>

                    {/* Description Input */}
                    <View className="mb-6">
                        <Text className="text-slate-700 font-semibold mb-3 ml-1">Description (Optional)</Text>
                        <View className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                            <TextInput
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Provide details about the issue..."
                                placeholderTextColor="#94a3b8"
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                                className="text-slate-900 text-base min-h-[120px]"
                            />
                        </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={createMutation.isPending}
                        className="mb-6"
                    >
                        <LinearGradient
                            colors={createMutation.isPending ? ['#94a3b8', '#64748b'] : ['#EF4444', '#B91C1C']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            className="p-4 rounded-2xl shadow-lg shadow-red-500/30"
                        >
                            <Text className="text-white text-center font-bold text-lg">
                                {createMutation.isPending ? 'Submitting...' : 'Submit Complaint'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Info Card */}
                    <View className="bg-amber-50 p-4 rounded-2xl border border-amber-200 mb-6">
                        <View className="flex-row items-start">
                            <Ionicons name="information-circle" size={24} color="#F59E0B" />
                            <View className="flex-1 ml-3">
                                <Text className="text-amber-900 font-semibold mb-1">Note</Text>
                                <Text className="text-amber-800 text-sm leading-5">
                                    Your complaint will be reviewed by the society admin. You'll be notified once it's addressed.
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
