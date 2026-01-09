import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getEvents, Event } from '../../services/eventService';

import SkeletonLoader from '../../components/SkeletonLoader';

export default function EventsScreen() {
    const { data: events, isLoading } = useQuery({
        queryKey: ['events'],
        queryFn: getEvents,
    });

    const EventSkeleton = () => (
        <View className="flex-1 bg-gray-50 pt-12 px-5">
            <SkeletonLoader width={200} height={28} style={{ marginBottom: 24 }} />

            {[1, 2, 3].map(key => (
                <View key={key} className="bg-white p-5 rounded-xl mb-4 shadow-sm border border-gray-100">
                    <View className="flex-row justify-between mb-2">
                        <SkeletonLoader width="60%" height={20} />
                        <SkeletonLoader width="25%" height={24} />
                    </View>
                    <SkeletonLoader width="100%" height={14} style={{ marginBottom: 6 }} />
                    <SkeletonLoader width="90%" height={14} style={{ marginBottom: 12 }} />
                    <SkeletonLoader width="50%" height={12} />
                </View>
            ))}
        </View>
    );

    const renderEvent = ({ item }: { item: Event }) => (
        <View className="bg-white p-5 rounded-xl mb-4 shadow-sm border border-gray-100">
            <View className="flex-row justify-between mb-2">
                <Text className="text-lg font-bold text-gray-900 flex-1">{item.title}</Text>
                <View className="bg-blue-50 px-3 py-1 rounded">
                    <Text className="text-blue-700 font-bold text-xs">{new Date(item.event_date).toLocaleDateString()}</Text>
                </View>
            </View>
            <Text className="text-gray-600 mb-3">{item.description}</Text>
            <View className="flex-row items-center">
                <Text className="text-gray-400 text-xs">📍 {item.location} • By {item.organizer_name}</Text>
            </View>
        </View>
    );

    if (isLoading && !events) {
        return <EventSkeleton />;
    }

    return (
        <View className="flex-1 bg-gray-50 pt-12 px-5">
            <Text className="text-2xl font-bold text-gray-900 mb-6">Upcoming Events</Text>
            <FlatList
                data={events}
                renderItem={renderEvent}
                keyExtractor={item => item.id.toString()}
                ListEmptyComponent={!isLoading ? <Text className="text-center text-gray-400 mt-10">No upcoming events.</Text> : null}
            />
        </View>
    );
}
