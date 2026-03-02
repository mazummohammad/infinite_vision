import * as React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    Platform,
    PanResponder,
    StatusBar,
    TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { DeviceMotion } from 'expo-sensors';
import { useRouter } from 'expo-router';
import { Sparkles, Heart, Leaf, ChevronLeft, RotateCcw } from 'lucide-react-native';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CIRCLE_SIZE = SCREEN_WIDTH * 0.52;

type DetectPhase = 'ready' | 'detecting' | 'intervention' | 'complete';

interface TouchData {
    timestamps: number[];
    positions: { x: number; y: number }[];
}

interface ShakeData {
    values: number[];
}

const BREATHING_INHALE = 4000;
const BREATHING_HOLD = 2000;
const BREATHING_EXHALE = 6000;
const TOTAL_BREATHING_CYCLES = 3;

function SparkleParticle({ delay, top, left }: { delay: number; top: string; left: string }) {
    const opacity = useRef(new Animated.Value(0.1)).current;

    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(opacity, { toValue: 0.8, duration: 1800, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.1, duration: 1800, useNativeDriver: true }),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, [delay, opacity]);

    return (
        <Animated.View
            style={{
                position: 'absolute',
                top,
                left,
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: Colors.sparkle,
                opacity,
            }}
        />
    );
}

