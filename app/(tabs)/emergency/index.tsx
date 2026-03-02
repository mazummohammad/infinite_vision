import * as React from 'react';
import { useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Dimensions,
    Linking,
    Platform,
    Alert,
    StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
    ChevronLeft,
    MapPin,
    Phone,
    Star,
    Clock,
    Navigation,
    Building2,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { HOSPITALS, Hospital } from '@/mocks/hospitals';

export default function HospitalsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const cardAnims = useRef(HOSPITALS.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        HOSPITALS.forEach((_, i) => {
            Animated.timing(cardAnims[i], {
                toValue: 1,
                duration: 400,
                delay: 200 + i * 80,
                useNativeDriver: true,
            }).start();
        });
    }, [fadeAnim, cardAnims]);

    const openNavigation = useCallback((hospital: Hospital) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const url = Platform.OS === 'web'
            ? `https://www.google.com/maps/search/${encodeURIComponent(hospital.name)}`
            : Platform.OS === 'ios'
                ? `maps:?q=${encodeURIComponent(hospital.name)}`
                : `geo:0,0?q=${encodeURIComponent(hospital.name)}`;

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Linking.openURL(`https://www.google.com/maps/search/${encodeURIComponent(hospital.name)}`);
            }
        }).catch(() => {
            Alert.alert('Navigation', 'Could not open maps application.');
        });
    }, []);

    const callHospital = useCallback((phone: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Linking.openURL(`tel:${phone}`).catch(() => {
            Alert.alert('Call', `Please dial ${phone} manually.`);
        });
    }, []);

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#1A0808', '#200A0A', '#150606']} style={StyleSheet.absoluteFill} />

            <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="hospitals-back">
                    <ChevronLeft color="#FCA5A5" size={22} />
                </TouchableOpacity>
                <Text style={styles.topTitle}>Nearby Hospitals</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={{ opacity: fadeAnim }}>
                    <View style={styles.infoRow}>
                        <MapPin color={Colors.stress} size={16} />
                        <Text style={styles.infoText}>Showing hospitals near your location</Text>
                    </View>
                </Animated.View>

                {HOSPITALS.map((hospital, index) => (
                    <Animated.View
                        key={hospital.id}
                        style={{
                            opacity: cardAnims[index],
                            transform: [{
                                translateY: cardAnims[index].interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [20, 0],
                                }),
                            }],
                        }}
                    >
                        <View style={styles.hospitalCard}>
                            <LinearGradient colors={['rgba(42,15,15,0.5)', 'rgba(30,10,10,0.7)']} style={StyleSheet.absoluteFill} />
                            <View style={styles.hospitalHeader}>
                                <View style={styles.hospitalIconWrap}>
                                    <Building2 color={Colors.stressSoft} size={20} />
                                </View>
                                <View style={styles.hospitalInfo}>
                                    <Text style={styles.hospitalName}>{hospital.name}</Text>
                                    <View style={styles.hospitalMeta}>
                                        <View style={styles.metaBadge}>
                                            <MapPin color="#EF444480" size={11} />
                                            <Text style={styles.metaText}>{hospital.distance}</Text>
                                        </View>
                                        <View style={styles.metaBadge}>
                                            <Star color="#FBBF24" size={11} />
                                            <Text style={styles.metaText}>{hospital.rating}</Text>
                                        </View>
                                        {hospital.open24h && (
                                            <View style={[styles.metaBadge, styles.openBadge]}>
                                                <Clock color={Colors.accent} size={11} />
                                                <Text style={[styles.metaText, { color: Colors.accent }]}>24/7</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                            <Text style={styles.hospitalAddress}>{hospital.address}</Text>
                            <View style={styles.typePill}>
                                <Text style={styles.typeText}>{hospital.type}</Text>
                            </View>

                            <View style={styles.hospitalActions}>
                                <TouchableOpacity
                                    style={styles.navBtn}
                                    onPress={() => openNavigation(hospital)}
                                    activeOpacity={0.7}
                                    testID={`navigate-${hospital.id}`}
                                >
                                    <LinearGradient colors={['#DC2626', '#B91C1C']} style={StyleSheet.absoluteFill} />
                                    <Navigation color="#fff" size={16} />
                                    <Text style={styles.navBtnText}>Navigate</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.callBtn}
                                    onPress={() => callHospital(hospital.phone)}
                                    activeOpacity={0.7}
                                    testID={`call-${hospital.id}`}
                                >
                                    <Phone color={Colors.stressSoft} size={16} />
                                    <Text style={styles.callBtnText}>Call</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#1A0808' },
    topBar: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(42,15,15,0.7)',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    topTitle: {
        fontSize: 17,
        fontWeight: '700' as const,
        color: '#FEE2E2',
    },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },
    infoRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 8,
        marginBottom: 4,
        paddingVertical: 8,
    },
    infoText: {
        fontSize: 13,
        color: '#EF444470',
    },
    hospitalCard: {
        borderRadius: 18,
        overflow: 'hidden' as const,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.1)',
    },
    hospitalHeader: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 12,
        marginBottom: 10,
    },
    hospitalIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: Colors.stress + '15',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    hospitalInfo: {
        flex: 1,
    },
    hospitalName: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: '#FEE2E2',
        marginBottom: 4,
    },
    hospitalMeta: {
        flexDirection: 'row' as const,
        gap: 8,
    },
    metaBadge: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 4,
    },
    metaText: {
        fontSize: 11,
        color: '#EF444470',
        fontWeight: '500' as const,
    },
    openBadge: {
        backgroundColor: Colors.accent + '12',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    hospitalAddress: {
        fontSize: 12,
        color: '#EF444460',
        marginBottom: 8,
        lineHeight: 18,
    },
    typePill: {
        alignSelf: 'flex-start' as const,
        backgroundColor: 'rgba(42,15,15,0.6)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 12,
    },
    typeText: {
        fontSize: 10,
        color: '#FCA5A5',
        fontWeight: '600' as const,
        letterSpacing: 0.5,
    },
    hospitalActions: {
        flexDirection: 'row' as const,
        gap: 10,
    },
    navBtn: {
        flex: 1,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        height: 40,
        borderRadius: 12,
        overflow: 'hidden' as const,
        gap: 6,
    },
    navBtnText: {
        fontSize: 13,
        fontWeight: '700' as const,
        color: '#fff',
    },
    callBtn: {
        flex: 1,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(42,15,15,0.6)',
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.15)',
        gap: 6,
    },
    callBtnText: {
        fontSize: 13,
        fontWeight: '600' as const,
        color: '#FCA5A5',
    },
});