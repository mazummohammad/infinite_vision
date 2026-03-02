import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    StatusBar,
    TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ChevronLeft, Hand, Check, RotateCcw } from 'lucide-react-native';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TouchPoint {
    id: number;
    label: string;
    instruction: string;
    x: number;
    y: number;
}

const AREA_SIZE = SCREEN_WIDTH * 0.85;

const TOUCH_POINTS: TouchPoint[] = [
    { id: 0, label: '1', instruction: 'Touch the top', x: 0.5, y: 0.08 },
    { id: 1, label: '2', instruction: 'Touch the right', x: 0.88, y: 0.45 },
    { id: 2, label: '3', instruction: 'Touch the bottom', x: 0.5, y: 0.82 },
    { id: 3, label: '4', instruction: 'Touch the left', x: 0.12, y: 0.45 },
    { id: 4, label: '5', instruction: 'Touch the center', x: 0.5, y: 0.45 },
];

const GROUNDING_PHRASES = [
    'Feel the screen beneath your finger',
    'Notice the weight of your phone',
    'Feel the air around you',
    'Notice the ground beneath your feet',
    'You are here. You are present.',
];

export default function GroundingScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [isComplete, setIsComplete] = useState<boolean>(false);
    const [, setShowPhrase] = useState<boolean>(false);

    const pointAnims = useRef(TOUCH_POINTS.map(() => ({
        scale: new Animated.Value(1),
        glow: new Animated.Value(0),
        opacity: new Animated.Value(0.3),
    }))).current;

    const lineProgress = useRef(new Animated.Value(0)).current;
    const phraseOpacity = useRef(new Animated.Value(0)).current;
    const completeScale = useRef(new Animated.Value(0)).current;
    const breatheAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(breatheAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
                Animated.timing(breatheAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
            ])
        ).start();
    }, [breatheAnim]);

    useEffect(() => {
        if (currentStep < TOUCH_POINTS.length && !isComplete) {
            const activeAnim = pointAnims[currentStep];
            Animated.timing(activeAnim.opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
            Animated.loop(
                Animated.sequence([
                    Animated.timing(activeAnim.glow, { toValue: 1, duration: 1200, useNativeDriver: true }),
                    Animated.timing(activeAnim.glow, { toValue: 0, duration: 1200, useNativeDriver: true }),
                ])
            ).start();
        }
    }, [currentStep, isComplete, pointAnims]);

    const handlePointTouch = useCallback((pointId: number) => {
        if (pointId !== currentStep || isComplete) return;

        console.log('[Grounding] Touched point:', pointId);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const anim = pointAnims[pointId];
        Animated.sequence([
            Animated.timing(anim.scale, { toValue: 1.4, duration: 150, useNativeDriver: true }),
            Animated.timing(anim.scale, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();

        anim.glow.stopAnimation();
        Animated.timing(anim.glow, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        Animated.timing(anim.opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();

        const newCompleted = [...completedSteps, pointId];
        setCompletedSteps(newCompleted);

        Animated.timing(lineProgress, {
            toValue: (pointId + 1) / TOUCH_POINTS.length,
            duration: 400,
            useNativeDriver: false,
        }).start();

        setShowPhrase(true);
        Animated.timing(phraseOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();

        setTimeout(() => {
            Animated.timing(phraseOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
                setShowPhrase(false);
            });
        }, 2000);

        if (pointId === TOUCH_POINTS.length - 1) {
            setTimeout(() => {
                setIsComplete(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Animated.spring(completeScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();
            }, 1500);
        } else {
            setTimeout(() => {
                setCurrentStep(pointId + 1);
            }, 800);
        }
    }, [currentStep, isComplete, completedSteps, pointAnims, lineProgress, phraseOpacity, completeScale]);

    const handleReset = useCallback(() => {
        setCurrentStep(0);
        setCompletedSteps([]);
        setIsComplete(false);
        setShowPhrase(false);
        lineProgress.setValue(0);
        completeScale.setValue(0);
        phraseOpacity.setValue(0);

        pointAnims.forEach((anim) => {
            anim.scale.setValue(1);
            anim.glow.setValue(0);
            anim.opacity.setValue(0.3);
        });
    }, [pointAnims, lineProgress, completeScale, phraseOpacity]);

    const currentPoint = TOUCH_POINTS[currentStep];

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#0A1A2E', '#081220', '#060E18']} style={StyleSheet.absoluteFill} />

            <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="ground-back">
                    <ChevronLeft color={Colors.textSecondary} size={22} />
                </TouchableOpacity>
                <Text style={styles.topTitle}>Grounding Exercise</Text>
                <View style={{ width: 36 }} />
            </View>

            {!isComplete ? (
                <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
                    <View style={styles.instructionArea}>
                        <Text style={styles.stepIndicator}>Step {currentStep + 1} of {TOUCH_POINTS.length}</Text>
                        <Text style={styles.instruction}>{currentPoint?.instruction ?? ''}</Text>

                        <Animated.View style={[styles.phraseWrap, { opacity: phraseOpacity }]}>
                            <Text style={styles.phraseText}>{GROUNDING_PHRASES[currentStep] ?? ''}</Text>
                        </Animated.View>
                    </View>

                    <View style={styles.progressDots}>
                        {TOUCH_POINTS.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.dot,
                                    completedSteps.includes(i) && styles.dotCompleted,
                                    i === currentStep && styles.dotActive,
                                ]}
                            />
                        ))}
                    </View>

                    <View style={[styles.touchArea, { width: AREA_SIZE, height: AREA_SIZE }]}>
                        <Animated.View style={[styles.areaGlow, {
                            opacity: breatheAnim.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.12] }),
                        }]} />

                        {TOUCH_POINTS.map((point, i) => {
                            const isActive = i === currentStep;
                            const isDone = completedSteps.includes(i);
                            const pointAnim = pointAnims[i];

                            return (
                                <TouchableOpacity
                                    key={point.id}
                                    style={[
                                        styles.touchPoint,
                                        {
                                            left: point.x * AREA_SIZE - 28,
                                            top: point.y * AREA_SIZE - 28,
                                        },
                                    ]}
                                    onPress={() => handlePointTouch(i)}
                                    activeOpacity={0.7}
                                    testID={`point-${i}`}
                                    disabled={!isActive}
                                >
                                    {isActive && (
                                        <Animated.View style={[styles.pointGlowRing, {
                                            opacity: pointAnim.glow,
                                            transform: [{ scale: pointAnim.glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }],
                                        }]} />
                                    )}

                                    <Animated.View style={[
                                        styles.pointCircle,
                                        isDone && styles.pointDone,
                                        isActive && styles.pointActiveCircle,
                                        {
                                            opacity: pointAnim.opacity,
                                            transform: [{ scale: pointAnim.scale }],
                                        },
                                    ]}>
                                        {isDone ? (
                                            <Check color="#fff" size={18} />
                                        ) : (
                                            <Text style={[styles.pointLabel, isActive && styles.pointLabelActive]}>{point.label}</Text>
                                        )}
                                    </Animated.View>
                                </TouchableOpacity>
                            );
                        })}

                        {completedSteps.length > 0 && completedSteps.map((stepIdx, i) => {
                            if (i === completedSteps.length - 1 && completedSteps.length < TOUCH_POINTS.length) {
                                const fromPt = TOUCH_POINTS[stepIdx];
                                const toPt = TOUCH_POINTS[stepIdx + 1];
                                if (!fromPt || !toPt) return null;

                                const fromX = fromPt.x * AREA_SIZE;
                                const fromY = fromPt.y * AREA_SIZE;
                                const toX = toPt.x * AREA_SIZE;
                                const toY = toPt.y * AREA_SIZE;
                                const length = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);
                                const angle = Math.atan2(toY - fromY, toX - fromX) * (180 / Math.PI);

                                return (
                                    <Animated.View
                                        key={`line-${i}`}
                                        style={[styles.connectLine, {
                                            left: fromX,
                                            top: fromY,
                                            width: length,
                                            transform: [{ rotate: `${angle}deg` }],
                                            opacity: 0.4,
                                        }]}
                                    />
                                );
                            }
                            if (i > 0) {
                                const fromPt = TOUCH_POINTS[completedSteps[i - 1]];
                                const toPtCur = TOUCH_POINTS[stepIdx];
                                if (!fromPt || !toPtCur) return null;

                                const fromX = fromPt.x * AREA_SIZE;
                                const fromY = fromPt.y * AREA_SIZE;
                                const toX = toPtCur.x * AREA_SIZE;
                                const toY = toPtCur.y * AREA_SIZE;
                                const length = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);
                                const angle = Math.atan2(toY - fromY, toX - fromX) * (180 / Math.PI);

                                return (
                                    <View
                                        key={`solidline-${i}`}
                                        style={[styles.connectLine, styles.connectLineSolid, {
                                            left: fromX,
                                            top: fromY,
                                            width: length,
                                            transform: [{ rotate: `${angle}deg` }],
                                        }]}
                                    />
                                );
                            }
                            return null;
                        })}
                    </View>
                </Animated.View>
            ) : (
                <View style={styles.completeCenter}>
                    <Animated.View style={[styles.completeWrap, { transform: [{ scale: completeScale }] }]}>
                        <View style={styles.completeIcon}>
                            <Hand color="#60A5FA" size={44} />
                        </View>
                        <Text style={styles.completeTitle}>Grounded</Text>
                        <Text style={styles.completeSub}>
                            You have completed the 5-point grounding exercise.{'\n'}Your mind is more present now.
                        </Text>

                        <View style={styles.completeActions}>
                            <TouchableOpacity style={styles.blueBtn} onPress={handleReset} activeOpacity={0.7} testID="ground-again">
                                <LinearGradient colors={['#3B82F6', '#2563EB']} style={StyleSheet.absoluteFill} />
                                <RotateCcw color="#fff" size={18} />
                                <Text style={styles.blueBtnText}>Try Again</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.outlineBtn} onPress={() => router.back()} activeOpacity={0.7} testID="ground-home">
                                <Text style={styles.outlineBtnText}>Back to Home</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            )}

            <View style={[styles.bottomHint, { paddingBottom: insets.bottom + 16 }]}>
                <Text style={styles.hintText}>Touch each point in sequence to ground yourself</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0A1A2E' },
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
        backgroundColor: 'rgba(10,26,46,0.8)',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        borderWidth: 1,
        borderColor: '#60A5FA20',
    },
    topTitle: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: '#94A3B8',
    },
    mainContent: {
        flex: 1,
        alignItems: 'center' as const,
    },
    instructionArea: {
        alignItems: 'center' as const,
        paddingHorizontal: 24,
        marginTop: 8,
    },
    stepIndicator: {
        fontSize: 12,
        fontWeight: '700' as const,
        color: '#60A5FA',
        letterSpacing: 2,
        textTransform: 'uppercase' as const,
        marginBottom: 8,
    },
    instruction: {
        fontSize: 26,
        fontWeight: '800' as const,
        color: '#E2E8F0',
        textAlign: 'center' as const,
    },
    phraseWrap: {
        marginTop: 12,
        paddingHorizontal: 20,
        paddingVertical: 8,
        backgroundColor: '#60A5FA10',
        borderRadius: 12,
    },
    phraseText: {
        fontSize: 13,
        color: '#60A5FACC',
        textAlign: 'center' as const,
        fontStyle: 'italic' as const,
    },
    progressDots: {
        flexDirection: 'row' as const,
        gap: 8,
        marginTop: 20,
        marginBottom: 16,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#1E3A5F',
    },
    dotCompleted: {
        backgroundColor: '#60A5FA',
    },
    dotActive: {
        backgroundColor: '#60A5FA80',
        width: 20,
        borderRadius: 4,
    },
    touchArea: {
        position: 'relative' as const,
    },
    areaGlow: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: SCREEN_WIDTH * 0.42,
        backgroundColor: '#60A5FA',
    },
    touchPoint: {
        position: 'absolute' as const,
        width: 56,
        height: 56,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    pointGlowRing: {
        position: 'absolute' as const,
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: '#60A5FA50',
    },
    pointCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#1E3A5F',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        borderWidth: 1.5,
        borderColor: '#2D4A6F',
    },
    pointActiveCircle: {
        backgroundColor: '#1E3A5F',
        borderColor: '#60A5FA80',
        shadowColor: '#60A5FA',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
    },
    pointDone: {
        backgroundColor: '#3B82F6',
        borderColor: '#60A5FA',
    },
    pointLabel: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: '#475569',
    },
    pointLabelActive: {
        color: '#60A5FA',
    },
    connectLine: {
        position: 'absolute' as const,
        height: 2,
        backgroundColor: '#60A5FA30',
        transformOrigin: 'left center',
    },
    connectLineSolid: {
        backgroundColor: '#60A5FA60',
        opacity: 1,
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
        backgroundColor: '#60A5FA18',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        marginBottom: 28,
        borderWidth: 1.5,
        borderColor: '#60A5FA30',
    },
    completeTitle: {
        fontSize: 28,
        fontWeight: '700' as const,
        color: '#E2E8F0',
        marginBottom: 12,
    },
    completeSub: {
        fontSize: 15,
        color: '#94A3B8',
        textAlign: 'center' as const,
        lineHeight: 22,
    },
    completeActions: {
        marginTop: 44,
        gap: 16,
        width: '100%',
        alignItems: 'center' as const,
    },
    blueBtn: {
        width: '100%',
        height: 52,
        borderRadius: 26,
        overflow: 'hidden' as const,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        gap: 8,
    },
    blueBtnText: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: '#fff',
    },
    outlineBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#60A5FA25',
        backgroundColor: 'rgba(10,26,46,0.5)',
    },
    outlineBtnText: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '600' as const,
    },
    bottomHint: {
        alignItems: 'center' as const,
        paddingHorizontal: 24,
    },
    hintText: {
        fontSize: 12,
        color: '#475569',
        textAlign: 'center' as const,
    },
});