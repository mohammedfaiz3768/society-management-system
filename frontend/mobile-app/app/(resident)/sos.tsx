import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Linking,
    ActivityIndicator,
    Vibration,
} from "react-native";
import * as Location from "expo-location";
import axios from "axios";
import { Card } from "@/components/ui/Card";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

export default function SOSScreen() {
    const [location, setLocation] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [emergencyContacts, setEmergencyContacts] = useState<any>(null);

    useEffect(() => {
        requestLocationPermission();
        fetchEmergencyContacts();
    }, []);

    const requestLocationPermission = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            Alert.alert(
                "Permission Denied",
                "Location permission is required for emergency services"
            );
        }
    };

    const fetchEmergencyContacts = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/sos/emergency-contacts`);
            setEmergencyContacts(response.data.contacts);
        } catch (error) {
            console.error("Error fetching emergency contacts:", error);
        }
    };

    const getCurrentLocation = async () => {
        try {
            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            setLocation({
                lat: loc.coords.latitude,
                lng: loc.coords.longitude,
            });
            return {
                lat: loc.coords.latitude,
                lng: loc.coords.longitude,
            };
        } catch (error) {
            console.error("Error getting location:", error);
            return null;
        }
    };

    const triggerSOS = async (
        type: string,
        message: string,
        autoCall: boolean = false
    ) => {
        setLoading(true);
        Vibration.vibrate([0, 500, 200, 500]); // Immediate feedback

        try {
            // Get current location
            const loc = await getCurrentLocation();

            // Send SOS to backend
            const response = await axios.post(`${API_URL}/api/sos/create`, {
                type,
                message,
                lat: loc?.lat,
                lng: loc?.lng,
                auto_call: autoCall,
            });

            // If auto-call enabled, make the call
            if (autoCall && emergencyContacts) {
                const service = getServiceForType(type);
                if (service) {
                    Alert.alert(
                        "Call Emergency Service?",
                        `Do you want to call ${service.name} (${service.number})?`,
                        [
                            { text: "Cancel", style: "cancel" },
                            {
                                text: "Call Now",
                                onPress: () => makeEmergencyCall(service.number),
                            },
                        ]
                    );
                }
            }

            Alert.alert(
                "SOS Alert Sent!",
                "Emergency alert has been sent to all admins and guards.",
                [{ text: "OK" }]
            );
        } catch (error) {
            console.error("Error sending SOS:", error);
            Alert.alert("Error", "Failed to send SOS alert. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const getServiceForType = (type: string) => {
        if (!emergencyContacts) return null;
        switch (type) {
            case "fire":
                return emergencyContacts.FIRE;
            case "medical":
                return emergencyContacts.AMBULANCE;
            case "police":
                return emergencyContacts.POLICE;
            default:
                return null;
        }
    };

    const makeEmergencyCall = (number: string) => {
        Linking.openURL(`tel:${number}`);
    };

    const handleEmergencyPress = (type: string, name: string) => {
        Alert.alert(
            `${name} Emergency`,
            "This will send an SOS alert and can auto-call emergency services.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Alert Only",
                    onPress: () => triggerSOS(type, `${name} Emergency`, false),
                },
                {
                    text: "Alert + Auto Call",
                    style: "destructive",
                    onPress: () => triggerSOS(type, `${name} Emergency`, true),
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ef4444" />
                <Text style={styles.loadingText}>Sending Emergency Alert...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>🚨 Emergency SOS</Text>
                <Text style={styles.subtitle}>
                    Select emergency type. Your location will be shared automatically.
                </Text>
            </View>

            {/* Emergency Type Cards */}
            <View style={styles.gridContainer}>
                <TouchableOpacity
                    style={[styles.emergencyCard, styles.fireCard]}
                    onPress={() => handleEmergencyPress("fire", "Fire")}
                >
                    <Text style={styles.emergencyIcon}>🔥</Text>
                    <Text style={styles.emergencyTitle}>Fire</Text>
                    <Text style={styles.emergencyNumber}>
                        {emergencyContacts?.FIRE?.number || "101"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.emergencyCard, styles.medicalCard]}
                    onPress={() => handleEmergencyPress("medical", "Medical")}
                >
                    <Text style={styles.emergencyIcon}>🚑</Text>
                    <Text style={styles.emergencyTitle}>Medical</Text>
                    <Text style={styles.emergencyNumber}>
                        {emergencyContacts?.AMBULANCE?.number || "102"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.emergencyCard, styles.policeCard]}
                    onPress={() => handleEmergencyPress("police", "Police")}
                >
                    <Text style={styles.emergencyIcon}>👮</Text>
                    <Text style={styles.emergencyTitle}>Police</Text>
                    <Text style={styles.emergencyNumber}>
                        {emergencyContacts?.POLICE?.number || "100"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.emergencyCard, styles.generalCard]}
                    onPress={() => triggerSOS("general", "General SOS Emergency", false)}
                >
                    <Text style={styles.emergencyIcon}>⚠️</Text>
                    <Text style={styles.emergencyTitle}>General</Text>
                    <Text style={styles.emergencySubtext}>SOS Alert</Text>
                </TouchableOpacity>
            </View>

            {/* Big Red SOS Button */}
            <TouchableOpacity
                style={styles.bigSOSButton}
                onPress={() => triggerSOS("general", "URGENT SOS", false)}
                onLongPress={() => {
                    Alert.alert(
                        "Activate Buzzer?",
                        "Long press detected. Send alert with buzzer to all residents?",
                        [
                            { text: "No", style: "cancel" },
                            {
                                text: "Yes - Buzzer ON",
                                style: "destructive",
                                onPress: async () => {
                                    const loc = await getCurrentLocation();
                                    await axios.post(`${API_URL}/api/sos/create`, {
                                        type: "general",
                                        message: "URGENT SOS - BUZZER ACTIVATED",
                                        lat: loc?.lat,
                                        lng: loc?.lng,
                                        trigger_buzzer: true,
                                    });
                                    Alert.alert("Alert Sent!", "Buzzer activated on all devices");
                                },
                            },
                        ]
                    );
                }}
            >
                <Text style={styles.bigSOSText}>EMERGENCY</Text>
                <Text style={styles.bigSOSSubtext}>Press for SOS • Hold for Buzzer</Text>
            </TouchableOpacity>

            <Text style={styles.footerText}>
                📍 Location will be shared automatically
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#fff",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#666",
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: "#6b7280",
    },
    gridContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: 32,
    },
    emergencyCard: {
        width: "48%",
        aspectRatio: 1,
        borderRadius: 16,
        padding: 20,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    fireCard: {
        backgroundColor: "#fef2f2",
        borderWidth: 2,
        borderColor: "#f87171",
    },
    medicalCard: {
        backgroundColor: "#f0f9ff",
        borderWidth: 2,
        borderColor: "#60a5fa",
    },
    policeCard: {
        backgroundColor: "#fefce8",
        borderWidth: 2,
        borderColor: "#facc15",
    },
    generalCard: {
        backgroundColor: "#f3f4f6",
        borderWidth: 2,
        borderColor: "#9ca3af",
    },
    emergencyIcon: {
        fontSize: 48,
        marginBottom: 8,
    },
    emergencyTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: 4,
    },
    emergencyNumber: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#ef4444",
    },
    emergencySubtext: {
        fontSize: 14,
        color: "#6b7280",
    },
    bigSOSButton: {
        backgroundColor: "#dc2626",
        borderRadius: 20,
        paddingVertical: 32,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8
    },
    bigSOSText: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#fff",
        letterSpacing: 2,
    },
    bigSOSSubtext: {
        fontSize: 12,
        color: "#fca5a5",
        marginTop: 8,
    },
    footerText: {
        textAlign: "center",
        marginTop: 24,
        fontSize: 14,
        color: "#6b7280",
    },
});
