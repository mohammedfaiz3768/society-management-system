import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getDocuments, downloadDocumentUrl } from '../../src/api/documents/documents.api';
import { Ionicons } from '@expo/vector-icons';

export default function DocumentsScreen() {
    const { data: docs, isLoading } = useQuery({
        queryKey: ['documents'],
        queryFn: getDocuments,
    });

    const handleDownload = (id: number, title: string) => {
        const url = downloadDocumentUrl(id);
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    const renderDoc = ({ item }: { item: any }) => (
        <TouchableOpacity
            onPress={() => handleDownload(item.id, item.title)}
            className="bg-white p-4 rounded-xl mb-3 shadow-sm border border-slate-100 flex-row items-center"
        >
            <View className="h-12 w-12 rounded-lg bg-orange-100 items-center justify-center mr-4">
                <Ionicons name="document-text" size={24} color="#ea580c" />
            </View>
            <View className="flex-1">
                <Text className="font-bold text-slate-900 text-base">{item.title}</Text>
                {item.description && (
                    <Text className="text-slate-500 text-sm mt-0.5" numberOfLines={1}>{item.description}</Text>
                )}
                <Text className="text-slate-400 text-xs mt-1">
                    {new Date(item.created_at).toLocaleDateString()}
                </Text>
            </View>
            <Ionicons name="download-outline" size={20} color="#94a3b8" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-50 px-4 pt-2">
            <Stack.Screen options={{ title: 'Documents', headerShadowVisible: false }} />

            {isLoading ? (
                <ActivityIndicator size="large" color="#ea580c" className="mt-10" />
            ) : (
                <FlatList
                    data={docs}
                    renderItem={renderDoc}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                        <View className="items-center mt-20">
                            <Ionicons name="folder-open-outline" size={48} color="#cbd5e1" />
                            <Text className="text-slate-400 mt-2">No documents shared</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
