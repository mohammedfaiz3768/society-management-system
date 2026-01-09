import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal, Alert } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createComplaint, getMyComplaints, Complaint } from '../../services/complaintService';

export default function ComplaintScreen() {
    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Maintenance');

    const queryClient = useQueryClient();

    const { data: complaints, isLoading } = useQuery({
        queryKey: ['my-complaints'],
        queryFn: getMyComplaints,
    });

    const mutation = useMutation({
        mutationFn: createComplaint,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-complaints'] });
            setShowModal(false);
            setTitle('');
            setDescription('');
            Alert.alert('Success', 'Complaint submitted successfully');
        },
        onError: (err: any) => {
            Alert.alert('Error', err.response?.data?.message || 'Failed to submit');
        }
    });

    const handleSubmit = () => {
        if (!title || !description) return Alert.alert('Missing Fields', 'Title and Description required');
        mutation.mutate({ title, description, category });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-red-100 text-red-700';
            case 'in_progress': return 'bg-yellow-100 text-yellow-700';
            case 'resolved': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const renderItem = ({ item }: { item: Complaint }) => (
        <View className="bg-white p-4 rounded-xl mb-3 border border-gray-100 shadow-sm">
            <View className="flex-row justify-between mb-2">
                <Text className="font-bold text-gray-900 text-base flex-1">{item.title}</Text>
                <View className={`px-2 py-1 rounded ${getStatusColor(item.current_status).split(' ')[0]}`}>
                    <Text className={`text-xs font-bold uppercase ${getStatusColor(item.current_status).split(' ')[1]}`}>
                        {item.current_status.replace('_', ' ')}
                    </Text>
                </View>
            </View>
            <Text className="text-gray-600 text-sm mb-2">{item.description}</Text>
            <Text className="text-gray-400 text-xs">Category: {item.category} • {new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
    );

    return (
        <View className="flex-1 bg-gray-50 pt-12 px-5">
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-bold text-gray-900">Complaints</Text>
                <TouchableOpacity onPress={() => setShowModal(true)} className="bg-blue-600 px-4 py-2 rounded-lg">
                    <Text className="text-white font-bold">+ New</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={complaints}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                ListEmptyComponent={!isLoading ? <Text className="text-center text-gray-400 mt-10">No complaints found.</Text> : null}
            />

            <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
                <View className="flex-1 bg-white p-6 pt-10">
                    <Text className="text-2xl font-bold mb-6">Raise Issue</Text>

                    <TextInput
                        className="bg-gray-100 p-4 rounded-xl mb-4 text-lg"
                        placeholder="Title (e.g., Leaking Tap)"
                        value={title}
                        onChangeText={setTitle}
                    />

                    <TextInput
                        className="bg-gray-100 p-4 rounded-xl mb-4 text-lg h-32"
                        placeholder="Describe the issue..."
                        multiline
                        textAlignVertical="top"
                        value={description}
                        onChangeText={setDescription}
                    />

                    <View className="flex-row gap-2 mb-8">
                        {['Maintenance', 'Security', 'Noise', 'Other'].map(cat => (
                            <TouchableOpacity
                                key={cat}
                                onPress={() => setCategory(cat)}
                                className={`px-4 py-2 rounded-full border ${category === cat ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
                            >
                                <Text className={category === cat ? 'text-white' : 'text-gray-600'}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        className="bg-blue-600 p-4 rounded-xl items-center mb-4"
                        onPress={handleSubmit}
                        disabled={mutation.isPending}
                    >
                        <Text className="text-white font-bold text-lg">{mutation.isPending ? 'Submitting...' : 'Submit Complaint'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setShowModal(false)} className="items-center p-2">
                        <Text className="text-gray-500 font-bold">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
}
