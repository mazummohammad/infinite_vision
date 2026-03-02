import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    StatusBar,
    TouchableOpacity,
    PanResponder,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Wind, Check, RotateCcw } from 'lucide-react-native';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const NEGATIVE_THOUGHTS = [
    "I can't handle this",
    "Everything is too much",
    "I'm not good enough",
    "This will never end",
    "I'm overwhelmed",
    "Nothing is working",
    "I'm falling behind",
    "It's all my fault",
];

export default function SwipeScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [dismissed, setDismissed] = useState<number[]>([]);
    const [isComplete, setIsComplete] = useState<boolean>(false);

    const thoughtAnims = useRef(NEGATIVE_THOUGHTS.map(() => ({
        x: new Animated.Value(0),
        opacity: new Animated.Value(1),
        scale: new Animated.Value(1),
    }))).current;

    const completeScale = useRef(new Animated.Value(0)).current;
    const bgShift = useRef(new Animated.Value(0)).current;

    const dismissThought = useCallback((index: number) => {
        if (dismissed.includes(index)) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        Animated.parallel([
            Animated.timing(thoughtAnims[index].x, { toValue: SCREEN_WIDTH + 50, duration: 350, useNativeDriver: true }),
            Animated.timing(thoughtAnims[index].opacity, { toValue: 0, duration: 350, useNativeDriver: true }),
            Animated.timing(thoughtAnims[index].scale, { toValue: 0.8, duration: 350, useNativeDriver: true }),
        ]).start();

        const newDismissed = [...dismissed, index];
        setDismissed(newDismissed);

        Animated.timing(bgShift, {
            toValue: newDismissed.length / NEGATIVE_THOUGHTS.length,
            duration: 500,
            useNativeDriver: false,
        }).start();

        if (newDismissed.length === NEGATIVE_THOUGHTS.length) {
            setTimeout(() => {
                setIsComplete(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Animated.spring(completeScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();
            }, 500);
        }
    }, [dismissed, thoughtAnims, bgShift, completeScale]);

    const createPanResponder = useCallback((index: number) => {
        return PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 10,
            onPanResponderMove: (_, gs) => {
                if (gs.dx > 0) {
                    thoughtAnims[index].x.setValue(gs.dx);
                    thoughtAnims[index].opacity.setValue(1 - gs.dx / SCREEN_WIDTH);
                }
            },
            onPanResponderRelease: (_, gs) => {
                if (gs.dx > SCREEN_WIDTH * 0.3) {
                    dismissThought(index);
                } else {
                    Animated.spring(thoughtAnims[index].x, { toValue: 0, useNativeDriver: true }).start();
                    Animated.spring(thoughtAnims[index].opacity, { toValue: 1, useNativeDriver: true }).start();
                }
            },
        });
    }, [thoughtAnims, dismissThought]);

    const handleReset = useCallback(() => {
        setDismissed([]);
        setIsComplete(false);
        bgShift.setValue(0);
        completeScale.setValue(0);
        thoughtAnims.forEach((anim) => {
            anim.x.setValue(0);
            anim.opacity.setValue(1);
            anim.scale.setValue(1);
        });
    }, [thoughtAnims, bgShift, completeScale]);

    const bgColor = bgShift.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ['#1A0A1A', '#150A18', '#0B1A14'],
    });

    const remaining = NEGATIVE_THOUGHTS.length - dismissed.length;

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor }]} />

            <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="swipe-back">
                    <ChevronLeft color={Colors.textSecondary} size={22} />
                </TouchableOpacity>
                <Text style={styles.topTitle}>Swipe Away</Text>
                <View style={{ width: 36 }} />
            </View>

            {!isComplete ? (
                <>
                    <View style={styles.header}>
                        <Wind color="#C084FC" size={28} />
                        <Text style={styles.headerTitle}>Release Your Thoughts</Text>
                        <Text style={styles.headerSub}>
                            Swipe each negative thought to the right.{'\n'}Watch it disappear. Feel it release.
                        </Text>
                        <View style={styles.counterPill}>
                            <Text style={styles.counterText}>{remaining} remaining</Text>
                        </View>
                    </View>

                    <ScrollView style={styles.thoughtList} contentContainerStyle={styles.thoughtListContent} showsVerticalScrollIndicator={false}>
                        {NEGATIVE_THOUGHTS.map((thought, index) => {
                            const isDismissed = dismissed.includes(index);
                            if (isDismissed) return null;

                            return (
                                <Animated.View
                                    key={index}
                                    style={[
                                        styles.thoughtCard,
                                        {
                                            transform: [
                                                { translateX: thoughtAnims[index].x },
                                                { scale: thoughtAnims[index].scale },
                                            ],
                                            opacity: thoughtAnims[index].opacity,
                                        },
                                    ]}
                                    {...createPanResponder(index).panHandlers}
                                >
                                    <LinearGradient
                                        colors={['rgba(40, 15, 40, 0.7)', 'rgba(30, 10, 30, 0.85)']}
                                        style={StyleSheet.absoluteFill}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    />
                                    <View style={styles.thoughtContent}>
                                        <Text style={styles.thoughtText}>{thought}</Text>
                                        <View style={styles.swipeHint}>
                                            <ChevronRight color="#C084FC50" size={16} />
                                            <ChevronRight color="#C084FC30" size={16} style={{ marginLeft: -8 }} />
                                        </View>
                                    </View>
                                </Animated.View>
                            );
                        })}
                    </ScrollView>
                </>
            ) : (
                <View style={styles.completeCenter}>
                    <Animated.View style={[styles.completeWrap, { transform: [{ scale: completeScale }] }]}>
                        <View style={styles.completeIcon}>
                            <Check color="#C084FC" size={40} />
                        </View>
                        <Text style={styles.completeTitle}>Mind Cleared</Text>
                        <Text style={styles.completeSub}>
                            All negative thoughts have been released.{'\n'}Your mind is lighter now.
                        </Text>

                        <View style={styles.completeActions}>
                            <TouchableOpacity style={styles.purpleBtn} onPress={handleReset} activeOpacity={0.7} testID="swipe-again">
                                <LinearGradient colors={['#9333EA', '#7C3AED']} style={StyleSheet.absoluteFill} />
                                <RotateCcw color="#fff" size={18} />
                                <Text style={styles.purpleBtnText}>Try Again</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.outlineBtn} onPress={() => router.back()} activeOpacity={0.7} testID="swipe-home">
                                <Text style={styles.outlineBtnText}>Back to Home</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            )}

            <View style={[styles.bottomProgress, { paddingBottom: insets.bottom + 16 }]}>
                <View style={styles.progressTrack}>
                    <Animated.View style={[styles.progressFill, {
                        width: bgShift.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                    }]}>
                        <LinearGradient colors={['#C084FC', '#9333EA']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                    </Animated.View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#1A0A1A' },
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
        backgroundColor: 'rgba(26,10,26,0.8)',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        borderWidth: 1,
        borderColor: '#C084FC20',
    },
    topTitle: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: '#A78BFA',
    },
    header: {
        alignItems: 'center' as const,
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800' as const,
        color: '#E9D5FF',
        marginTop: 12,
        marginBottom: 6,
    },
    headerSub: {
        fontSize: 14,
        color: '#A78BFAAA',
        textAlign: 'center' as const,
        lineHeight: 20,
    },
    counterPill: {
        marginTop: 12,
        backgroundColor: '#C084FC15',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 12,
    },
    counterText: {
        fontSize: 12,
        color: '#C084FC',
        fontWeight: '600' as const,
        letterSpacing: 0.5,
    },
    thoughtList: {
        flex: 1,
        paddingHorizontal: 20,
    },
    thoughtListContent: {
        gap: 10,
        paddingBottom: 20,
    },
    thoughtCard: {
        borderRadius: 16,
        overflow: 'hidden' as const,
        borderWidth: 1,
        borderColor: '#C084FC18',
    },
    thoughtContent: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
        paddingVertical: 18,
        paddingHorizontal: 20,
    },
    thoughtText: {
        fontSize: 15,
        color: '#DDD6FE',
        flex: 1,
    },
    swipeHint: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
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
        backgroundColor: '#C084FC18',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        marginBottom: 28,
        borderWidth: 1.5,
        borderColor: '#C084FC30',
    },
    completeTitle: {
        fontSize: 28,
        fontWeight: '700' as const,
        color: '#E9D5FF',
        marginBottom: 12,
    },
    completeSub: {
        fontSize: 15,
        color: '#A78BFAAA',
        textAlign: 'center' as const,
        lineHeight: 22,
    },
    completeActions: {
        marginTop: 44,
        gap: 16,
        width: '100%',
        alignItems: 'center' as const,
    },
    purpleBtn: {
        width: '100%',
        height: 52,
        borderRadius: 26,
        overflow: 'hidden' as const,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        gap: 8,
    },
    purpleBtnText: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: '#fff',
    },
    outlineBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#C084FC25',
        backgroundColor: 'rgba(26,10,26,0.5)',
    },
    outlineBtnText: {
        fontSize: 14,
        color: '#A78BFAAA',
        fontWeight: '600' as const,
    },
    bottomProgress: {
        paddingHorizontal: 24,
    },
    progressTrack: {
        width: '100%',
        height: 4,
        backgroundColor: 'rgba(26,10,26,0.6)',
        borderRadius: 2,
        overflow: 'hidden' as const,
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
        overflow: 'hidden' as const,
    },
});