import React, { useRef, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    StatusBar,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Stethoscope,
    TrendingDown,
    TrendingUp,
    Activity,
    MessageCircle,
    ShieldCheck,
    Clock,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useStress, StressLevel } from '@/contexts/StressContext';

function getLevelColor(level: StressLevel | null): string {
    if (!level) return Colors.surfaceLight;
    switch (level) {
        case 'HIGH': return Colors.stress;
        case 'MEDIUM': return Colors.warm;
        case 'LOW': return Colors.calm;
    }
}

function getLevelLabel(level: StressLevel | null): string {
    if (!level) return 'No data';
    switch (level) {
        case 'HIGH': return 'High';
        case 'MEDIUM': return 'Medium';
        case 'LOW': return 'Calm';
    }
}

function formatTime(ts: number): string {
    const diff = Date.now() - ts;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
}

export default function DoctorScreen() {
    const insets = useSafeAreaInsets();
    const { doctor, doctorMessages, weeklyData, currentStressLevel, entries } = useStress();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const cardAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
    const pulseAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        cardAnims.forEach((anim, i) => {
            Animated.timing(anim, {
                toValue: 1,
                duration: 450,
                delay: 200 + i * 100,
                useNativeDriver: true,
            }).start();
        });
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 0.8, duration: 2000, useNativeDriver: true }),
            ])
        ).start();
    }, [fadeAnim, cardAnims, pulseAnim]);

    const trendDirection = useMemo(() => {
        if (entries.length < 2) return 'stable';
        const recent = entries.slice(0, 3).map(e => e.level === 'HIGH' ? 3 : e.level === 'MEDIUM' ? 2 : 1);
        const older = entries.slice(3, 6).map(e => e.level === 'HIGH' ? 3 : e.level === 'MEDIUM' ? 2 : 1);
        if (older.length === 0) return 'stable';
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
        if (recentAvg < olderAvg) return 'improving';
        if (recentAvg > olderAvg) return 'worsening';
        return 'stable';
    }, [entries]);

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#081220', '#0A1A2E', '#060E18']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
            />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12, paddingBottom: 24 }]}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={{ opacity: fadeAnim }}>
                    <View style={styles.doctorHeader}>
                        <Animated.View style={[styles.doctorAvatarWrap, { transform: [{ scale: pulseAnim }] }]}>
                            <LinearGradient
                                colors={[Colors.doctorBlue + '30', Colors.doctorBlue + '10']}
                                style={StyleSheet.absoluteFill}
                            />
                            <Text style={styles.doctorEmoji}>{doctor.avatar}</Text>
                        </Animated.View>
                        <View style={styles.doctorInfo}>
                            <Text style={styles.doctorName}>{doctor.name}</Text>
                            <Text style={styles.doctorSpeciality}>{doctor.speciality}</Text>
                            <View style={styles.monitoringBadge}>
                                <View style={styles.liveDot} />
                                <Text style={styles.monitoringText}>Monitoring your wellbeing</Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                <Animated.View style={{
                    opacity: cardAnims[0],
                    transform: [{ translateY: cardAnims[0].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                }}>
                    <View style={styles.latestMessage}>
                        <LinearGradient colors={['rgba(30,58,95,0.5)', 'rgba(20,40,70,0.7)']} style={StyleSheet.absoluteFill} />
                        <View style={styles.messageHeader}>
                            <MessageCircle color={Colors.doctorBlueSoft} size={18} />
                            <Text style={styles.messageLabel}>Latest Message</Text>
                        </View>
                        <Text style={styles.messageDoctor}>{doctor.name} says:</Text>
                        <Text style={styles.messageText}>{`"${doctorMessages[0]?.message ?? ''}"`}</Text>
                        <Text style={styles.messageTime}>{formatTime(doctorMessages[0]?.timestamp ?? Date.now())}</Text>
                    </View>
                </Animated.View>

                <Animated.View style={{
                    opacity: cardAnims[1],
                    transform: [{ translateY: cardAnims[1].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                }}>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <LinearGradient colors={['rgba(30,58,95,0.4)', 'rgba(20,40,70,0.6)']} style={StyleSheet.absoluteFill} />
                            <Activity color={getLevelColor(currentStressLevel)} size={20} />
                            <Text style={[styles.statValue, { color: getLevelColor(currentStressLevel) }]}>
                                {getLevelLabel(currentStressLevel)}
                            </Text>
                            <Text style={styles.statLabel}>Current Status</Text>
                        </View>
                        <View style={styles.statCard}>
                            <LinearGradient colors={['rgba(30,58,95,0.4)', 'rgba(20,40,70,0.6)']} style={StyleSheet.absoluteFill} />
                            {trendDirection === 'improving' ? (
                                <TrendingDown color={Colors.accent} size={20} />
                            ) : trendDirection === 'worsening' ? (
                                <TrendingUp color={Colors.stress} size={20} />
                            ) : (
                                <Activity color={Colors.warm} size={20} />
                            )}
                            <Text style={[styles.statValue, {
                                color: trendDirection === 'improving' ? Colors.accent : trendDirection === 'worsening' ? Colors.stress : Colors.warm,
                            }]}>
                                {trendDirection === 'improving' ? 'Improving' : trendDirection === 'worsening' ? 'Worsening' : 'Stable'}
                            </Text>
                            <Text style={styles.statLabel}>Trend</Text>
                        </View>
                    </View>
                </Animated.View>

                <Animated.View style={{
                    opacity: cardAnims[2],
                    transform: [{ translateY: cardAnims[2].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                }}>
                    <Text style={styles.sectionLabel}>STRESS TRENDS</Text>
                    <View style={styles.trendCard}>
                        <LinearGradient colors={['rgba(30,58,95,0.4)', 'rgba(20,40,70,0.6)']} style={StyleSheet.absoluteFill} />
                        <View style={styles.trendDays}>
                            {weeklyData.dayData.map((day, i) => (
                                <View key={i} style={styles.trendDay}>
                                    <View style={styles.trendBarWrap}>
                                        <View style={[
                                            styles.trendBar,
                                            {
                                                backgroundColor: getLevelColor(day.level),
                                                height: day.level === 'HIGH' ? 40 : day.level === 'MEDIUM' ? 26 : day.level === 'LOW' ? 14 : 4,
                                            },
                                        ]} />
                                    </View>
                                    <Text style={[
                                        styles.trendDayLabel,
                                        new Date().getDay() === i && styles.trendDayActive,
                                    ]}>
                                        {day.label}
                                    </Text>
                                </View>
                            ))}
                        </View>
                        <View style={styles.trendLegend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: Colors.calm }]} />
                                <Text style={styles.legendText}>Calm</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: Colors.warm }]} />
                                <Text style={styles.legendText}>Medium</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: Colors.stress }]} />
                                <Text style={styles.legendText}>High</Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                <Animated.View style={{
                    opacity: cardAnims[3],
                    transform: [{ translateY: cardAnims[3].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                }}>
                    <Text style={styles.sectionLabel}>MESSAGES</Text>
                    {doctorMessages.map((msg) => (
                        <View key={msg.id} style={styles.messageCard}>
                            <View style={styles.messageCardIcon}>
                                <Stethoscope color={Colors.doctorBlueSoft} size={16} />
                            </View>
                            <View style={styles.messageCardContent}>
                                <Text style={styles.messageCardText}>{msg.message}</Text>
                                <View style={styles.messageCardTime}>
                                    <Clock color="#475569" size={11} />
                                    <Text style={styles.messageCardTimeText}>{formatTime(msg.timestamp)}</Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </Animated.View>

                <View style={styles.trustCard}>
                    <LinearGradient colors={['rgba(30,58,95,0.3)', 'rgba(20,40,70,0.5)']} style={StyleSheet.absoluteFill} />
                    <ShieldCheck color={Colors.doctorBlueSoft} size={20} />
                    <View style={styles.trustText}>
                        <Text style={styles.trustTitle}>Secure & Private</Text>
                        <Text style={styles.trustSub}>Doctor access is encrypted and secure. Your data is protected.</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#081220' },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20 },
    doctorHeader: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 16,
        marginBottom: 20,
    },
    doctorAvatarWrap: {
        width: 72,
        height: 72,
        borderRadius: 22,
        overflow: 'hidden' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        borderWidth: 2,
        borderColor: Colors.doctorBlue + '30',
    },
    doctorEmoji: {
        fontSize: 36,
    },
    doctorInfo: {
        flex: 1,
    },
    doctorName: {
        fontSize: 22,
        fontWeight: '800' as const,
        color: '#E2E8F0',
    },
    doctorSpeciality: {
        fontSize: 13,
        color: '#94A3B8',
        marginBottom: 6,
    },
    monitoringBadge: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 6,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.accent,
    },
    monitoringText: {
        fontSize: 11,
        color: Colors.accentSoft,
        fontWeight: '600' as const,
    },
    latestMessage: {
        borderRadius: 18,
        overflow: 'hidden' as const,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.doctorBlue + '15',
    },
    messageHeader: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 8,
        marginBottom: 12,
    },
    messageLabel: {
        fontSize: 12,
        fontWeight: '700' as const,
        color: Colors.doctorBlueSoft,
        letterSpacing: 1,
        textTransform: 'uppercase' as const,
    },
    messageDoctor: {
        fontSize: 13,
        color: '#94A3B8',
        marginBottom: 4,
    },
    messageText: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: '#E2E8F0',
        lineHeight: 24,
        fontStyle: 'italic' as const,
    },
    messageTime: {
        fontSize: 11,
        color: '#475569',
        marginTop: 8,
    },
    statsGrid: {
        flexDirection: 'row' as const,
        gap: 10,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden' as const,
        padding: 16,
        alignItems: 'center' as const,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.1)',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800' as const,
    },
    statLabel: {
        fontSize: 10,
        color: '#475569',
        fontWeight: '600' as const,
        letterSpacing: 0.5,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700' as const,
        color: '#475569',
        letterSpacing: 2.5,
        marginBottom: 10,
    },
    trendCard: {
        borderRadius: 18,
        overflow: 'hidden' as const,
        padding: 18,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.1)',
    },
    trendDays: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'flex-end' as const,
        height: 60,
        marginBottom: 14,
    },
    trendDay: {
        alignItems: 'center' as const,
        flex: 1,
    },
    trendBarWrap: {
        flex: 1,
        justifyContent: 'flex-end' as const,
        alignItems: 'center' as const,
    },
    trendBar: {
        width: 20,
        borderRadius: 4,
        minHeight: 4,
    },
    trendDayLabel: {
        fontSize: 10,
        color: '#475569',
        fontWeight: '500' as const,
        marginTop: 6,
    },
    trendDayActive: {
        color: Colors.doctorBlueSoft,
        fontWeight: '700' as const,
    },
    trendLegend: {
        flexDirection: 'row' as const,
        justifyContent: 'center' as const,
        gap: 16,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(59,130,246,0.08)',
    },
    legendItem: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 5,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 10,
        color: '#475569',
        fontWeight: '500' as const,
    },
    messageCard: {
        flexDirection: 'row' as const,
        alignItems: 'flex-start' as const,
        gap: 12,
        marginBottom: 12,
        backgroundColor: 'rgba(30,58,95,0.3)',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.08)',
    },
    messageCardIcon: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: Colors.doctorBlue + '15',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        marginTop: 2,
    },
    messageCardContent: {
        flex: 1,
    },
    messageCardText: {
        fontSize: 14,
        color: '#CBD5E1',
        lineHeight: 20,
    },
    messageCardTime: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 4,
        marginTop: 6,
    },
    messageCardTimeText: {
        fontSize: 10,
        color: '#475569',
    },
    trustCard: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        borderRadius: 14,
        overflow: 'hidden' as const,
        padding: 14,
        gap: 12,
        marginTop: 8,
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.08)',
    },
    trustText: {
        flex: 1,
    },
    trustTitle: {
        fontSize: 13,
        fontWeight: '700' as const,
        color: '#94A3B8',
        marginBottom: 2,
    },
    trustSub: {
        fontSize: 11,
        color: '#475569',
        lineHeight: 16,
    },
});