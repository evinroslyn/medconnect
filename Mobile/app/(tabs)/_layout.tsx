import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet } from "react-native";
import { useUnreadMessages } from "../../src/presentation/contexts/UnreadMessagesContext";

export default function TabsLayout() {
  const { totalUnread } = useUnreadMessages();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1E3A8A",
        tabBarInactiveTintColor: "#9CA3AF",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
            <Ionicons name="chatbubbles" size={size} color={color} />
              {totalUnread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="doctors"
        options={{
          title: "Médecins",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="medical" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: "Dossiers",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="allergies"
        options={{
          href: null, // Ne pas afficher dans la tab bar
        }}
      />
      <Tabs.Screen
        name="traitements"
        options={{
          href: null, // Ne pas afficher dans la tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

