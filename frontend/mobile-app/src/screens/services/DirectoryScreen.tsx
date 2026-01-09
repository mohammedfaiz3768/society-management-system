import React, { useState } from 'react';
import { View, Text, FlatList, TextInput } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getDirectory, Resident } from '../../services/directoryService';

import SkeletonLoader from '../../components/SkeletonLoader';

export default function DirectoryScreen() {
    const [search, setSearch] = useState('');
    const { data: residents, isLoading } = useQuery({
        queryKey: ['directory'],
        queryFn: getDirectory,
    });

    const filteredResidents = residents?.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.flat_number.includes(search)
    );

    const DirectorySkeleton = () => (
        <View className="flex-1 bg-gray-50 pt-12 px-5">
            <SkeletonLoader width={150} height={28} style={{ marginBottom: 16 }} />
            <SkeletonLoader width="100%" height={48} borderRadius={12} style={{ marginBottom: 24 }} />

            {[1, 2, 3, 4, 5].map(key => (
                <View key={key} className="bg-white p-4 rounded-xl mb-3 flex-row items-center border border-gray-100">
                    <SkeletonLoader width={40} height={40} borderRadius={20} style={{ marginRight: 16 }} />
                    <View>
                        <SkeletonLoader width={120} height={18} style={{ marginBottom: 6 }} />
                        <SkeletonLoader width={80} height={12} />
                    </View>
                </View>
            ))}
        </View>
    );

    const renderItem = ({ item }: { item: Resident }) => (
        <View className="bg-white p-4 rounded-xl mb-3 flex-row items-center border border-gray-100">
            <View className="h-10 w-10 bg-indigo-100 rounded-full items-center justify-center mr-4">
                <Text className="text-indigo-600 font-bold text-lg">{item.name.charAt(0)}</Text>
            </View>
            <View>
                <Text className="font-bold text-gray-900">{item.name}</Text>
                <Text className="text-gray-500 text-xs">Block {item.block} • Flat {item.flat_number}</Text>
            </View>
        </View>
    );

    if (isLoading && !residents) {
        return <DirectorySkeleton />;
    }

    return (
        <View className="flex-1 bg-gray-50 pt-12 px-5">
            <Text className="text-2xl font-bold text-gray-900 mb-4">Directory</Text>

            <TextInput
                className="bg-white p-3 rounded-xl border border-gray-200 mb-6"
                placeholder="Search neighbors..."
                value={search}
                onChangeText={setSearch}
            />

            <FlatList
                data={filteredResidents}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={{ paddingBottom: 100 }}
            />
        </View>
    );
}
