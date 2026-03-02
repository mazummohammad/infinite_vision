import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    TouchableOpacity,
    StatusBar,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
    Fingerprint,
    Wind,
    Zap,
    Hand,
    Leaf,
    ArrowRight,
    Sparkles,
    Heart,
    ShieldAlert,
    Stethoscope,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useStress, StressLevel } from '@/contexts/StressContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ToolCard {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    icon: React.ReactNode;
    route: string;
    gradient: [string, string];
    accentColor: string;
}

const TOOLS: ToolCard[] = [
    {
        id: 'detect',
        title: 'Stress Detect',
        subtitle: 'Touch & Breathe',
        description: 'Hold to detect stress through touch patterns, then guided breathing brings you back to calm.',
        icon: <Fingerprint color="#fff" size={26} />,
        route: '/detect',
        gradient: ['#0D3B2E', '#0A2A1F'],
        accentColor: Colors.accent,
    },
    {
        id: 'shake',
        title: 'Shake Release',
        subtitle: 'Physical Relief',
        description: 'Shake your phone to shatter stress particles. Feel tension dissolve with every shake.',
        icon: <Zap color="#fff" size={26} />,
        route: '/shake',
        gradient: ['#2A1A0A', '#1A1008'],
        accentColor: Colors.warm,
    },
    {
        id: 'grounding',
        title: 'Grounding Touch',
        subtitle: '5-Point Exercise',
        description: 'Follow guided touch patterns to ground your mind. Used in real therapy sessions.',
        icon: <Hand color="#fff" size={26} />,
        route: '/grounding',
        gradient: ['#0A1A2E', '#081220'],
        accentColor: '#60A5FA',
    },
    {
        id: 'swipe',
        title: 'Swipe Away',
        subtitle: 'Release Thoughts',
        description: 'Swipe negative thoughts off screen. Based on CBT cognitive defusion technique.',
        icon: <Wind color="#fff" size={26} />,
        route: '/swipe',
        gradient: ['#1A0A1A', '#120810'],
        accentColor: '#C084FC',
    },
];

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
}

function getGreetingEmoji(): string {
    const hour = new Date().getHours();
    if (hour < 12) return '☀️';
    if (hour < 17) return '🌤️';
    return '🌙';
}

function getStressConfig(level: StressLevel) {
    switch (level) {
        case 'HIGH':
            return { color: Colors.stress, dot: '🔴', label: 'High Stress', message: "I sense you're stressed. Let me help you find calm." };
        case 'MEDIUM':
            return { color: Colors.warm, dot: '🟡', label: 'Mild Stress', message: "You seem a little stressed. I'm here for you." };
        case 'LOW':
            return { color: Colors.calm, dot: '🟢', label: 'Calm', message: 'You are feeling peaceful. Keep it up!' };
    }
}

interface FloatingOrbProps {
    delay: number;
    x: number;
    y: number;
    size: number;
    color: string;
}

function FloatingOrb({ delay, x, y, size, color }: FloatingOrbProps) {
    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0.15)).current;

    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.parallel([
                    Animated.timing(translateY, { toValue: -12, duration: 3000, useNativeDriver: true }),
                    Animated.timing(opacity, { toValue: 0.35, duration: 3000, useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(translateY, { toValue: 0, duration: 3000, useNativeDriver: true }),
                    Animated.timing(opacity, { toValue: 0.15, duration: 3000, useNativeDriver: true }),
                ]),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, [delay, translateY, opacity]);

    return (
        <Animated.View
            style={{
                position: 'absolute',
                left: x,
                top: y,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
                opacity,
                transform: [{ translateY }],
            }}
        />
    );
}

