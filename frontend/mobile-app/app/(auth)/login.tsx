import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { sendOtp } from '../../src/api/auth/auth.api';

// Schema
const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
    const router = useRouter();
    const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const sendOtpMutation = useMutation({
        mutationFn: (data: LoginFormData) => sendOtp(data),
        onSuccess: (_, variables) => {
            router.push({
                pathname: '/(auth)/otp',
                params: { email: variables.email }
            });
        },
        onError: (error: any) => {
            Alert.alert('Login Failed', error.message || 'Something went wrong');
        }
    });

    const onSubmit = (data: LoginFormData) => {
        sendOtpMutation.mutate(data);
    };

    return (
        <SafeAreaView className="flex-1 bg-white p-6 justify-center">
            <StatusBar style="dark" />
            <View className="mb-10 items-center">
                {/* Placeholder Logo */}
                <View className="w-24 h-24 bg-slate-200 rounded-2xl mb-4 items-center justify-center">
                    <Text className="text-3xl">🏙️</Text>
                </View>
                <Text className="text-2xl font-bold text-slate-900">Welcome Back</Text>
                <Text className="text-slate-500 mt-2">Sign in to manage your society</Text>
            </View>

            <View className="space-y-4">
                <View>
                    <Text className="text-sm font-medium text-slate-700 mb-1.5">Email Address</Text>
                    <Controller
                        control={control}
                        name="email"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900"
                                placeholder="name@example.com"
                                placeholderTextColor="#94a3b8"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        )}
                    />
                    {errors.email && (
                        <Text className="text-red-500 text-sm mt-1">{errors.email.message}</Text>
                    )}
                </View>

                <TouchableOpacity
                    onPress={handleSubmit(onSubmit)}
                    disabled={sendOtpMutation.isPending}
                    className={`w-full bg-slate-900 rounded-xl py-4 items-center ${sendOtpMutation.isPending ? 'opacity-70' : ''}`}
                >
                    {sendOtpMutation.isPending ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-semibold text-base">Send OTP</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
