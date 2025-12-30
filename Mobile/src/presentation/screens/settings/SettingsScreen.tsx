import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

/**
 * Écran de paramètres
 * Affiche les options de paramètres : Notifications, Confidentialité, Paramètres, Aide & Support
 */
export function SettingsScreen() {
  const navigation = useNavigation();

  const settingsOptions = [
    {
      icon: "notifications",
      label: "Notifications",
      action: () => {
        navigation.navigate("NotificationsScreen" as never);
      },
    },
    {
      icon: "lock-closed",
      label: "Confidentialité",
      action: () => {
        navigation.navigate("PrivacyScreen" as never);
      },
    },
    {
      icon: "settings",
      label: "Paramètres",
      action: () => {
        navigation.navigate("AppSettingsScreen" as never);
      },
    },
    {
      icon: "help-circle",
      label: "Aide & Support",
      action: () => {
        navigation.navigate("HelpSupportScreen" as never);
      },
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          {settingsOptions.map((option, index) => {
            return (
              <TouchableOpacity
                key={index}
                onPress={option.action}
                style={[
                  styles.settingsRow,
                  index !== settingsOptions.length - 1 && styles.settingsRowDivider,
                ]}
              >
                <View style={styles.iconCircle}>
                  <Ionicons name={option.icon as any} size={20} color="#4B5563" />
                </View>

                <Text style={styles.settingsText}>{option.label}</Text>

                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight! + 16 : 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 0,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  settingsRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  settingsText: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
});

