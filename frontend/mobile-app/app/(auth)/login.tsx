import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { sendOtp } from '../../src/api/auth/auth.api';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

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
        <View className="flex-1">
            <StatusBar style="light" />
            <LinearGradient
                colors={['#0f172a', '#1e293b']}
                style={{ flex: 1 }}
            >
                <SafeAreaView className="flex-1">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        className="flex-1"
                    >
                        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-6">

                            <View className="items-center mb-10">
                                <View className="w-24 h-24 bg-indigo-500/20 rounded-3xl items-center justify-center mb-6 border border-indigo-500/30 shadow-lg shadow-indigo-500/20">
                                    <Text className="text-5xl">🏙️</Text>
                                </View>
                                <Text className="text-4xl font-bold text-white mb-2 text-center">Welcome Back</Text>
                                <Text className="text-slate-400 text-base text-center">
                                    Sign in to manage your society
                                    {'\n'}
                                    <Text className="text-indigo-400 font-medium">seamlessly & securely</Text>
                                </Text>
                            </View>

                            <View className="bg-white/5 p-6 rounded-3xl border border-white/10">
                                <View className="mb-6">
                                    <Text className="text-slate-300 font-semibold mb-2 ml-1">Email Address</Text>
                                    <Controller
                                        control={control}
                                        name="email"
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <View className={`flex-row items-center h-14 bg-slate-900/50 rounded-xl px-4 border ${errors.email ? 'border-red-500' : 'border-white/10 focus:border-indigo-500'}`}>
                                                <Ionicons name="mail-outline" size={20} color="#94a3b8" />
                                                <TextInput
                                                    className="flex-1 ml-3 text-white text-base font-medium h-full"
                                                    placeholder="name@example.com"
                                                    placeholderTextColor="#64748b"
                                                    onBlur={onBlur}
                                                    onChangeText={onChange}
                                                    value={value}
                                                    autoCapitalize="none"
                                                    keyboardType="email-address"
                                                />
                                            </View>
                                        )}
                                    />
                                    {errors.email && (
                                        <Text className="text-red-400 text-sm mt-2 ml-1 font-medium">
                                            {errors.email.message}
                                        </Text>
                                    )}
                                </View>

                                <TouchableOpacity
                                    onPress={handleSubmit(onSubmit)}
                                    disabled={sendOtpMutation.isPending}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#6366f1', '#4f46e5']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        className={`w-full py-4 rounded-xl items-center shadow-lg shadow-indigo-500/30 ${sendOtpMutation.isPending ? 'opacity-70' : ''}`}
                                        style={{ opacity: sendOtpMutation.isPending ? 0.7 : 1 }}
                                    >
                                        {sendOtpMutation.isPending ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <Text className="text-white font-bold text-lg">Send OTP</Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>

                            <View className="mt-8 flex-row justify-center">
                                <Text className="text-slate-500">New here? </Text>
                                <TouchableOpacity>
                                    <Text className="text-indigo-400 font-bold ml-1">Contact Admin</Text>
                                </TouchableOpacity>
                            </View>

                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
}
