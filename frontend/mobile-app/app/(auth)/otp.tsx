import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Keyboard, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/authStore';
import { verifyOtp, resendOtp } from '../../src/api/auth/auth.api';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';


const { width } = Dimensions.get('window');

export default function OtpScreen() {
    const { email } = useLocalSearchParams<{ email: string }>();
    const router = useRouter();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [countdown, setCountdown] = useState(30);
    const [isResending, setIsResending] = useState(false);
    const login = useAuthStore((state) => state.login);

    const inputRefs = React.useRef<Array<TextInput | null>>([]);
    const isSubmittingRef = React.useRef(false);

    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleResend = async () => {
        if (countdown > 0 || isResending) return;
        setIsResending(true);
        try {
            await resendOtp(email || '');
            setCountdown(30);
            Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
        } catch {
            Alert.alert('Error', 'Failed to resend code. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    const verifyOtpMutation = useMutation({
        mutationFn: (code: string) => verifyOtp({ email: email || '', code }),
        onSuccess: (data) => {
            isSubmittingRef.current = false;
            const { token, user } = data;
            login(token, user);

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
            isSubmittingRef.current = false;
            Alert.alert('Verification Failed', error.message || 'Invalid OTP');
        }
    });

    const handleOtpChange = (value: string, index: number) => {
        if (value.length > 1) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        if (index === 5 && value && newOtp.every(digit => digit !== '')) {
            const fullCode = newOtp.join('');
            if (fullCode.length === 6 && !isSubmittingRef.current) {
                isSubmittingRef.current = true;
                Keyboard.dismiss();
                verifyOtpMutation.mutate(fullCode);
            }
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <View className="flex-1">
            <LinearGradient
                colors={['#0f172a', '#1e293b']}
                style={{ flex: 1 }}
            >
                <SafeAreaView className="flex-1 px-6">
                    <View className="flex-row items-center mb-8 mt-4">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 bg-white/10 rounded-full items-center justify-center border border-white/20"
                        >
                            <Ionicons name="arrow-back" size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-1 justify-center -mt-20">
                        <View className="mb-8">
                            <View className="w-16 h-16 bg-indigo-500/20 rounded-2xl items-center justify-center mb-6 border border-indigo-500/30">
                                <Ionicons name="shield-checkmark" size={32} color="#818cf8" />
                            </View>
                            <Text className="text-3xl font-bold text-white mb-2">Verification Code</Text>
                            <Text className="text-slate-400 text-base leading-6">
                                Please enter the 6-digit code sent to
                                {'\n'}
                                <Text className="text-indigo-400 font-semibold">{email}</Text>
                            </Text>
                        </View>

                        <View className="flex-row justify-between mb-10">
                            {otp.map((digit, index) => (
                                <View key={index} className="relative">
                                    <TextInput
                                        ref={(ref) => { inputRefs.current[index] = ref; }}
                                        className={`w-12 h-14 rounded-xl text-center text-xl font-bold bg-white/5 border ${digit ? 'border-indigo-500 text-white' : 'border-white/10 text-slate-400'
                                            }`}
                                        maxLength={1}
                                        keyboardType="number-pad"
                                        value={digit}
                                        onChangeText={(val) => handleOtpChange(val, index)}
                                        onKeyPress={(e) => handleKeyPress(e, index)}
                                        selectTextOnFocus
                                        selectionColor="#818cf8"
                                    />
                                    {/* Glow effect for active input */}
                                    {digit ? (
                                        <View className="absolute -inset-1 bg-indigo-500/20 rounded-xl -z-10 blur-sm" />
                                    ) : null}
                                </View>
                            ))}
                        </View>

                        <View>
                            <TouchableOpacity
                                onPress={() => verifyOtpMutation.mutate(otp.join(''))}
                                disabled={verifyOtpMutation.isPending || otp.join('').length !== 6}
                                className={`w-full bg-indigo-600 rounded-xl py-4 items-center shadow-lg shadow-indigo-900/50 ${(verifyOtpMutation.isPending || otp.join('').length !== 6) ? 'opacity-50' : ''
                                    }`}
                            >
                                {verifyOtpMutation.isPending ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-bold text-lg">Verify & Proceed</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View className="mt-8 flex-row justify-center items-center">
                            <Text className="text-slate-400">Didn't receive code? </Text>
                            <TouchableOpacity onPress={handleResend} disabled={countdown > 0 || isResending}>
                                <Text className={`font-bold ml-1 ${countdown > 0 || isResending ? 'text-slate-500' : 'text-indigo-400'}`}>
                                    {isResending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
}
