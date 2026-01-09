import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/authStore';
import { verifyOtp } from '../../src/api/auth/auth.api';

export default function OtpScreen() {
    const { email } = useLocalSearchParams<{ email: string }>();
    const router = useRouter();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const login = useAuthStore((state) => state.login);

    const inputRefs = React.useRef<Array<TextInput | null>>([]);

    const verifyOtpMutation = useMutation({
        mutationFn: (code: string) => verifyOtp({ email: email || '', code }),
        onSuccess: (data) => {
            const { token, user } = data;

            // Store in Zustand + SecureStore
            login(token, user);

            // Route based on role
            if (user.role === 'resident') {
                router.replace('/(resident)/(tabs)/home');
            } else if (user.role === 'guard') {
                router.replace('/(guard)/(tabs)/scan');
            } else if (user.role === 'admin') {
                Alert.alert("Admin Access", "Please use the web dashboard for admin access.");
            } else {
                Alert.alert("Error", "Unknown role");
            }
        },
        onError: (error: any) => {
            Alert.alert('Verification Failed', error.message || 'Invalid OTP');
        }
    });

    const handleOtpChange = (value: string, index: number) => {
        // Only accept single digit
        if (value.length > 1) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input with a small delay to ensure state update completes
        if (value && index < 5) {
            setTimeout(() => {
                inputRefs.current[index + 1]?.focus();
            }, 10);
        }

        // Auto-submit on fill (last digit) - only if all 6 boxes are filled
        if (index === 5 && value && newOtp.every(digit => digit !== '')) {
            const fullCode = newOtp.join('');
            if (fullCode.length === 6) {
                setTimeout(() => {
                    Keyboard.dismiss();
                    verifyOtpMutation.mutate(fullCode);
                }, 100);
            }
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white p-6">
            <TouchableOpacity onPress={() => router.back()} className="mb-8">
                <Text className="text-slate-500 text-lg">← Back</Text>
            </TouchableOpacity>

            <View className="mb-8">
                <Text className="text-2xl font-bold text-slate-900">Enter Code</Text>
                <Text className="text-slate-500 mt-2">
                    We sent a verification code to <Text className="font-semibold text-slate-900">{email}</Text>
                </Text>
            </View>

            <View className="flex-row justify-between mb-8">
                {otp.map((digit, index) => (
                    <TextInput
                        key={index}
                        ref={(ref: TextInput | null) => { inputRefs.current[index] = ref; }}
                        className={`w-12 h-14 border rounded-xl text-center text-xl font-bold ${digit ? 'border-slate-900 bg-slate-50' : 'border-slate-200'
                            }`}
                        maxLength={1}
                        keyboardType="number-pad"
                        value={digit}
                        onChangeText={(val) => handleOtpChange(val, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        selectTextOnFocus
                    />
                ))}
            </View>

            <TouchableOpacity
                onPress={() => verifyOtpMutation.mutate(otp.join(''))}
                disabled={verifyOtpMutation.isPending || otp.join('').length !== 6}
                className={`w-full bg-slate-900 rounded-xl py-4 items-center ${(verifyOtpMutation.isPending || otp.join('').length !== 6) ? 'opacity-50' : ''
                    }`}
            >
                {verifyOtpMutation.isPending ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text className="text-white font-semibold text-base">Verify</Text>
                )}
            </TouchableOpacity>

            <View className="mt-6 flex-row justify-center">
                <Text className="text-slate-500">Didn't receive code? </Text>
                <TouchableOpacity>
                    <Text className="text-blue-600 font-medium">Resend</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
