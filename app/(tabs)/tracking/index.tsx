import React, { useRef, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    StatusBar,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
    BarChart3,
    TrendingUp,
    Calendar,
    Leaf,
    Flame,
    Zap,
    Clock,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useStress, StressLevel } from '@/contexts/StressContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function getLevelColor(level: StressLevel | null): string {
    if (!level) return Colors.surfaceLight;
    switch (level) {
        case 'HIGH': return Colors.stress;
        case 'MEDIUM': return Colors.warm;
        case 'LOW': return Colors.accent;
    }
}

function getLevelIcon(level: StressLevel) {
    switch (level) {
        case 'HIGH': return <Flame color={Colors.stress} size={14} />;
        case 'MEDIUM': return <Zap color={Colors.warm} size={14} />;
        case 'LOW': return <Leaf color={Colors.accent} size={14} />;
    }
}

function formatSessionTime(ts: number): string {
    const date = new Date(ts);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
}

function formatSessionDate(ts: number): string {
    const date = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TrackingScreen() {
    const insets = useSafeAreaInsets();
    const { entries, weeklyData } = useStress();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        Animated.timing(progressAnim, {
            toValue: weeklyData.calmPercent / 100,
            duration: 1200,
            delay: 400,
            useNativeDriver: false,
        }).start();
    }, [fadeAnim, progressAnim, weeklyData.calmPercent]);

    const recentEntries = useMemo(() => entries.slice(0, 10), [entries]);

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#0B1A14', '#0D2818', '#081210']}
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
                    <View style={styles.header}>
                        <BarChart3 color={Colors.trackingTeal} size={24} />
                        <Text style={styles.headerTitle}>Daily Tracking</Text>
                    </View>
                    <Text style={styles.headerSub}>Your calm journey, visualized</Text>
                </Animated.View>

                <View style={styles.scoreCard}>
                    <LinearGradient
                        colors={['rgba(20,184,166,0.12)', 'rgba(20,184,166,0.04)']}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.scoreContent}>
                        <View style={styles.scoreLeft}>
                            <Text style={styles.scoreNum}>{weeklyData.calmPercent}%</Text>
                            <Text style={styles.scoreLabel}>Calm this week</Text>
                            {weeklyData.totalSessions > 0 ? (
                                <View style={styles.improveBadge}>
                                    <TrendingUp color={Colors.accent} size={12} />
                                    <Text style={styles.improveText}>Keep going!</Text>
                                </View>
                            ) : (
                                <Text style={styles.noDataText}>Start a session to track</Text>
                            )}
                        </View>
                        <View style={styles.scoreRing}>
                            <View style={styles.ringBg}>
                                <Animated.View style={[styles.ringFill, {
                                    width: progressAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%'],
                                    }),
                                }]}>
                                    <LinearGradient
                                        colors={[Colors.trackingTeal, Colors.accent]}
                                        style={StyleSheet.absoluteFill}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    />
                                </Animated.View>
                            </View>
                            <Text style={styles.ringLabel}>{weeklyData.totalSessions} sessions</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.sectionLabel}>WEEKLY OVERVIEW</Text>
                <View style={styles.weekCard}>
                    <LinearGradient colors={['rgba(22,58,38,0.5)', 'rgba(15,40,26,0.7)']} style={StyleSheet.absoluteFill} />
                    <View style={styles.weekDays}>
                        {weeklyData.dayData.map((day, i) => {
                            const isToday = new Date().getDay() === i;
                            return (
                                <View key={i} style={styles.dayCol}>
                                    <View style={styles.dayBarWrap}>
                                        <View style={[
                                            styles.dayBar,
                                            {
                                                backgroundColor: getLevelColor(day.level),
                                                height: day.level === 'HIGH' ? 48 : day.level === 'MEDIUM' ? 32 : day.level === 'LOW' ? 18 : 6,
                                                opacity: day.level ? 1 : 0.3,
                                            },
                                        ]} />
                                    </View>
                                    <Text style={[styles.dayLabel, isToday && styles.dayLabelActive]}>{day.label}</Text>
                                    {isToday && <View style={styles.todayDot} />}
                                </View>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.miniStat}>
                        <LinearGradient colors={['rgba(22,58,38,0.5)', 'rgba(15,40,26,0.7)']} style={StyleSheet.absoluteFill} />
                        <Leaf color={Colors.accent} size={18} />
                        <Text style={styles.miniStatNum}>
                            {entries.filter(e => e.completed).length}
                        </Text>
                        <Text style={styles.miniStatLabel}>Completed</Text>
                    </View>
                    <View style={styles.miniStat}>
                        <LinearGradient colors={['rgba(22,58,38,0.5)', 'rgba(15,40,26,0.7)']} style={StyleSheet.absoluteFill} />
                        <Calendar color={Colors.trackingTeal} size={18} />
                        <Text style={styles.miniStatNum}>{weeklyData.totalSessions}</Text>
                        <Text style={styles.miniStatLabel}>This Week</Text>
                    </View>
                    <View style={styles.miniStat}>
                        <LinearGradient colors={['rgba(22,58,38,0.5)', 'rgba(15,40,26,0.7)']} style={StyleSheet.absoluteFill} />
                        <Flame color={Colors.warm} size={18} />
                        <Text style={styles.miniStatNum}>
                            {entries.filter(e => e.level === 'HIGH').length}
                        </Text>
                        <Text style={styles.miniStatLabel}>High Stress</Text>
                    </View>
                </View>

                {recentEntries.length > 0 && (
                    <>
                        <Text style={styles.sectionLabel}>RECENT SESSIONS</Text>
                        {recentEntries.map((entry) => (
                            <View key={entry.id} style={styles.sessionCard}>
                                <View style={[styles.sessionDot, { backgroundColor: getLevelColor(entry.level) }]} />
                                <View style={styles.sessionInfo}>
                                    <View style={styles.sessionTop}>
                                        <View style={styles.sessionLevelRow}>
                                            {getLevelIcon(entry.level)}
                                            <Text style={[styles.sessionLevel, { color: getLevelColor(entry.level) }]}>
                                                {entry.level} Stress
                                            </Text>
                                        </View>
                                        <Text style={styles.sessionIntervention}>{entry.intervention}</Text>
                                    </View>
                                    <View style={styles.sessionBottom}>
                                        <View style={styles.sessionTimeRow}>
                                            <Clock color={Colors.textMuted} size={11} />
                                            <Text style={styles.sessionTime}>
                                                {formatSessionDate(entry.timestamp)} at {formatSessionTime(entry.timestamp)}
                                            </Text>
                                        </View>
                                        {entry.completed && (
                                            <View style={styles.completedBadge}>
                                                <Text style={styles.completedText}>Completed</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        ))}
                    </>
                )}

                {entries.length === 0 && (
                    <View style={styles.emptyState}>
                        <Leaf color={Colors.textMuted} size={40} />
                        <Text style={styles.emptyTitle}>No sessions yet</Text>
                        <Text style={styles.emptySub}>Start a calm session from the Home tab{'\n'}to begin tracking your wellness</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.bg },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20 },
    header: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 10,
        marginBottom: 4,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800' as const,
        color: Colors.text,
    },
    headerSub: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 20,
    },
    scoreCard: {
        borderRadius: 20,
        overflow: 'hidden' as const,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.trackingTeal + '15',
    },
    scoreContent: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
        padding: 20,
    },
    scoreLeft: {
        flex: 1,
    },
    scoreNum: {
        fontSize: 44,
        fontWeight: '900' as const,
        color: Colors.trackingTealSoft,
        lineHeight: 50,
    },
    scoreLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    improveBadge: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 4,
        backgroundColor: Colors.accent + '15',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start' as const,
    },
    improveText: {
        fontSize: 11,
        color: Colors.accent,
        fontWeight: '600' as const,
    },
    noDataText: {
        fontSize: 12,
        color: Colors.textMuted,
    },
    scoreRing: {
        alignItems: 'center' as const,
        gap: 6,
    },
    ringBg: {
        width: SCREEN_WIDTH * 0.3,
        height: 8,
        backgroundColor: Colors.surfaceLight,
        borderRadius: 4,
        overflow: 'hidden' as const,
    },
    ringFill: {
        height: '100%',
        borderRadius: 4,
        overflow: 'hidden' as const,
    },
    ringLabel: {
        fontSize: 11,
        color: Colors.textMuted,
        fontWeight: '500' as const,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700' as const,
        color: Colors.textMuted,
        letterSpacing: 2.5,
        marginBottom: 10,
    },
    weekCard: {
        borderRadius: 18,
        overflow: 'hidden' as const,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    weekDays: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'flex-end' as const,
        height: 70,
    },
    dayCol: {
        alignItems: 'center' as const,
        flex: 1,
    },
    dayBarWrap: {
        flex: 1,
        justifyContent: 'flex-end' as const,
        alignItems: 'center' as const,
    },
    dayBar: {
        width: 22,
        borderRadius: 5,
        minHeight: 6,
    },
    dayLabel: {
        fontSize: 10,
        color: Colors.textMuted,
        fontWeight: '500' as const,
        marginTop: 6,
    },
    dayLabelActive: {
        color: Colors.trackingTealSoft,
        fontWeight: '700' as const,
    },
    todayDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.trackingTeal,
        marginTop: 3,
    },
    statsRow: {
        flexDirection: 'row' as const,
        gap: 10,
        marginBottom: 20,
    },
    miniStat: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden' as const,
        padding: 14,
        alignItems: 'center' as const,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    miniStatNum: {
        fontSize: 20,
        fontWeight: '800' as const,
        color: Colors.text,
    },
    miniStatLabel: {
        fontSize: 9,
        color: Colors.textMuted,
        fontWeight: '600' as const,
        letterSpacing: 0.3,
    },
    sessionCard: {
        flexDirection: 'row' as const,
        alignItems: 'flex-start' as const,
        gap: 12,
        backgroundColor: 'rgba(22,58,38,0.4)',
        padding: 14,
        borderRadius: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
    },
    sessionDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 5,
    },
    sessionInfo: {
        flex: 1,
    },
    sessionTop: {
        marginBottom: 6,
    },
    sessionLevelRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 5,
        marginBottom: 2,
    },
    sessionLevel: {
        fontSize: 13,
        fontWeight: '700' as const,
    },
    sessionIntervention: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    sessionBottom: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
    },
    sessionTimeRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 4,
    },
    sessionTime: {
        fontSize: 10,
        color: Colors.textMuted,
    },
    completedBadge: {
        backgroundColor: Colors.accent + '15',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    completedText: {
        fontSize: 9,
        color: Colors.accent,
        fontWeight: '600' as const,
    },
    emptyState: {
        alignItems: 'center' as const,
        paddingVertical: 48,
        gap: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700' as const,
        color: Colors.textSecondary,
    },
    emptySub: {
        fontSize: 13,
        color: Colors.textMuted,
        textAlign: 'center' as const,
        lineHeight: 20,
    },
});