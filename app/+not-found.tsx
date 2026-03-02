import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";

export default function NotFoundScreen() {
    return (
        <>
            <Stack.Screen options={{ title: "Not Found", headerStyle: { backgroundColor: Colors.bg }, headerTintColor: Colors.text }} />
            <View style={styles.container}>
                <Text style={styles.title}>This screen doesn&apos;t exist.</Text>
                <Link href="/" style={styles.link}>
                    <Text style={styles.linkText}>Return to Infinite Calm</Text>
                </Link>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backgroundColor: Colors.bg,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: Colors.text,
    },
    link: {
        marginTop: 15,
        paddingVertical: 15,
    },
    linkText: {
        fontSize: 14,
        color: Colors.accent,
    },
});