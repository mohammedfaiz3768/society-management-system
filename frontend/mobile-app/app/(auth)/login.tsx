import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
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
        mutationFn: (data: Login FormData) => sendOtp(data),
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
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.logoContainer}>
                {/* Logo */}
                <View style={styles.logo}>
                    <Text style={styles.logoEmoji}>🏙️</Text>
                </View>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to manage your society</Text>
            </View>

            <View style={styles.formContainer}>
                <View>
                    <Text style={styles.label}>Email Address</Text>
                    <Controller
                        control={control}
                        name="email"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                style={styles.input}
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
                        <Text style={styles.errorText}>{errors.email.message}</Text>
                    )}
                </View>

                <TouchableOpacity
                    onPress={handleSubmit(onSubmit)}
                    disabled={sendOtpMutation.isPending}
                    style={[styles.button, sendOtpMutation.isPending && styles.buttonDisabled]}
                >
                    {sendOtpMutation.isPending ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.buttonText}>Send OTP</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 24,
        justifyContent: 'center',
    },
    logoContainer: {
        marginBottom: 40,
        alignItems: 'center',
    },
    logo: {
        width: 96,
        height: 96,
        backgroundColor: '#e2e8f0',
        borderRadius: 16,
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoEmoji: {
        fontSize: 48,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
    },
    formContainer: {
        gap: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#334155',
        marginBottom: 6,
    },
    input: {
        width: '100%',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#0f172a',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
        marginTop: 4,
    },
    button: {
        width: '100%',
        backgroundColor: '#0f172a',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 16,
    },
});
