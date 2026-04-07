import React from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getAnnouncements } from '../../src/api/announcements/announcements.api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function AnnouncementsScreen() {
    const router = useRouter();
    const { data: rawList, isLoading } = useQuery({
        queryKey: ['announcements'],
        queryFn: getAnnouncements,
    });
    const list = Array.isArray(rawList) ? rawList : [];

    const renderItem = ({ item }: { item: any }) => {
        const type = item.type || 'general';
        const isEmergency = type === 'emergency' || type === 'urgent';
        const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString() : '';
        return (
            <View className="bg-white p-5 rounded-2xl mb-4 shadow-sm border border-slate-100">
                <View className="flex-row justify-between mb-3">
                    <View className={`px-3 py-1 rounded-full ${isEmergency ? 'bg-red-100' : 'bg-indigo-50'}`}>
                        <Text className={`text-xs font-bold uppercase ${isEmergency ? 'text-red-700' : 'text-indigo-600'}`}>
                            {type}
                        </Text>
                    </View>
                    <Text className="text-slate-400 text-xs font-medium">{dateStr}</Text>
                </View>
                <Text className="text-lg font-bold text-slate-900 mb-2 leading-tight">{item.title || ''}</Text>
                <Text className="text-slate-600 leading-relaxed text-sm">{item.message || ''}</Text>
                <View className="mt-4 pt-3 border-t border-slate-50 flex-row items-center">
                    <View className="w-6 h-6 bg-slate-200 rounded-full items-center justify-center mr-2">
                        <Ionicons name="person" size={12} color="#64748b" />
                    </View>
                    <Text className="text-slate-400 text-xs font-medium">By {item.admin_name || 'Admin'}</Text>
                </View>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-slate-50">
            <Stack.Screen options={{ headerShown: false }} />

            <LinearGradient
                colors={['#4f46e5', '#4338ca']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="pt-12 pb-6 px-4 rounded-b-3xl shadow-lg mb-4"
            >
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-white/20 rounded-full items-center justify-center border border-white/20"
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold">Announcements</Text>
                    <View className="w-10" />
                </View>
            </LinearGradient>

            {isLoading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#4f46e5" />
                </View>
            ) : (
                <FlatList
                    data={list as any[]}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ padding: 16 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View className="items-center justify-center mt-20 opacity-50">
                            <View className="w-24 h-24 bg-slate-200 rounded-full items-center justify-center mb-4">
                                <Ionicons name="megaphone-outline" size={48} color="#94a3b8" />
                            </View>
                            <Text className="text-lg font-semibold text-slate-500">No announcements</Text>
                            <Text className="text-slate-400 text-sm mt-1">Check back later</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}
