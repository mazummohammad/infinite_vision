import { useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';

export type StressLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface StressEntry {
    id: string;
    level: StressLevel;
    timestamp: number;
    intervention: string;
    completed: boolean;
}

export interface DoctorMessage {
    id: string;
    message: string;
    timestamp: number;
    doctorName: string;
}

const STORAGE_KEY = 'infinite_calm_stress_data';

const MOCK_DOCTOR = {
    name: 'Dr. Sharma',
    speciality: 'Psychiatrist',
    avatar: '👨‍⚕️',
};

const MOCK_MESSAGES: DoctorMessage[] = [
    {
        id: '1',
        message: "You're doing better today. Keep breathing.",
        timestamp: Date.now() - 3600000,
        doctorName: 'Dr. Sharma',
    },
    {
        id: '2',
        message: 'Your stress levels have improved this week. Great progress!',
        timestamp: Date.now() - 86400000,
        doctorName: 'Dr. Sharma',
    },
    {
        id: '3',
        message: 'Try the grounding exercise when you feel overwhelmed.',
        timestamp: Date.now() - 172800000,
        doctorName: 'Dr. Sharma',
    },
];

export const [StressProvider, useStress] = createContextHook(() => {
    const queryClient = useQueryClient();
    const [entries, setEntries] = useState<StressEntry[]>([]);

    const entriesQuery = useQuery({
        queryKey: ['stress-entries'],
        queryFn: async () => {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            return stored ? (JSON.parse(stored) as StressEntry[]) : [];
        },
    });

    const saveMutation = useMutation({
        mutationFn: async (newEntries: StressEntry[]) => {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
            return newEntries;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stress-entries'] });
        },
    });

    useEffect(() => {
        if (entriesQuery.data) {
            setEntries(entriesQuery.data);
        }
    }, [entriesQuery.data]);

    const addEntry = (level: StressLevel, intervention: string, completed: boolean) => {
        const entry: StressEntry = {
            id: Date.now().toString(),
            level,
            timestamp: Date.now(),
            intervention,
            completed,
        };
        const updated = [entry, ...entries];
        setEntries(updated);
        saveMutation.mutate(updated);
        console.log('[StressContext] Added entry:', level, intervention);
    };

    const currentStressLevel = useMemo((): StressLevel => {
        if (entries.length === 0) return 'LOW';
        const recent = entries.slice(0, 3);
        const scores = recent.map(e => e.level === 'HIGH' ? 3 : e.level === 'MEDIUM' ? 2 : 1);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avg >= 2.5) return 'HIGH';
        if (avg >= 1.5) return 'MEDIUM';
        return 'LOW';
    }, [entries]);

    const weeklyData = useMemo(() => {
        const now = Date.now();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        const weekEntries = entries.filter(e => now - e.timestamp < oneWeek);

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayData = days.map((label, dayIndex) => {
            const dayEntries = weekEntries.filter(e => new Date(e.timestamp).getDay() === dayIndex);
            if (dayEntries.length === 0) return { label, level: null as StressLevel | null, count: 0 };
            const avgScore = dayEntries.reduce((s, e) => s + (e.level === 'HIGH' ? 3 : e.level === 'MEDIUM' ? 2 : 1), 0) / dayEntries.length;
            const level: StressLevel = avgScore >= 2.5 ? 'HIGH' : avgScore >= 1.5 ? 'MEDIUM' : 'LOW';
            return { label, level, count: dayEntries.length };
        });

        const totalSessions = weekEntries.length;
        const calmSessions = weekEntries.filter(e => e.level === 'LOW').length;
        const calmPercent = totalSessions > 0 ? Math.round((calmSessions / totalSessions) * 100) : 0;

        return { dayData, totalSessions, calmPercent };
    }, [entries]);

    return {
        entries,
        addEntry,
        currentStressLevel,
        weeklyData,
        doctor: MOCK_DOCTOR,
        doctorMessages: MOCK_MESSAGES,
        isLoading: entriesQuery.isLoading,
    };
});