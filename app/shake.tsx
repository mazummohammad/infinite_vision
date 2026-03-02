import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    Platform,
    StatusBar,
    TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { DeviceMotion } from 'expo-sensors';
import { useRouter } from 'expo-router';
import { ChevronLeft, Zap, Check } from 'lucide-react-native';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const NUM_PARTICLES = 24;
const SHAKE_THRESHOLD = 2.5;
const SHAKES_TO_CLEAR = 12;

interface Particle {
    x: Animated.Value;
    y: Animated.Value;
    scale: Animated.Value;
    opacity: Animated.Value;
    rotation: Animated.Value;
    baseX: number;
    baseY: number;
    color: string;
    size: number;
}

const PARTICLE_COLORS = [
    '#EF4444', '#F87171', '#DC2626', '#FCA5A5',
    '#F59E0B', '#FBBF24', '#D97706', '#FDE68A',
    '#FB923C', '#F97316', '#EA580C', '#FDBA74',
];

function createParticles(): Particle[] {
    return Array.from({ length: NUM_PARTICLES }, (_, i) => {
        const angle = (i / NUM_PARTICLES) * Math.PI * 2;
        const radius = 40 + Math.random() * 80;
        return {
            x: new Animated.Value(0),
            y: new Animated.Value(0),
            scale: new Animated.Value(0.6 + Math.random() * 0.6),
            opacity: new Animated.Value(0.8),
            rotation: new Animated.Value(0),
            baseX: Math.cos(angle) * radius,
            baseY: Math.sin(angle) * radius,
            color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
            size: 8 + Math.random() * 16,
        };
    });
}

