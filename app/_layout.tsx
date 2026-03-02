import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StressProvider } from '@/contexts/StressContext';

const queryClient = new QueryClient();

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
                <StressProvider>
                    <StatusBar style="light" />
                    <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="detect" options={{ presentation: 'modal' }} />
                        <Stack.Screen name="swipe" options={{ presentation: 'modal' }} />
                        <Stack.Screen name="shake" options={{ presentation: 'modal' }} />
                        <Stack.Screen name="grounding" options={{ presentation: 'modal' }} />
                    </Stack>
                </StressProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}