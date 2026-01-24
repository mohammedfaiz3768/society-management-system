import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMyComplaints } from '../../src/api/complaints/complaints.hooks';
import { Complaint } from '../../src/api/complaints/complaints.api';

export default function ComplaintsScreen() {
    const router = useRouter();
    const { data: complaints, isLoading } = useMyComplaints();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700';
            case 'in_progress': return 'bg-blue-100 text-blue-700';
            case 'resolved': return 'bg-green-100 text-green-700';
            case 'closed': return 'bg-slate-100 text-slate-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return 'time-outline';
            case 'in_progress': return 'construct-outline';
            case 'resolved': return 'checkmark-circle-outline';
            case 'closed': return 'close-circle-outline';
            default: return 'help-circle-outline';
        }
    };

    return (
        <View className="flex-1 bg-slate-50">
            {/* Premium Header */}
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
                    <Text className="text-white text-xl font-bold">Complaints</Text>
                    <View className="w-10" />
                </View>
            </LinearGradient>

            <ScrollView className="flex-1 px-4 mt-6">
                {/* Create New Complaint Button */}
                <TouchableOpacity
                    onPress={() => router.push('/(resident)/complaints/create')}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex-row items-center justify-between mb-6"
                    activeOpacity={0.7}
                >
                    <View className="flex-row items-center">
                        <View className="w-12 h-12 bg-red-50 rounded-full items-center justify-center mr-4">
                            <Ionicons name="add" size={28} color="#EF4444" />
                        </View>
                        <View>
                            <Text className="text-slate-900 font-bold text-lg">New Complaint</Text>
                            <Text className="text-slate-500 text-sm">Report an issue</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#CBD5E1" />
                </TouchableOpacity>

                {/* Loading State */}
                {isLoading && (
                    <View className="py-12 items-center">
                        <ActivityIndicator size="large" color="#EF4444" />
                        <Text className="text-slate-500 mt-4">Loading complaints...</Text>
                    </View>
                )}

                {/* Complaints List */}
                {!isLoading && complaints && complaints.length > 0 && (
                    <View className="mb-6">
                        <Text className="text-slate-700 font-bold text-lg mb-4 ml-1">My Complaints</Text>
                        {complaints.map((complaint: Complaint) => (
                            <View
                                key={complaint.id}
                                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-3"
                            >
                                <View className="flex-row items-start justify-between mb-3">
                                    <View className="flex-1 mr-3">
                                        <Text className="text-slate-900 font-bold text-base mb-1">
                                            {complaint.title}
                                        </Text>
                                        {complaint.description && (
                                            <Text className="text-slate-600 text-sm leading-5" numberOfLines={2}>
                                                {complaint.description}
                                            </Text>
                                        )}
                                    </View>
                                    <View className={`px-3 py-1 rounded-full ${getStatusColor(complaint.status)}`}>
                                        <Text className="text-xs font-semibold capitalize">
                                            {complaint.status.replace('_', ' ')}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row items-center justify-between pt-3 border-t border-slate-100">
                                    <View className="flex-row items-center">
                                        <Ionicons name={getStatusIcon(complaint.status) as any} size={16} color="#94a3b8" />
                                        <Text className="text-slate-500 text-xs ml-1">
                                            {new Date(complaint.created_at).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </Text>
                                    </View>
                                    {complaint.admin_comment && (
                                        <View className="flex-row items-center">
                                            <Ionicons name="chatbox-outline" size={16} color="#94a3b8" />
                                            <Text className="text-slate-500 text-xs ml-1">Admin reply</Text>
                                        </View>
                                    )}
                                </View>

                                {complaint.admin_comment && (
                                    <View className="mt-3 p-3 bg-slate-50 rounded-xl">
                                        <Text className="text-slate-700 font-semibold text-xs mb-1">Admin Response:</Text>
                                        <Text className="text-slate-600 text-sm leading-5">
                                            {complaint.admin_comment}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {/* Empty State */}
                {!isLoading && (!complaints || complaints.length === 0) && (
                    <View className="items-center justify-center py-12">
                        <View className="w-40 h-40 bg-slate-100 rounded-full items-center justify-center mb-6 border-4 border-white shadow-sm">
                            <Ionicons name="checkmark-done-circle-outline" size={80} color="#94a3b8" />
                        </View>
                        <Text className="text-xl font-bold text-slate-800 mb-2">All Clear!</Text>
                        <Text className="text-slate-500 text-center leading-6 px-8">
                            You have no complaints.{'\n'}Enjoy your day!
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