function BreathingGlow() {
    const scale = useRef(new Animated.Value(0.9)).current;
    const glowOpacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(scale, { toValue: 1.15, duration: 4000, useNativeDriver: true }),
                    Animated.timing(glowOpacity, { toValue: 0.6, duration: 4000, useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(scale, { toValue: 0.9, duration: 4000, useNativeDriver: true }),
                    Animated.timing(glowOpacity, { toValue: 0.3, duration: 4000, useNativeDriver: true }),
                ]),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, [scale, glowOpacity]);

    return (
        <Animated.View style={[styles.breathGlow, { transform: [{ scale }], opacity: glowOpacity }]}>
            <LinearGradient
                colors={[Colors.accent + '40', Colors.accentGlow + '20', 'transparent']}
                style={styles.breathGlowGradient}
                start={{ x: 0.5, y: 0.5 }}
                end={{ x: 1, y: 1 }}
            />
        </Animated.View>
    );
}

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { currentStressLevel, doctor, weeklyData } = useStress();
    const heroOpacity = useRef(new Animated.Value(0)).current;
    const heroTranslateY = useRef(new Animated.Value(20)).current;
    const cardAnims = useRef(TOOLS.map(() => new Animated.Value(0))).current;

    const stressConfig = useMemo(() => getStressConfig(currentStressLevel), [currentStressLevel]);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(heroOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.timing(heroTranslateY, { toValue: 0, duration: 700, useNativeDriver: true }),
        ]).start();

        TOOLS.forEach((_, i) => {
            Animated.timing(cardAnims[i], {
                toValue: 1,
                duration: 500,
                delay: 300 + i * 100,
                useNativeDriver: true,
            }).start();
        });
    }, [heroOpacity, heroTranslateY, cardAnims]);

    const handleCardPress = useCallback((route: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push(route as never);
    }, [router]);

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#0B1A14', '#0F2A1C', '#071210']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
            />

            <FloatingOrb delay={0} x={SCREEN_WIDTH * 0.1} y={120} size={80} color={Colors.accent + '15'} />
            <FloatingOrb delay={1000} x={SCREEN_WIDTH * 0.65} y={200} size={60} color={Colors.warm + '12'} />
            <FloatingOrb delay={500} x={SCREEN_WIDTH * 0.3} y={350} size={50} color="#60A5FA12" />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12, paddingBottom: 24 }]}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={{ opacity: heroOpacity, transform: [{ translateY: heroTranslateY }] }}>
                    <View style={styles.topRow}>
                        <View style={styles.greetingArea}>
                            <Text style={styles.greeting}>
                                {getGreeting()}, Kushil {getGreetingEmoji()}
                            </Text>
                            <Text style={styles.greetingSub}>Your mind deserves peace today.</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.doctorBadge}
                            onPress={() => router.push('/(tabs)/doctor' as never)}
                            activeOpacity={0.7}
                            testID="doctor-badge"
                        >
                            <Text style={styles.doctorAvatar}>{doctor.avatar}</Text>
                            <View>
                                <Text style={styles.doctorBadgeText}>{doctor.name}</Text>
                                <Text style={styles.doctorBadgeSub}>Monitoring</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.stressCard}>
                        <LinearGradient
                            colors={[stressConfig.color + '12', stressConfig.color + '06']}
                            style={StyleSheet.absoluteFill}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />
                        <View style={styles.stressCardInner}>
                            <View style={styles.stressIndicator}>
                                <View style={[styles.stressDotOuter, { borderColor: stressConfig.color + '40' }]}>
                                    <View style={[styles.stressDot, { backgroundColor: stressConfig.color }]} />
                                </View>
                                <View>
                                    <Text style={[styles.stressLabel, { color: stressConfig.color }]}>{stressConfig.label}</Text>
                                    <Text style={styles.stressMessage}>{stressConfig.message}</Text>
                                </View>
                            </View>
                            {weeklyData.totalSessions > 0 && (
                                <View style={styles.calmScore}>
                                    <Text style={styles.calmScoreNum}>{weeklyData.calmPercent}%</Text>
                                    <Text style={styles.calmScoreLabel}>calm this week</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </Animated.View>

                <View style={styles.mainAction}>
                    <BreathingGlow />
                    <TouchableOpacity
                        style={styles.calmButton}
                        onPress={() => handleCardPress('/detect')}
                        activeOpacity={0.8}
                        testID="touch-to-relax"
                    >
                        <LinearGradient
                            colors={[Colors.accent + 'DD', Colors.accentGlow + 'BB', Colors.accentDark + 'EE']}
                            style={styles.calmButtonGradient}
                            start={{ x: 0.3, y: 0 }}
                            end={{ x: 0.7, y: 1 }}
                        />
                        <Leaf color="#fff" size={32} />
                        <Text style={styles.calmButtonText}>Touch to Relax</Text>
                        <Text style={styles.calmButtonSub}>Hold to detect stress</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={styles.quickBtn}
                        onPress={() => router.push('/(tabs)/emergency' as never)}
                        activeOpacity={0.7}
                        testID="quick-emergency"
                    >
                        <LinearGradient colors={['#2A0A0A', '#1A0808']} style={StyleSheet.absoluteFill} />
                        <View style={[styles.quickIcon, { backgroundColor: Colors.stress + '18' }]}>
                            <ShieldAlert color={Colors.stress} size={20} />
                        </View>
                        <Text style={styles.quickLabel}>SOS Help</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickBtn}
                        onPress={() => router.push('/(tabs)/doctor' as never)}
                        activeOpacity={0.7}
                        testID="quick-doctor"
                    >
                        <LinearGradient colors={['#0A1A2E', '#081220']} style={StyleSheet.absoluteFill} />
                        <View style={[styles.quickIcon, { backgroundColor: Colors.doctorBlue + '18' }]}>
                            <Stethoscope color={Colors.doctorBlue} size={20} />
                        </View>
                        <Text style={styles.quickLabel}>Doctor</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickBtn}
                        onPress={() => handleCardPress('/grounding')}
                        activeOpacity={0.7}
                        testID="quick-ground"
                    >
                        <LinearGradient colors={['#0D2818', '#091E12']} style={StyleSheet.absoluteFill} />
                        <View style={[styles.quickIcon, { backgroundColor: Colors.accent + '18' }]}>
                            <Heart color={Colors.calm} size={20} />
                        </View>
                        <Text style={styles.quickLabel}>Ground</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.toolsSection}>
                    <Text style={styles.sectionLabel}>INTERVENTIONS</Text>

                    {TOOLS.map((tool, index) => (
                        <Animated.View
                            key={tool.id}
                            style={{
                                opacity: cardAnims[index],
                                transform: [{
                                    translateY: cardAnims[index].interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [30, 0],
                                    }),
                                }],
                            }}
                        >
                            <TouchableOpacity
                                style={styles.toolCard}
                                onPress={() => handleCardPress(tool.route)}
                                activeOpacity={0.7}
                                testID={`tool-${tool.id}`}
                            >
                                <LinearGradient
                                    colors={tool.gradient}
                                    style={StyleSheet.absoluteFill}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                />
                                <View style={styles.toolCardContent}>
                                    <View style={[styles.toolIconWrap, { backgroundColor: tool.accentColor + '18' }]}>
                                        {tool.icon}
                                    </View>
                                    <View style={styles.toolTextWrap}>
                                        <View style={styles.toolTitleRow}>
                                            <Text style={styles.toolTitle}>{tool.title}</Text>
                                            <View style={[styles.toolBadge, { backgroundColor: tool.accentColor + '20' }]}>
                                                <Text style={[styles.toolBadgeText, { color: tool.accentColor }]}>{tool.subtitle}</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.toolDescription}>{tool.description}</Text>
                                    </View>
                                    <ArrowRight color={Colors.textMuted} size={18} />
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </View>

                <View style={styles.companionCard}>
                    <LinearGradient colors={['rgba(22,58,38,0.6)', 'rgba(15,40,26,0.8)']} style={StyleSheet.absoluteFill} />
                    <View style={styles.companionContent}>
                        <Animated.View style={styles.companionOrb}>
                            <Sparkles color={Colors.accentSoft} size={24} />
                        </Animated.View>
                        <View style={styles.companionTextWrap}>
                            <Text style={styles.companionTitle}>{"I'm here with you"}</Text>
                            <Text style={styles.companionSub}>Your calm companion is always ready to help</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.privacyNote}>
                    <Text style={styles.privacyText}>🔒 Your data is private and secure</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const CALM_BTN_SIZE = SCREEN_WIDTH * 0.42;

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: Colors.bg,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    topRow: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'flex-start' as const,
        marginBottom: 16,
    },
    greetingArea: {
        flex: 1,
    },
    greeting: {
        fontSize: 22,
        fontWeight: '700' as const,
        color: Colors.text,
        marginBottom: 4,
    },
    greetingSub: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    doctorBadge: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        backgroundColor: 'rgba(22, 58, 38, 0.7)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 14,
        gap: 8,
        borderWidth: 1,
        borderColor: Colors.doctorBlue + '20',
    },
    doctorAvatar: {
        fontSize: 22,
    },
    doctorBadgeText: {
        fontSize: 11,
        fontWeight: '600' as const,
        color: Colors.doctorBlueSoft,
    },
    doctorBadgeSub: {
        fontSize: 9,
        color: Colors.textMuted,
        fontWeight: '500' as const,
    },
    stressCard: {
        borderRadius: 16,
        overflow: 'hidden' as const,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        marginBottom: 24,
    },
    stressCardInner: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
        padding: 16,
    },
    stressIndicator: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 12,
        flex: 1,
    },
    stressDotOuter: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    stressDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    stressLabel: {
        fontSize: 14,
        fontWeight: '700' as const,
    },
    stressMessage: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
        maxWidth: SCREEN_WIDTH * 0.45,
    },
    calmScore: {
        alignItems: 'center' as const,
        backgroundColor: 'rgba(22,58,38,0.5)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
    },
    calmScoreNum: {
        fontSize: 20,
        fontWeight: '800' as const,
        color: Colors.accent,
    },
    calmScoreLabel: {
        fontSize: 9,
        color: Colors.textMuted,
        fontWeight: '600' as const,
        marginTop: 2,
    },
    mainAction: {
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        marginBottom: 24,
        height: CALM_BTN_SIZE + 40,
    },
    breathGlow: {
        position: 'absolute' as const,
        width: CALM_BTN_SIZE + 60,
        height: CALM_BTN_SIZE + 60,
        borderRadius: (CALM_BTN_SIZE + 60) / 2,
        overflow: 'hidden' as const,
    },
    breathGlowGradient: {
        flex: 1,
        borderRadius: (CALM_BTN_SIZE + 60) / 2,
    },
    calmButton: {
        width: CALM_BTN_SIZE,
        height: CALM_BTN_SIZE,
        borderRadius: CALM_BTN_SIZE / 2,
        overflow: 'hidden' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        shadowColor: Colors.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    calmButtonGradient: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: CALM_BTN_SIZE / 2,
    },
    calmButtonText: {
        fontSize: 18,
        fontWeight: '800' as const,
        color: '#fff',
        marginTop: 10,
    },
    calmButtonSub: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
    },
    quickActions: {
        flexDirection: 'row' as const,
        gap: 10,
        marginBottom: 28,
    },
    quickBtn: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden' as const,
        padding: 14,
        alignItems: 'center' as const,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    quickIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    quickLabel: {
        fontSize: 11,
        fontWeight: '600' as const,
        color: Colors.textSecondary,
    },
    toolsSection: {
        gap: 12,
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700' as const,
        color: Colors.textMuted,
        letterSpacing: 2.5,
        marginBottom: 4,
    },
    toolCard: {
        borderRadius: 18,
        overflow: 'hidden' as const,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    toolCardContent: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        padding: 16,
        gap: 14,
    },
    toolIconWrap: {
        width: 50,
        height: 50,
        borderRadius: 14,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    toolTextWrap: {
        flex: 1,
    },
    toolTitleRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 8,
        marginBottom: 4,
    },
    toolTitle: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: Colors.text,
    },
    toolBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    toolBadgeText: {
        fontSize: 10,
        fontWeight: '600' as const,
        letterSpacing: 0.5,
    },
    toolDescription: {
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 18,
    },
    companionCard: {
        borderRadius: 16,
        overflow: 'hidden' as const,
        borderWidth: 1,
        borderColor: Colors.accent + '15',
        marginBottom: 16,
    },
    companionContent: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        padding: 16,
        gap: 14,
    },
    companionOrb: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.accent + '15',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        borderWidth: 1,
        borderColor: Colors.accent + '30',
    },
    companionTextWrap: {
        flex: 1,
    },
    companionTitle: {
        fontSize: 15,
        fontWeight: '700' as const,
        color: Colors.accentSoft,
        marginBottom: 2,
    },
    companionSub: {
        fontSize: 12,
        color: Colors.textMuted,
    },
    privacyNote: {
        alignItems: 'center' as const,
        paddingVertical: 8,
        marginBottom: 8,
    },
    privacyText: {
        fontSize: 11,
        color: Colors.textMuted,
    },
});