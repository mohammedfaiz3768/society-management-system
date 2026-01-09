import React from 'react';
import { View } from 'react-native';
import SkeletonLoader from '../../components/SkeletonLoader';

const HomeSkeleton = () => (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900 pt-12 px-5">
        {/* Header Skeleton */}
        <View className="mb-6">
            <View className="flex-row justify-between items-center mb-6">
                <View>
                    <SkeletonLoader width={100} height={14} style={{ marginBottom: 8 }} />
                    <SkeletonLoader width={180} height={32} />
                </View>
                <SkeletonLoader width={80} height={32} borderRadius={999} />
            </View>

            {/* Quick Stats Skeleton */}
            <View className="flex-row justify-between mt-2 mb-6">
                <SkeletonLoader width="30%" height={80} borderRadius={12} />
                <SkeletonLoader width="30%" height={80} borderRadius={12} />
                <SkeletonLoader width="30%" height={80} borderRadius={12} />
            </View>

            {/* Action Grid Skeleton */}
            <View className="flex-row flex-wrap gap-3 mb-6">
                <SkeletonLoader width="48%" height={100} borderRadius={12} />
                <SkeletonLoader width="48%" height={100} borderRadius={12} style={{ marginTop: 12 }} />
                <SkeletonLoader width="48%" height={100} borderRadius={12} />
                <SkeletonLoader width="48%" height={100} borderRadius={12} style={{ marginTop: 12 }} />
            </View>

            <SkeletonLoader width={200} height={24} style={{ marginBottom: 12 }} />
        </View>

        {/* Notices Skeleton List */}
        {[1, 2, 3].map((key) => (
            <View key={key} className="bg-white dark:bg-gray-800 p-4 rounded-xl mb-3 shadow-sm border border-gray-100 dark:border-gray-700">
                <View className="flex-row justify-between mb-2">
                    <SkeletonLoader width="70%" height={20} />
                    <SkeletonLoader width="20%" height={14} />
                </View>
                <SkeletonLoader width="100%" height={14} style={{ marginBottom: 6 }} />
                <SkeletonLoader width="90%" height={14} style={{ marginBottom: 6 }} />
                <SkeletonLoader width="60%" height={14} />
            </View>
        ))}
    </View>
);

export default HomeSkeleton;
