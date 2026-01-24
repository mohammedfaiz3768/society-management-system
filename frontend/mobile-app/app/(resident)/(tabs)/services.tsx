import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface ServiceItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    route: string;
    color: string;
    bg: string;
}

const ServiceItem = ({ icon, label, route, color, bg }: ServiceItemProps) => {
    const router = useRouter();
    return (
        <TouchableOpacity
            onPress={() => router.push(route as any)}
            className="w-[30%] mb-6 items-center"
        >
            <View className={`w-16 h-16 ${bg} rounded-2xl items-center justify-center mb-2 shadow-sm`}>
                <Ionicons name={icon} size={28} color={color} />
            </View>
            <Text className="text-xs font-semibold text-slate-700 text-center">{label}</Text>
        </TouchableOpacity>
    );
};

export default function ServicesScreen() {
    const services: ServiceItemProps[] = [
        { icon: 'warning-outline', label: 'Complaints', route: '/(resident)/complaints', color: '#dc2626', bg: 'bg-red-50' },
        { icon: 'newspaper-outline', label: 'Notices', route: '/(resident)/notices', color: '#2563eb', bg: 'bg-blue-50' },
        { icon: 'construct-outline', label: 'Maintenance', route: '/(resident)/maintenance', color: '#ea580c', bg: 'bg-orange-50' },
        { icon: 'document-text-outline', label: 'Documents', route: '/(resident)/documents', color: '#059669', bg: 'bg-emerald-50' },
        { icon: 'people-outline', label: 'Directory', route: '/(resident)/directory', color: '#7c3aed', bg: 'bg-violet-50' },
        { icon: 'bar-chart-outline', label: 'Polls', route: '/(resident)/polls', color: '#0891b2', bg: 'bg-cyan-50' },
        { icon: 'people-circle-outline', label: 'Family', route: '/(resident)/family', color: '#db2777', bg: 'bg-pink-50' },
        { icon: 'car-outline', label: 'Parking', route: '/(resident)/parking', color: '#4b5563', bg: 'bg-gray-100' },
        { icon: 'shield-checkmark-outline', label: 'Gate Pass', route: '/(resident)/(tabs)/gate', color: '#16a34a', bg: 'bg-green-50' },
        { icon: 'alert-circle-outline', label: 'Emergency', route: '/(resident)/sos', color: '#ef4444', bg: 'bg-red-100' },
        { icon: 'person-outline', label: 'Profile', route: '/(resident)/profile', color: '#475569', bg: 'bg-slate-100' },
    ];

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="px-6 py-4 border-b border-slate-100">
                <Text className="text-2xl font-bold text-slate-900">Services</Text>
                <Text className="text-slate-500 text-sm">Access all society features</Text>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
                <View className="flex-row flex-wrap justify-between">
                    {services.map((service, index) => (
                        <ServiceItem key={index} {...service} />
                    ))}
                    {/* Filler views to align last row if needed */}
                    <View className="w-[30%]" />
                    <View className="w-[30%]" />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
