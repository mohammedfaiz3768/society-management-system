import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyBills } from '../../src/api/maintenance/maintenance.api';
import { apiClient } from '../../src/api/client';
import { Ionicons } from '@expo/vector-icons';

interface MaintenanceBill {
    id: number;
    flat_number: string;
    month: number;
    year: number;
    amount: string;
    status: string;
    created_at: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
    PAID: { bg: '#dcfce7', text: '#15803d' },
    PENDING: { bg: '#fef9c3', text: '#854d0e' },
    OVERDUE: { bg: '#fee2e2', text: '#b91c1c' },
    CANCELLED: { bg: '#f1f5f9', text: '#64748b' },
};

function monthName(month: number) {
    return new Date(0, month - 1).toLocaleString('default', { month: 'long' });
}

export default function MaintenanceScreen() {
    const queryClient = useQueryClient();
    const [payingId, setPayingId] = useState<number | null>(null);

    const { data: bills = [], isLoading } = useQuery({
        queryKey: ['maintenance'],
        queryFn: getMyBills,
    });

    const payMutation = useMutation({
        mutationFn: async (bill: MaintenanceBill) => {
            const res = await apiClient.post('/payments/create-order', { bill_id: bill.id });
            return { order: res.data.order, bill };
        },
        onSuccess: ({ order, bill }) => {
            // react-native-razorpay is not installed; show order details and instructions
            Alert.alert(
                'Payment Order Created',
                `Order ID: ${order.id}\n\nAmount: ₹${(order.amount / 100).toLocaleString('en-IN')}\n\nPlease complete the payment through the web dashboard or contact admin.`,
                [{ text: 'OK' }]
            );
        },
        onError: (err: any) => {
            Alert.alert('Payment Failed', err.message || 'Could not initiate payment. Please try again.');
        },
        onSettled: () => {
            setPayingId(null);
        },
    });

    const handlePay = (bill: MaintenanceBill) => {
        Alert.alert(
            'Confirm Payment',
            `Pay ₹${Number(bill.amount).toLocaleString('en-IN')} for ${monthName(bill.month)} ${bill.year}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Proceed',
                    onPress: () => {
                        setPayingId(bill.id);
                        payMutation.mutate(bill);
                    },
                },
            ]
        );
    };

    const totalPending = (bills as MaintenanceBill[])
        .filter(b => b.status === 'PENDING' || b.status === 'OVERDUE')
        .reduce((s, b) => s + Number(b.amount), 0);

    const renderBill = ({ item }: { item: MaintenanceBill }) => {
        const style = STATUS_STYLES[item.status] ?? STATUS_STYLES.PENDING;
        const isPaying = payingId === item.id;
        const canPay = item.status === 'PENDING' || item.status === 'OVERDUE';

        return (
            <View
                style={{
                    backgroundColor: '#fff',
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: item.status === 'OVERDUE' ? '#fca5a5' : '#f1f5f9',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                }}
            >
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>
                        {monthName(item.month)} {item.year}
                    </Text>
                    <Text style={{ color: '#64748b', fontSize: 14, marginTop: 2 }}>
                        ₹{Number(item.amount).toLocaleString('en-IN')}
                    </Text>
                    <View
                        style={{
                            marginTop: 6,
                            alignSelf: 'flex-start',
                            backgroundColor: style.bg,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 99,
                        }}
                    >
                        <Text style={{ color: style.text, fontSize: 11, fontWeight: '700' }}>
                            {item.status}
                        </Text>
                    </View>
                </View>

                {canPay && (
                    <TouchableOpacity
                        onPress={() => handlePay(item)}
                        disabled={isPaying}
                        style={{
                            backgroundColor: item.status === 'OVERDUE' ? '#dc2626' : '#2563eb',
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 8,
                            opacity: isPaying ? 0.6 : 1,
                            minWidth: 80,
                            alignItems: 'center',
                        }}
                    >
                        {isPaying ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                                PAY NOW
                            </Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <Stack.Screen options={{ title: 'Maintenance Bills', headerShadowVisible: false }} />

            <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
                <Text style={{ fontSize: 24, fontWeight: '700', color: '#0f172a' }}>Bills</Text>
                {totalPending > 0 && (
                    <View
                        style={{
                            marginTop: 12,
                            backgroundColor: '#fef3c7',
                            borderRadius: 10,
                            padding: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <Ionicons name="alert-circle-outline" size={20} color="#b45309" />
                        <Text style={{ color: '#b45309', fontWeight: '600', fontSize: 14 }}>
                            ₹{totalPending.toLocaleString('en-IN')} pending payment
                        </Text>
                    </View>
                )}
            </View>

            {isLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#0f172a" />
                </View>
            ) : (
                <FlatList
                    data={bills as MaintenanceBill[]}
                    renderItem={renderBill}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 80 }}>
                            <Ionicons name="receipt-outline" size={48} color="#cbd5e1" />
                            <Text style={{ color: '#94a3b8', marginTop: 8, fontSize: 15 }}>No bills found</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
