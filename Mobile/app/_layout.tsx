import { Stack } from "expo-router";
import { useEffect } from "react";
import { LogBox, View, StyleSheet } from "react-native";
import { UnreadMessagesProvider } from "../src/presentation/contexts/UnreadMessagesContext";
import { NotificationProvider } from "../src/presentation/contexts/NotificationContext";

export default function RootLayout() {
  useEffect(() => {
    // Ignorer les avertissements spécifiques qui peuvent bloquer
    LogBox.ignoreLogs([
      "Non-serializable values were found in the navigation state",
    ]);
  }, []);

  return (
    <UnreadMessagesProvider>
      <NotificationProvider>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
      </NotificationProvider>
    </UnreadMessagesProvider>
  );
}

