import React from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { listSosAlerts, respondToSos, resolveSos, SosAlert } from '../../../src/api/sos/sos.api';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    ACTIVE: { color: 'text-red-700', bg: 'bg-red-100', label: 'Active' },
    RESPONDING: { color: 'text-orange-700', bg: 'bg-orange-100', label: 'Responding' },
    RESOLVED: { color: 'text-green-700', bg: 'bg-green-100', label: 'Resolved' },
};

const TYPE_ICONS: Record<string, string> = {
    fire: 'flame-outline',
    medical: 'medkit-outline',
    security: 'shield-outline',
    general: 'alert-circle-outline',
};

export default function GuardAlertsScreen() {
    const queryClient = useQueryClient();

    const { data: alerts, isLoading, refetch } = useQuery({
        queryKey: ['sos', 'all'],
        queryFn: listSosAlerts,
        refetchInterval: 15000, // auto-refresh every 15s
    });

    const respondMutation = useMutation({
        mutationFn: respondToSos,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sos', 'all'] });
        },
        onError: (err: any) => {
            Alert.alert('Error', err.message || 'Failed to respond');
        },
    });

    const resolveMutation = useMutation({
        mutationFn: resolveSos,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sos', 'all'] });
        },
        onError: (err: any) => {
            Alert.alert('Error', err.message || 'Failed to resolve');
        },
    });

    const handleRespond = (sos: SosAlert) => {
        Alert.alert('Respond to SOS', `Mark yourself as responding to ${sos.user_name}'s alert?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Respond', onPress: () => respondMutation.mutate(sos.id) },
        ]);
    };

    const handleResolve = (sos: SosAlert) => {
        Alert.alert('Resolve SOS', `Mark this SOS from ${sos.user_name} as resolved?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Resolve', style: 'destructive', onPress: () => resolveMutation.mutate(sos.id) },
        ]);
    };

    const activeAlerts = alerts?.filter(a => a.status !== 'RESOLVED') || [];
    const resolvedAlerts = alerts?.filter(a => a.status === 'RESOLVED') || [];

    const renderItem = ({ item }: { item: SosAlert }) => {
        const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.ACTIVE;
        const iconName = (TYPE_ICONS[item.emergency_type] || TYPE_ICONS.general) as any;
        const isActive = item.status === 'ACTIVE';
        const isResponding = item.status === 'RESPONDING';

        return (
            <View className={`bg-white rounded-xl mb-3 border shadow-sm overflow-hidden ${isActive ? 'border-red-200' : 'border-gray-100'}`}>
                <View className={`px-4 py-2 flex-row items-center justify-between ${isActive ? 'bg-red-50' : 'bg-gray-50'}`}>
                    <View className="flex-row items-center gap-2">
                        <Ionicons name={iconName} size={18} color={isActive ? '#dc2626' : '#64748b'} />
                        <Text className={`font-bold uppercase text-sm ${isActive ? 'text-red-700' : 'text-slate-600'}`}>
                            {item.emergency_type}
                        </Text>
                    </View>
                    <View className={`px-2 py-1 rounded-full ${statusCfg.bg}`}>
                        <Text className={`text-xs font-bold ${statusCfg.color}`}>{statusCfg.label}</Text>
                    </View>
                </View>

                <View className="px-4 py-3">
                    <Text className="font-bold text-slate-900 text-base">{item.user_name}</Text>
                    {item.flat && (
                        <Text className="text-slate-500 text-sm">
                            {item.block ? `${item.block} - ` : ''}Flat {item.flat}
                        </Text>
                    )}
                    <Text className="text-slate-600 text-sm mt-1">{item.message}</Text>
                    <Text className="text-slate-400 text-xs mt-2">
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' · '}
                        {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </View>

                {(isActive || isResponding) && (
                    <View className="flex-row border-t border-gray-100">
                        {isActive && (
                            <TouchableOpacity
                                onPress={() => handleRespond(item)}
                                disabled={respondMutation.isPending}
                                className="flex-1 py-3 items-center border-r border-gray-100"
                            >
                                <Text className="text-orange-600 font-semibold text-sm">Responding</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={() => handleResolve(item)}
                            disabled={resolveMutation.isPending}
                            className="flex-1 py-3 items-center"
                        >
                            <Text className="text-green-600 font-semibold text-sm">Resolve</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 px-4 pt-4">
            <View className="mb-6 flex-row items-center justify-between">
                <View>
                    <Text className="text-2xl font-bold text-gray-900">SOS Alerts</Text>
                    <Text className="text-gray-500">
                        {activeAlerts.length > 0
                            ? `${activeAlerts.length} active alert${activeAlerts.length > 1 ? 's' : ''}`
                            : 'No active alerts'}
                    </Text>
                </View>
                {activeAlerts.length > 0 && (
                    <View className="w-8 h-8 bg-red-600 rounded-full items-center justify-center">
                        <Text className="text-white font-bold text-sm">{activeAlerts.length}</Text>
                    </View>
                )}
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color="#0f172a" />
            ) : (
                <FlatList
                    data={[...activeAlerts, ...resolvedAlerts]}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
                    ListEmptyComponent={
                        <View className="py-16 items-center">
                            <Ionicons name="shield-checkmark-outline" size={56} color="#94a3b8" />
                            <Text className="text-slate-500 mt-4 font-semibold">All Clear</Text>
                            <Text className="text-slate-400 text-sm mt-1">No SOS alerts in your society</Text>
                        </View>
                    }
                    ListFooterComponent={
                        resolvedAlerts.length > 0 && activeAlerts.length > 0
                            ? <Text className="text-xs text-slate-400 text-center mb-4 mt-2">— Resolved above —</Text>
                            : null
                    }
                />
            )}
        </SafeAreaView>
    );
}