export default function DetectScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [phase, setPhase] = useState<DetectPhase>('ready');
    const [stressLevel, setStressLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
    const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
    const [cycleCount, setCycleCount] = useState<number>(0);

    const touchDataRef = useRef<TouchData>({ timestamps: [], positions: [] });
    const shakeDataRef = useRef<ShakeData>({ values: [] });
    const motionSubRef = useRef<ReturnType<typeof DeviceMotion.addListener> | null>(null);
    const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const breathTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isTouchingRef = useRef<boolean>(false);

    const circleScale = useRef(new Animated.Value(1)).current;
    const circleOpacity = useRef(new Animated.Value(0.7)).current;
    const pulseScale = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const detectProgress = useRef(new Animated.Value(0)).current;
    const breatheScale = useRef(new Animated.Value(0.5)).current;
    const breatheGlow = useRef(new Animated.Value(0)).current;
    const ringRotation = useRef(new Animated.Value(0)).current;
    const completeScale = useRef(new Animated.Value(0)).current;
    const fingerGlow = useRef(new Animated.Value(0)).current;
    const tremorIndicator = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseScale, { toValue: 1.08, duration: 2500, useNativeDriver: true }),
                Animated.timing(pulseScale, { toValue: 1, duration: 2500, useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(
            Animated.timing(ringRotation, { toValue: 1, duration: 12000, useNativeDriver: true })
        ).start();
    }, [pulseScale, ringRotation]);

    const startMotionDetection = useCallback(() => {
        if (Platform.OS === 'web') {
            console.log('[Detect] Skipping motion on web');
            return;
        }
        DeviceMotion.setUpdateInterval(80);
        motionSubRef.current = DeviceMotion.addListener((data) => {
            const acc = data.accelerationIncludingGravity;
            if (acc) {
                const magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
                const shakiness = Math.abs(magnitude - 9.81);
                shakeDataRef.current.values.push(shakiness);
                if (shakeDataRef.current.values.length > 50) {
                    shakeDataRef.current.values.shift();
                }
            }
        });
        console.log('[Detect] Motion detection started');
    }, []);

    const stopMotionDetection = useCallback(() => {
        if (motionSubRef.current) {
            motionSubRef.current.remove();
            motionSubRef.current = null;
        }
    }, []);

    const calculateTremorScore = useCallback((): number => {
        const positions = touchDataRef.current.positions;
        if (positions.length < 5) return 0;

        let totalJitter = 0;
        for (let i = 1; i < positions.length; i++) {
            const dx = positions[i].x - positions[i - 1].x;
            const dy = positions[i].y - positions[i - 1].y;
            totalJitter += Math.sqrt(dx * dx + dy * dy);
        }
        const avgJitter = totalJitter / (positions.length - 1);
        console.log('[Detect] Finger tremor jitter:', avgJitter);
        return avgJitter;
    }, []);

    const calculateStressLevel = useCallback((): 'LOW' | 'MEDIUM' | 'HIGH' => {
        let score = 0;

        const tremorScore = calculateTremorScore();
        if (tremorScore > 5) score += 3;
        else if (tremorScore > 2) score += 2;
        else score += 1;

        const timestamps = touchDataRef.current.timestamps;
        if (timestamps.length > 3) {
            const intervals: number[] = [];
            for (let i = 1; i < timestamps.length; i++) {
                intervals.push(timestamps[i] - timestamps[i - 1]);
            }
            const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const variance = intervals.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / intervals.length;
            const irregularity = Math.sqrt(variance);
            console.log('[Detect] Touch irregularity:', irregularity);
            if (irregularity > 200) score += 3;
            else if (irregularity > 100) score += 2;
            else score += 1;
        }

        const shakeValues = shakeDataRef.current.values;
        if (shakeValues.length > 5) {
            const avgShake = shakeValues.reduce((a, b) => a + b, 0) / shakeValues.length;
            console.log('[Detect] Average shake:', avgShake);
            if (avgShake > 3) score += 3;
            else if (avgShake > 1.5) score += 2;
            else score += 1;
        }

        console.log('[Detect] Total stress score:', score);
        if (score >= 6) return 'HIGH';
        if (score >= 4) return 'MEDIUM';
        return 'LOW';
    }, [calculateTremorScore]);

    const runBreathingCycle = useCallback((cycle: number) => {
        if (cycle >= TOTAL_BREATHING_CYCLES) {
            goToPhase('complete');
            return;
        }

        setCycleCount(cycle + 1);
        setBreathPhase('inhale');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.timing(breatheScale, { toValue: 1, duration: BREATHING_INHALE, useNativeDriver: true }).start();
        Animated.timing(breatheGlow, { toValue: 1, duration: BREATHING_INHALE, useNativeDriver: true }).start();

        breathTimerRef.current = setTimeout(() => {
            setBreathPhase('hold');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            breathTimerRef.current = setTimeout(() => {
                setBreathPhase('exhale');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Animated.timing(breatheScale, { toValue: 0.5, duration: BREATHING_EXHALE, useNativeDriver: true }).start();
                Animated.timing(breatheGlow, { toValue: 0, duration: BREATHING_EXHALE, useNativeDriver: true }).start();

                breathTimerRef.current = setTimeout(() => {
                    runBreathingCycle(cycle + 1);
                }, BREATHING_EXHALE);
            }, BREATHING_HOLD);
        }, BREATHING_INHALE);
    }, [breatheScale, breatheGlow]);

    const goToPhase = useCallback((newPhase: DetectPhase) => {
        console.log('[Detect] Phase:', newPhase);
        Animated.timing(fadeAnim, { toValue: 0, duration: 350, useNativeDriver: true }).start(() => {
            setPhase(newPhase);

            if (newPhase === 'detecting') {
                detectProgress.setValue(0);
                Animated.timing(detectProgress, { toValue: 1, duration: 3500, useNativeDriver: false }).start(() => {
                    const level = calculateStressLevel();
                    setStressLevel(level);
                    stopMotionDetection();
                    setTimeout(() => goToPhase('intervention'), 600);
                });
            }

            if (newPhase === 'intervention') {
                breatheScale.setValue(0.5);
                breatheGlow.setValue(0);
                setTimeout(() => runBreathingCycle(0), 400);
            }

            if (newPhase === 'complete') {
                if (breathTimerRef.current) clearTimeout(breathTimerRef.current);
                completeScale.setValue(0);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Animated.spring(completeScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();
            }

            Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
        });
    }, [fadeAnim, detectProgress, calculateStressLevel, stopMotionDetection, breatheScale, breatheGlow, runBreathingCycle, completeScale]);

    const handleTouchStart = useCallback((evt: { nativeEvent: { locationX: number; locationY: number } }) => {
        isTouchingRef.current = true;
        touchDataRef.current = { timestamps: [Date.now()], positions: [{ x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY }] };
        shakeDataRef.current = { values: [] };

        startMotionDetection();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        Animated.timing(circleScale, { toValue: 0.9, duration: 300, useNativeDriver: true }).start();
        Animated.timing(circleOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        Animated.timing(fingerGlow, { toValue: 1, duration: 600, useNativeDriver: true }).start();

        holdTimerRef.current = setTimeout(() => {
            if (isTouchingRef.current) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                goToPhase('detecting');
            }
        }, 2000);
    }, [circleScale, circleOpacity, fingerGlow, startMotionDetection, goToPhase]);

    const handleTouchMove = useCallback((evt: { nativeEvent: { locationX: number; locationY: number } }) => {
        touchDataRef.current.timestamps.push(Date.now());
        touchDataRef.current.positions.push({ x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY });

        const tremorScore = calculateTremorScore();
        const normalizedTremor = Math.min(tremorScore / 8, 1);
        tremorIndicator.setValue(normalizedTremor);
    }, [calculateTremorScore, tremorIndicator]);

    const handleTouchEnd = useCallback(() => {
        isTouchingRef.current = false;
        if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
        }
        Animated.timing(circleScale, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        Animated.timing(circleOpacity, { toValue: 0.7, duration: 300, useNativeDriver: true }).start();
        Animated.timing(fingerGlow, { toValue: 0, duration: 400, useNativeDriver: true }).start();

        if (phase === 'ready') stopMotionDetection();
    }, [circleScale, circleOpacity, fingerGlow, stopMotionDetection, phase]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => handleTouchStart(evt),
            onPanResponderMove: (evt) => handleTouchMove(evt),
            onPanResponderRelease: () => handleTouchEnd(),
            onPanResponderTerminate: () => handleTouchEnd(),
        })
    ).current;

    useEffect(() => {
        return () => {
            stopMotionDetection();
            if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
            if (breathTimerRef.current) clearTimeout(breathTimerRef.current);
        };
    }, [stopMotionDetection]);

    const ringRotate = ringRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

    const getBreathText = () => {
        switch (breathPhase) {
            case 'inhale': return 'Breathe In';
            case 'hold': return 'Hold';
            case 'exhale': return 'Breathe Out';
        }
    };

    const getBreathSub = () => {
        switch (breathPhase) {
            case 'inhale': return 'Slowly fill your lungs';
            case 'hold': return 'Keep it steady';
            case 'exhale': return 'Release all tension';
        }
    };

    const renderReady = () => (
        <View style={styles.phaseContainer}>
            <LinearGradient colors={['#0B1A14', '#0F2A1C', '#0B1A14']} style={StyleSheet.absoluteFill} />

            <SparkleParticle delay={0} top="15%" left="12%" />
            <SparkleParticle delay={400} top="22%" left="78%" />
            <SparkleParticle delay={800} top="45%" left="8%" />
            <SparkleParticle delay={1200} top="60%" left="85%" />
            <SparkleParticle delay={600} top="75%" left="20%" />

            <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="back-btn">
                    <ChevronLeft color={Colors.textSecondary} size={22} />
                </TouchableOpacity>
                <Text style={styles.topTitle}>Stress Detection</Text>
                <View style={{ width: 36 }} />
            </View>

            <View style={styles.readyCenter}>
                <Text style={styles.readyHeading}>Place your finger{'\n'}and hold</Text>
                <Text style={styles.readySub}>We detect micro-tremors and touch patterns{'\n'}to measure your stress level</Text>

                <View style={styles.circleArea} {...panResponder.panHandlers}>
                    <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseScale }], opacity: circleOpacity }]}>
                        <LinearGradient
                            colors={[Colors.accent + '08', Colors.accent + '20', Colors.accent + '08']}
                            style={StyleSheet.absoluteFill}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />
                    </Animated.View>

                    <Animated.View style={[styles.fingerGlowRing, {
                        opacity: fingerGlow,
                        transform: [{ scale: fingerGlow.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.3] }) }],
                    }]} />

                    <Animated.View style={[styles.mainCircle, { transform: [{ scale: circleScale }], opacity: circleOpacity }]}>
                        <LinearGradient
                            colors={[Colors.accent + 'CC', Colors.accentGlow + 'AA', Colors.accentDark + 'DD']}
                            style={styles.circleGradient}
                            start={{ x: 0.3, y: 0 }}
                            end={{ x: 0.7, y: 1 }}
                        />
                        <Leaf color="#fff" size={32} />
                    </Animated.View>
                </View>

                <Animated.View style={[styles.tremorBar, {
                    opacity: fingerGlow,
                }]}>
                    <Text style={styles.tremorLabel}>Tremor Detection</Text>
                    <View style={styles.tremorTrack}>
                        <Animated.View style={[styles.tremorFill, {
                            width: tremorIndicator.interpolate({ inputRange: [0, 1], outputRange: ['5%', '100%'] }),
                            backgroundColor: tremorIndicator.interpolate({
                                inputRange: [0, 0.4, 0.7, 1],
                                outputRange: [Colors.accent, Colors.warm, Colors.stress, Colors.stress],
                            }),
                        }]} />
                    </View>
                </Animated.View>

                <Text style={styles.holdHint}>Hold for 2 seconds to begin analysis</Text>
            </View>
        </View>
    );

    const renderDetecting = () => (
        <View style={styles.phaseContainer}>
            <LinearGradient colors={['#0B1A14', '#132E1F', '#0B1A14']} style={StyleSheet.absoluteFill} />

            <View style={styles.detectCenter}>
                <Animated.View style={[styles.detectRing, { transform: [{ rotate: ringRotate }] }]}>
                    <LinearGradient
                        colors={['transparent', Colors.warm + '50', 'transparent', Colors.accent + '30']}
                        style={styles.detectRingGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                </Animated.View>

                <View style={styles.detectInner}>
                    <LinearGradient colors={['rgba(22, 58, 38, 0.9)', 'rgba(15, 40, 26, 0.95)']} style={StyleSheet.absoluteFill} />
                    <Sparkles color={Colors.warmSoft} size={36} />
                </View>

                <View style={styles.detectTextWrap}>
                    <Text style={styles.detectTitle}>Analyzing</Text>
                    <Text style={styles.detectSub}>Reading tremors, touch patterns & motion...</Text>
                </View>

                <View style={styles.progressWrap}>
                    <View style={styles.progressTrack}>
                        <Animated.View style={[styles.progressFill, {
                            width: detectProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                        }]}>
                            <LinearGradient colors={[Colors.accent, Colors.accentGlow]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                        </Animated.View>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderIntervention = () => {
        const stressColor = stressLevel === 'HIGH' ? Colors.stress : stressLevel === 'MEDIUM' ? Colors.warm : Colors.calm;

        return (
            <View style={styles.phaseContainer}>
                <LinearGradient colors={['#0B1A14', '#0F2A1C', '#0B1A14']} style={StyleSheet.absoluteFill} />

                <View style={[styles.interventionTop, { paddingTop: insets.top + 16 }]}>
                    <View style={[styles.stressBadge, { backgroundColor: stressColor + '20', borderColor: stressColor + '40' }]}>
                        <View style={[styles.stressDot, { backgroundColor: stressColor }]} />
                        <Text style={[styles.stressBadgeText, { color: stressColor }]}>{stressLevel} STRESS</Text>
                    </View>
                    <Text style={styles.cycleText}>{cycleCount} / {TOTAL_BREATHING_CYCLES}</Text>
                </View>

                <View style={styles.breathTitle}>
                    <Text style={styles.sectionTitle}>Box Breathing</Text>
                </View>

                <View style={styles.centerSection}>
                    <Animated.View style={[styles.breatheOuter, {
                        transform: [{ scale: breatheScale }],
                        opacity: breatheGlow.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.3] }),
                    }]} />
                    <Animated.View style={[styles.breatheCircle, { transform: [{ scale: breatheScale }] }]}>
                        <LinearGradient
                            colors={[Colors.accent + 'DD', Colors.accentGlow + 'AA', Colors.accentDark + 'CC']}
                            style={styles.breatheGrad}
                            start={{ x: 0.3, y: 0 }}
                            end={{ x: 0.7, y: 1 }}
                        />
                    </Animated.View>
                    <View style={styles.breatheTextWrap} pointerEvents="none">
                        <Text style={styles.breatheMainText}>{getBreathText()}</Text>
                        <Text style={styles.breatheSubText}>{getBreathSub()}</Text>
                    </View>
                </View>

                <View style={[styles.interventionBot, { paddingBottom: insets.bottom + 24 }]}>
                    <View style={styles.timelineCard}>
                        <LinearGradient colors={['rgba(22,58,38,0.7)', 'rgba(15,40,26,0.85)']} style={StyleSheet.absoluteFill} />
                        <View style={styles.timeline}>
                            <View style={[styles.tlSeg, breathPhase === 'inhale' && styles.tlActive]} />
                            <View style={[styles.tlSeg, styles.tlShort, breathPhase === 'hold' && styles.tlActive]} />
                            <View style={[styles.tlSeg, styles.tlLong, breathPhase === 'exhale' && styles.tlActive]} />
                        </View>
                        <View style={styles.tlLabels}>
                            <Text style={[styles.tlLabel, breathPhase === 'inhale' && styles.tlLabelActive]}>Inhale 4s</Text>
                            <Text style={[styles.tlLabel, breathPhase === 'hold' && styles.tlLabelActive]}>Hold 2s</Text>
                            <Text style={[styles.tlLabel, breathPhase === 'exhale' && styles.tlLabelActive]}>Exhale 6s</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderComplete = () => (
        <View style={styles.phaseContainer}>
            <LinearGradient colors={['#0B1A14', '#0F2A1C', '#0B1A14']} style={StyleSheet.absoluteFill} />

            <View style={styles.centerSection}>
                <Animated.View style={[styles.completeWrap, { transform: [{ scale: completeScale }] }]}>
                    <View style={styles.completeIcon}>
                        <Heart color={Colors.calmSoft} size={44} fill={Colors.calm + '50'} />
                    </View>
                    <Text style={styles.completeTitle}>You are calmer now</Text>
                    <Text style={styles.completeSub}>Your breathing session is complete.{'\n'}Take this calm with you.</Text>

                    <View style={styles.completeActions}>
                        <TouchableOpacity style={styles.greenBtn} onPress={() => {
                            setPhase('ready');
                            setCycleCount(0);
                        }} activeOpacity={0.7} testID="restart-detect">
                            <LinearGradient colors={[Colors.buttonGreen, Colors.buttonGreenDark]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                            <RotateCcw color="#fff" size={18} />
                            <Text style={styles.greenBtnText}>Try Again</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.outlineBtn} onPress={() => router.back()} activeOpacity={0.7} testID="back-home-detect">
                            <Text style={styles.outlineBtnText}>Back to Home</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </View>
    );

    const renderPhase = () => {
        switch (phase) {
            case 'ready': return renderReady();
            case 'detecting': return renderDetecting();
            case 'intervention': return renderIntervention();
            case 'complete': return renderComplete();
        }
    };

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                {renderPhase()}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.bg },
    content: { flex: 1 },
    phaseContainer: { flex: 1 },
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
        backgroundColor: 'rgba(22,58,38,0.6)',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    topTitle: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: Colors.textSecondary,
    },
    readyCenter: {
        flex: 1,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        paddingHorizontal: 24,
    },
    readyHeading: {
        fontSize: 30,
        fontWeight: '800' as const,
        color: Colors.text,
        textAlign: 'center' as const,
        lineHeight: 38,
        marginBottom: 10,
    },
    readySub: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center' as const,
        lineHeight: 20,
        marginBottom: 36,
    },
    circleArea: {
        width: CIRCLE_SIZE + 60,
        height: CIRCLE_SIZE + 60,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    pulseRing: {
        position: 'absolute' as const,
        width: CIRCLE_SIZE + 50,
        height: CIRCLE_SIZE + 50,
        borderRadius: (CIRCLE_SIZE + 50) / 2,
        overflow: 'hidden' as const,
    },
    fingerGlowRing: {
        position: 'absolute' as const,
        width: CIRCLE_SIZE + 30,
        height: CIRCLE_SIZE + 30,
        borderRadius: (CIRCLE_SIZE + 30) / 2,
        borderWidth: 2,
        borderColor: Colors.accent + '60',
    },
    mainCircle: {
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        borderRadius: CIRCLE_SIZE / 2,
        overflow: 'hidden' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    circleGradient: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: CIRCLE_SIZE / 2,
    },
    tremorBar: {
        width: SCREEN_WIDTH * 0.6,
        marginTop: 28,
        alignItems: 'center' as const,
    },
    tremorLabel: {
        fontSize: 11,
        color: Colors.textMuted,
        fontWeight: '600' as const,
        letterSpacing: 1,
        marginBottom: 8,
        textTransform: 'uppercase' as const,
    },
    tremorTrack: {
        width: '100%',
        height: 4,
        backgroundColor: Colors.surfaceLight,
        borderRadius: 2,
        overflow: 'hidden' as const,
    },
    tremorFill: {
        height: '100%',
        borderRadius: 2,
    },
    holdHint: {
        fontSize: 12,
        color: Colors.textMuted,
        marginTop: 20,
    },
    detectCenter: {
        flex: 1,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    detectRing: {
        position: 'absolute' as const,
        width: CIRCLE_SIZE + 50,
        height: CIRCLE_SIZE + 50,
        borderRadius: (CIRCLE_SIZE + 50) / 2,
        overflow: 'hidden' as const,
    },
    detectRingGradient: {
        flex: 1,
        borderRadius: (CIRCLE_SIZE + 50) / 2,
    },
    detectInner: {
        width: CIRCLE_SIZE * 0.55,
        height: CIRCLE_SIZE * 0.55,
        borderRadius: (CIRCLE_SIZE * 0.55) / 2,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        overflow: 'hidden' as const,
        borderWidth: 1,
        borderColor: Colors.warm + '30',
    },
    detectTextWrap: {
        marginTop: 36,
        alignItems: 'center' as const,
    },
    detectTitle: {
        fontSize: 28,
        fontWeight: '700' as const,
        color: Colors.text,
    },
    detectSub: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 8,
    },
    progressWrap: {
        width: SCREEN_WIDTH * 0.55,
        marginTop: 28,
    },
    progressTrack: {
        height: 4,
        backgroundColor: Colors.surfaceLight,
        borderRadius: 2,
        overflow: 'hidden' as const,
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
        overflow: 'hidden' as const,
    },
    interventionTop: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        paddingHorizontal: 24,
    },
    stressBadge: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        gap: 7,
        borderWidth: 1,
    },
    stressDot: { width: 8, height: 8, borderRadius: 4 },
    stressBadgeText: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 2 },
    cycleText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' as const },
    breathTitle: { paddingHorizontal: 24, paddingTop: 16 },
    sectionTitle: { fontSize: 20, fontWeight: '700' as const, color: Colors.text },
    centerSection: {
        flex: 1,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    breatheOuter: {
        position: 'absolute' as const,
        width: CIRCLE_SIZE + 80,
        height: CIRCLE_SIZE + 80,
        borderRadius: (CIRCLE_SIZE + 80) / 2,
        backgroundColor: Colors.calm,
    },
    breatheCircle: {
        width: CIRCLE_SIZE + 20,
        height: CIRCLE_SIZE + 20,
        borderRadius: (CIRCLE_SIZE + 20) / 2,
        overflow: 'hidden' as const,
    },
    breatheGrad: {
        flex: 1,
        borderRadius: (CIRCLE_SIZE + 20) / 2,
    },
    breatheTextWrap: {
        position: 'absolute' as const,
        alignItems: 'center' as const,
    },
    breatheMainText: { fontSize: 26, fontWeight: '700' as const, color: '#fff' },
    breatheSubText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 6 },
    interventionBot: { paddingHorizontal: 20 },
    timelineCard: {
        borderRadius: 18,
        padding: 20,
        overflow: 'hidden' as const,
        borderWidth: 1,
        borderColor: Colors.accent + '15',
        alignItems: 'center' as const,
    },
    timeline: { flexDirection: 'row' as const, gap: 6, marginBottom: 10 },
    tlSeg: { width: 80, height: 5, borderRadius: 3, backgroundColor: Colors.surfaceLight },
    tlShort: { width: 40 },
    tlLong: { width: 110 },
    tlActive: { backgroundColor: Colors.accent },
    tlLabels: { flexDirection: 'row' as const, gap: 6 },
    tlLabel: { fontSize: 11, color: Colors.textMuted, width: 80, textAlign: 'center' as const, fontWeight: '500' as const },
    tlLabelActive: { color: Colors.accentSoft },
    completeWrap: { alignItems: 'center' as const, paddingHorizontal: 30 },
    completeIcon: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: Colors.accent + '15',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        marginBottom: 28,
        borderWidth: 1.5,
        borderColor: Colors.accent + '30',
    },
    completeTitle: { fontSize: 28, fontWeight: '700' as const, color: Colors.text, marginBottom: 12 },
    completeSub: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' as const, lineHeight: 22 },
    completeActions: { marginTop: 44, gap: 16, width: '100%', alignItems: 'center' as const },
    greenBtn: {
        width: '100%',
        height: 52,
        borderRadius: 26,
        overflow: 'hidden' as const,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        gap: 8,
    },
    greenBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
    outlineBtn: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.accent + '25',
        backgroundColor: 'rgba(22,58,38,0.4)',
        gap: 8,
    },
    outlineBtnText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' as const },
});