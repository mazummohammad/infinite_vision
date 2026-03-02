import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
    return (
        <>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="detect" options={{ presentation: 'modal' }} />
                <Stack.Screen name="swipe" options={{ presentation: 'modal' }} />
                <Stack.Screen name="shake" options={{ presentation: 'modal' }} />
                <Stack.Screen name="grounding" options={{ presentation: 'modal' }} />
            </Stack>
        </>
    );
}