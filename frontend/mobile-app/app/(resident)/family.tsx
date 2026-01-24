import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyFlat, getFamilyMembers, addFamilyMember } from '../../src/api/family/family.api';
import { Ionicons } from '@expo/vector-icons';

export default function FamilyScreen() {
    const queryClient = useQueryClient();
    const [isWrapperOpen, setWrapperOpen] = useState(false); // Modal visibility
    const [newUser, setNewUser] = useState({ name: '', phone: '', relation: 'Family' });

    const { data: flat, isLoading: loadingFlat, error: flatError } = useQuery({
        queryKey: ['my-flat'],
        queryFn: getMyFlat,
        retry: 1,
    });

    const { data: members, isLoading: loadingMembers, error: membersError } = useQuery({
        queryKey: ['family-members'],
        queryFn: getFamilyMembers,
        enabled: !!flat,
        retry: 1,
    });

    const addMutation = useMutation({
        mutationFn: () => {
            if (!flat?.id) throw new Error("Flat not loaded");
            return addFamilyMember(flat.id, newUser.name, newUser.phone, newUser.relation);
        },
        onSuccess: () => {
            setWrapperOpen(false);
            setNewUser({ name: '', phone: '', relation: 'Family' });
            queryClient.invalidateQueries({ queryKey: ['family-members'] });
            Alert.alert("Success", "Family member added!");
        },
        onError: (err: any) => {
            Alert.alert("Error", err.response?.data?.message || "Failed to add member");
        }
    });

    const handleAdd = () => {
        if (!newUser.name) return Alert.alert("Required", "Name is required");
        addMutation.mutate();
    };

    const renderMember = ({ item }: { item: any }) => (
        <View className="bg-white p-4 rounded-xl mb-3 shadow-sm border border-slate-100 flex-row items-center justify-between">
            <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-pink-100 items-center justify-center mr-3">
                    <Text className="text-pink-600 font-bold">{item.name.charAt(0)}</Text>
                </View>
                <View>
                    <Text className="font-bold text-slate-900">{item.name}</Text>
                    <Text className="text-slate-500 text-xs">{item.relation} • {item.phone}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-50 px-4 pt-2">
            <Stack.Screen options={{ title: 'My Family', headerShadowVisible: false }} />

            {loadingFlat ? (
                <View className="items-center mt-10">
                    <ActivityIndicator size="large" color="#db2777" />
                    <Text className="text-slate-500 mt-4">Loading family details...</Text>
                </View>
            ) : flatError ? (
                <View className="items-center mt-10 px-6">
                    <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
                    <Text className="text-slate-900 font-bold text-lg mt-4 text-center">Unable to Load</Text>
                    <Text className="text-slate-500 mt-2 text-center">
                        Family module not available. Please contact admin.
                    </Text>
                </View>
            ) : flat ? (
                <View>
                    <View className="bg-pink-600 rounded-2xl p-6 mb-6 shadow-md shadow-pink-200">
                        <Text className="text-pink-100 text-sm uppercase font-bold">My Residence</Text>
                        <Text className="text-white text-3xl font-bold mt-1">{flat.block}-{flat.flat_number}</Text>
                        <Text className="text-white opacity-80 mt-1">Floor {flat.floor}</Text>
                    </View>

                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-bold text-slate-900">Members</Text>
                        <TouchableOpacity onPress={() => setWrapperOpen(true)} className="flex-row items-center">
                            <Ionicons name="add-circle" size={20} color="#db2777" />
                            <Text className="text-pink-600 font-bold ml-1">Add Member</Text>
                        </TouchableOpacity>
                    </View>

                    {loadingMembers ? (
                        <ActivityIndicator />
                    ) : (
                        <FlatList
                            data={members}
                            renderItem={renderMember}
                            keyExtractor={item => item.id.toString()}
                            ListEmptyComponent={<Text className="text-slate-400 text-center py-4">No members added yet</Text>}
                        />
                    )}
                </View>
            ) : (
                <View className="items-center mt-20">
                    <Text className="text-slate-400">Flat not assigned</Text>
                </View>
            )}

            {/* Add Member Modal */}
            <Modal visible={isWrapperOpen} animationType="slide" transparent>
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl p-6">
                        <Text className="text-xl font-bold mb-4">Add Family Member</Text>

                        <Text className="text-slate-600 mb-1">Name</Text>
                        <TextInput
                            value={newUser.name}
                            onChangeText={t => setNewUser({ ...newUser, name: t })}
                            className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3"
                            placeholder="Full Name"
                        />

                        <Text className="text-slate-600 mb-1">Phone</Text>
                        <TextInput
                            value={newUser.phone}
                            onChangeText={t => setNewUser({ ...newUser, phone: t })}
                            className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3"
                            placeholder="Mobile Number"
                            keyboardType="phone-pad"
                        />

                        <Text className="text-slate-600 mb-1">Relation</Text>
                        <TextInput
                            value={newUser.relation}
                            onChangeText={t => setNewUser({ ...newUser, relation: t })}
                            className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-6"
                            placeholder="e.g. Spouse, Child, Parent"
                        />

                        <TouchableOpacity
                            onPress={handleAdd}
                            disabled={addMutation.isPending}
                            className="bg-pink-600 p-4 rounded-xl items-center mb-2"
                        >
                            <Text className="text-white font-bold">{addMutation.isPending ? "Adding..." : "Add Member"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setWrapperOpen(false)}
                            className="p-4 rounded-xl items-center"
                        >
                            <Text className="text-slate-500 font-bold">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
