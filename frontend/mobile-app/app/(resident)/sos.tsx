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
    ScrollView,
} from "react-native";
import * as Location from "expo-location";
import { apiClient } from "../../src/api/client";

interface EmergencyService {
    name: string;
    number: string;
}

interface EmergencyContacts {
    FIRE?: EmergencyService;
    AMBULANCE?: EmergencyService;
    POLICE?: EmergencyService;
    [key: string]: EmergencyService | undefined;
}

export default function SOSScreen() {
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContacts | null>(null);

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
            const response = await apiClient.get("/sos/emergency-contacts");
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
            const coords = {
                lat: loc.coords.latitude,
                lng: loc.coords.longitude,
            };
            setLocation(coords);
            return coords;
        } catch (error) {
            console.error("Error getting location:", error);
            return null;
        }
    };

    const triggerSOS = async (
        type: string,
        message: string,
        autoCall: boolean = false,
        triggerBuzzer: boolean = false
    ) => {
        setLoading(true);
        Vibration.vibrate([0, 500, 200, 500]);

        try {
            const loc = await getCurrentLocation();

            await apiClient.post("/sos/create", {
                type,
                message,
                lat: loc?.lat,
                lng: loc?.lng,
                auto_call: autoCall,
                trigger_buzzer: triggerBuzzer,
            });

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
                                onPress: () => Linking.openURL(`tel:${service.number}`),
                            },
                        ]
                    );
                    return;
                }
            }

            Alert.alert(
                triggerBuzzer ? "Buzzer Activated!" : "SOS Alert Sent!",
                triggerBuzzer
                    ? "Emergency buzzer has been triggered on all devices."
                    : "Emergency alert has been sent to all admins and guards.",
                [{ text: "OK" }]
            );
        } catch (error) {
            console.error("Error sending SOS:", error);
            Alert.alert("Error", "Failed to send SOS alert. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const getServiceForType = (type: string): EmergencyService | null => {
        if (!emergencyContacts) return null;
        switch (type) {
            case "fire": return emergencyContacts.FIRE ?? null;
            case "medical": return emergencyContacts.AMBULANCE ?? null;
            case "police": return emergencyContacts.POLICE ?? null;
            default: return null;
        }
    };

    const handleEmergencyPress = (type: string, name: string) => {
        Alert.alert(
            `${name} Emergency`,
            "This will send an SOS alert to all guards and admins.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Alert Only",
                    onPress: () => triggerSOS(type, `${name} Emergency`, false),
                },
                {
                    text: "Alert + Call",
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
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
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
                        "This will trigger a loud alert on all resident devices.",
                        [
                            { text: "No", style: "cancel" },
                            {
                                text: "Yes - Buzzer ON",
                                style: "destructive",
                                onPress: () => triggerSOS("general", "URGENT SOS - BUZZER ACTIVATED", false, true),
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
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 40,
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
        elevation: 8,
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