export default function ShakeScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [shakeCount, setShakeCount] = useState<number>(0);
    const [isComplete, setIsComplete] = useState<boolean>(false);
    const [, setIsShaking] = useState<boolean>(false);
    const shakeCountRef = useRef<number>(0);
    const lastShakeRef = useRef<number>(0);
    const motionSubRef = useRef<ReturnType<typeof DeviceMotion.addListener> | null>(null);

    const particles = useRef<Particle[]>(createParticles()).current;
    const screenShake = useRef(new Animated.Value(0)).current;
    const bgFlash = useRef(new Animated.Value(0)).current;
    const completeScale = useRef(new Animated.Value(0)).current;
    const progressWidth = useRef(new Animated.Value(0)).current;
    const centerGlow = useRef(new Animated.Value(0.5)).current;
    const instructionOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(centerGlow, { toValue: 0.8, duration: 1500, useNativeDriver: true }),
                Animated.timing(centerGlow, { toValue: 0.5, duration: 1500, useNativeDriver: true }),
            ])
        ).start();

        particles.forEach((p, i) => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(i * 80),
                    Animated.timing(p.rotation, { toValue: 1, duration: 3000 + Math.random() * 2000, useNativeDriver: true }),
                ])
            ).start();
        });
    }, [centerGlow, particles]);

    const triggerShakeEffect = useCallback(() => {
        if (isComplete) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        shakeCountRef.current += 1;
        const newCount = shakeCountRef.current;
        setShakeCount(newCount);
        setIsShaking(true);

        Animated.timing(progressWidth, {
            toValue: newCount / SHAKES_TO_CLEAR,
            duration: 200,
            useNativeDriver: false,
        }).start();

        Animated.sequence([
            Animated.timing(screenShake, { toValue: 8, duration: 50, useNativeDriver: true }),
            Animated.timing(screenShake, { toValue: -8, duration: 50, useNativeDriver: true }),
            Animated.timing(screenShake, { toValue: 4, duration: 50, useNativeDriver: true }),
            Animated.timing(screenShake, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();

        Animated.sequence([
            Animated.timing(bgFlash, { toValue: 0.15, duration: 60, useNativeDriver: true }),
            Animated.timing(bgFlash, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();

        const progress = newCount / SHAKES_TO_CLEAR;
        particles.forEach((p, i) => {
            const angle = (i / NUM_PARTICLES) * Math.PI * 2 + (Math.random() - 0.5);
            const dist = progress * 180 + Math.random() * 60;
            const targetX = Math.cos(angle) * dist;
            const targetY = Math.sin(angle) * dist;
            const targetOpacity = Math.max(0, 1 - progress * 1.2);
            const targetScale = Math.max(0.1, (1 - progress) * 1.2);

            Animated.parallel([
                Animated.spring(p.x, { toValue: targetX, tension: 60, friction: 6, useNativeDriver: true }),
                Animated.spring(p.y, { toValue: targetY, tension: 60, friction: 6, useNativeDriver: true }),
                Animated.timing(p.opacity, { toValue: targetOpacity, duration: 300, useNativeDriver: true }),
                Animated.timing(p.scale, { toValue: targetScale, duration: 300, useNativeDriver: true }),
            ]).start();
        });

        if (progress >= 0.5) {
            Animated.timing(instructionOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
        }

        setTimeout(() => setIsShaking(false), 200);

        if (newCount >= SHAKES_TO_CLEAR) {
            setTimeout(() => {
                setIsComplete(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                particles.forEach((p) => {
                    Animated.parallel([
                        Animated.timing(p.opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
                        Animated.timing(p.scale, { toValue: 0, duration: 600, useNativeDriver: true }),
                    ]).start();
                });

                Animated.spring(completeScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();
            }, 400);
        }
    }, [isComplete, particles, screenShake, bgFlash, progressWidth, completeScale, instructionOpacity]);

    useEffect(() => {
        if (Platform.OS === 'web') {
            console.log('[Shake] Web: using touch fallback');
            return;
        }

        DeviceMotion.setUpdateInterval(60);
        motionSubRef.current = DeviceMotion.addListener((data) => {
            const acc = data.accelerationIncludingGravity;
            if (!acc) return;

            const magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
            const shakiness = Math.abs(magnitude - 9.81);

            const now = Date.now();
            if (shakiness > SHAKE_THRESHOLD && now - lastShakeRef.current > 250) {
                lastShakeRef.current = now;
                triggerShakeEffect();
            }
        });

        return () => {
            if (motionSubRef.current) {
                motionSubRef.current.remove();
                motionSubRef.current = null;
            }
        };
    }, [triggerShakeEffect]);

    const handleReset = useCallback(() => {
        shakeCountRef.current = 0;
        setShakeCount(0);
        setIsComplete(false);
        progressWidth.setValue(0);
        completeScale.setValue(0);
        instructionOpacity.setValue(1);

        particles.forEach((p) => {
            p.x.setValue(0);
            p.y.setValue(0);
            p.opacity.setValue(0.8);
            p.scale.setValue(0.6 + Math.random() * 0.6);
        });
    }, [particles, progressWidth, completeScale, instructionOpacity]);

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#1A0A0A', '#1A1008', '#140A0A']} style={StyleSheet.absoluteFill} />

            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.warm + '30', opacity: bgFlash }]} />

            <Animated.View style={[styles.fullContent, { transform: [{ translateX: screenShake }] }]}>
                <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="shake-back">
                        <ChevronLeft color={Colors.textSecondary} size={22} />
                    </TouchableOpacity>
                    <Text style={styles.topTitle}>Shake Release</Text>
                    <View style={{ width: 36 }} />
                </View>

                {!isComplete ? (
                    <TouchableOpacity
                        style={styles.shakeArea}
                        activeOpacity={1}
                        onPress={() => {
                            if (Platform.OS === 'web') triggerShakeEffect();
                        }}
                    >
                        <View style={styles.particleContainer}>
                            {particles.map((p, i) => (
                                <Animated.View
                                    key={i}
                                    style={{
                                        position: 'absolute',
                                        width: p.size,
                                        height: p.size,
                                        borderRadius: p.size / 2,
                                        backgroundColor: p.color,
                                        opacity: p.opacity,
                                        transform: [
                                            { translateX: Animated.add(new Animated.Value(p.baseX), p.x) },
                                            { translateY: Animated.add(new Animated.Value(p.baseY), p.y) },
                                            { scale: p.scale },
                                            { rotate: p.rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
                                        ],
                                        shadowColor: p.color,
                                        shadowOffset: { width: 0, height: 0 },
                                        shadowOpacity: 0.6,
                                        shadowRadius: 6,
                                    }}
                                />
                            ))}

                            <Animated.View style={[styles.centerOrb, { opacity: centerGlow }]}>
                                <Zap color={Colors.warm} size={32} />
                            </Animated.View>
                        </View>

                        <Animated.View style={{ opacity: instructionOpacity }}>
                            <Text style={styles.shakeTitle}>
                                {Platform.OS === 'web' ? 'Tap to Release' : 'Shake to Release'}
                            </Text>
                            <Text style={styles.shakeSub}>
                                {Platform.OS === 'web'
                                    ? 'Tap the screen rapidly to shatter stress'
                                    : 'Shake your phone to shatter stress particles'}
                            </Text>
                        </Animated.View>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.completeCenter}>
                        <Animated.View style={[styles.completeWrap, { transform: [{ scale: completeScale }] }]}>
                            <View style={styles.completeIcon}>
                                <Check color="#fff" size={40} />
                            </View>
                            <Text style={styles.completeTitle}>Stress Released</Text>
                            <Text style={styles.completeSub}>All stress particles have been shattered.{'\n'}Feel the weight lifted off you.</Text>

                            <View style={styles.completeActions}>
                                <TouchableOpacity style={styles.warmBtn} onPress={handleReset} activeOpacity={0.7} testID="shake-again">
                                    <LinearGradient colors={['#D97706', '#B45309']} style={StyleSheet.absoluteFill} />
                                    <Text style={styles.warmBtnText}>Shake Again</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.outlineBtn} onPress={() => router.back()} activeOpacity={0.7} testID="shake-home">
                                    <Text style={styles.outlineBtnText}>Back to Home</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </View>
                )}

                <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
                    <View style={styles.progressSection}>
                        <Text style={styles.progressLabel}>{shakeCount} / {SHAKES_TO_CLEAR} shakes</Text>
                        <View style={styles.progressTrack}>
                            <Animated.View style={[styles.progressFill, {
                                width: progressWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                            }]}>
                                <LinearGradient colors={[Colors.warm, '#EF4444']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                            </Animated.View>
                        </View>
                    </View>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#1A0A0A' },
    fullContent: { flex: 1 },
    topBar: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
        paddingHorizontal: 16,
        paddingBottom: 8,
        zIndex: 10,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(42,26,10,0.7)',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    topTitle: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: Colors.textSecondary,
    },
    shakeArea: {
        flex: 1,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    particleContainer: {
        width: SCREEN_WIDTH * 0.8,
        height: SCREEN_WIDTH * 0.8,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        marginBottom: 40,
    },
    centerOrb: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(42,26,10,0.8)',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        borderWidth: 2,
        borderColor: Colors.warm + '40',
    },
    shakeTitle: {
        fontSize: 24,
        fontWeight: '800' as const,
        color: '#FDE68A',
        textAlign: 'center' as const,
        marginBottom: 8,
    },
    shakeSub: {
        fontSize: 14,
        color: '#FBBF24AA',
        textAlign: 'center' as const,
        lineHeight: 20,
    },
    completeCenter: {
        flex: 1,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    completeWrap: {
        alignItems: 'center' as const,
        paddingHorizontal: 30,
    },
    completeIcon: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: Colors.warm + '25',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        marginBottom: 28,
        borderWidth: 1.5,
        borderColor: Colors.warm + '40',
    },
    completeTitle: {
        fontSize: 28,
        fontWeight: '700' as const,
        color: '#FDE68A',
        marginBottom: 12,
    },
    completeSub: {
        fontSize: 15,
        color: '#FBBF24AA',
        textAlign: 'center' as const,
        lineHeight: 22,
    },
    completeActions: {
        marginTop: 44,
        gap: 16,
        width: '100%',
        alignItems: 'center' as const,
    },
    warmBtn: {
        width: '100%',
        height: 52,
        borderRadius: 26,
        overflow: 'hidden' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    warmBtnText: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: '#fff',
    },
    outlineBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.warm + '30',
        backgroundColor: 'rgba(42,26,10,0.4)',
    },
    outlineBtnText: {
        fontSize: 14,
        color: '#FBBF24AA',
        fontWeight: '600' as const,
    },
    bottomBar: {
        paddingHorizontal: 24,
    },
    progressSection: {
        alignItems: 'center' as const,
        gap: 8,
    },
    progressLabel: {
        fontSize: 12,
        color: Colors.warm + 'AA',
        fontWeight: '600' as const,
        letterSpacing: 0.5,
    },
    progressTrack: {
        width: '100%',
        height: 6,
        backgroundColor: 'rgba(42,26,10,0.6)',
        borderRadius: 3,
        overflow: 'hidden' as const,
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
        overflow: 'hidden' as const,
    },
});