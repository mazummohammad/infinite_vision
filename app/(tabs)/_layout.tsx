import { Tabs } from 'expo-router';
import { Home, ShieldAlert, BarChart3, Stethoscope } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.accent,
                tabBarInactiveTintColor: Colors.textMuted,
                tabBarStyle: {
                    backgroundColor: Colors.tabBar,
                    borderTopColor: Colors.tabBarBorder,
                    borderTopWidth: 1,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600' as const,
                },
            }}
        >
            <Tabs.Screen
                name="(home)"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="tracking"
                options={{
                    title: 'Tracking',
                    tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="emergency"
                options={{
                    title: 'Emergency',
                    tabBarIcon: ({ color, size }) => <ShieldAlert color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="doctor"
                options={{
                    title: 'Doctor',
                    tabBarIcon: ({ color, size }) => <Stethoscope color={color} size={size} />,
                }}
            />
        </Tabs>
    );
}