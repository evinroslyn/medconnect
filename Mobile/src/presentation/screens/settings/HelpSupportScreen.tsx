import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

/**
 * Écran d'aide et de support
 */
export function HelpSupportScreen() {
  const navigation = useNavigation();

  const handleContact = (type: "email" | "phone") => {
    if (type === "email") {
      Linking.openURL("mailto:support@meed-connect.com?subject=Demande d'aide");
    } else {
      Linking.openURL("tel:+237123456789");
    }
  };

  const helpSections = [
    {
      icon: "document-text",
      label: "FAQ",
      description: "Questions fréquemment posées",
      action: () => {
        Alert.alert("FAQ", "Section FAQ à implémenter");
      },
    },
    {
      icon: "chatbubble",
      label: "Chat en direct",
      description: "Discuter avec notre équipe",
      action: () => {
        Alert.alert("Chat", "Service de chat à implémenter");
      },
    },
    {
      icon: "mail",
      label: "Email",
      description: "support@meed-connect.com",
      action: () => handleContact("email"),
    },
    {
      icon: "call",
      label: "Téléphone",
      description: "+237 123 456 789",
      action: () => handleContact("phone"),
    },
  ];

  const quickLinks = [
    {
      label: "Guide d'utilisation",
      action: () => {
        Alert.alert("Guide", "Guide d'utilisation à implémenter");
      },
    },
    {
      label: "Politique de confidentialité",
      action: () => {
        Alert.alert("Politique", "Politique de confidentialité à implémenter");
      },
    },
    {
      label: "Conditions d'utilisation",
      action: () => {
        Alert.alert("Conditions", "Conditions d'utilisation à implémenter");
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
        <Text style={styles.headerTitle}>Aide & Support</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          {helpSections.map((section, index) => {
            return (
              <TouchableOpacity
                key={index}
                onPress={section.action}
                style={[
                  styles.optionRow,
                  index !== helpSections.length - 1 && styles.optionRowDivider,
                ]}
              >
                <View style={styles.iconCircle}>
                  <Ionicons name={section.icon as any} size={20} color="#4B5563" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionLabel}>{section.label}</Text>
                  <Text style={styles.optionDescription}>{section.description}</Text>
                </View>
                <Ionicons name="open-outline" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Liens utiles</Text>
          <View style={styles.card}>
            {quickLinks.map((link, index) => (
              <TouchableOpacity
                key={index}
                onPress={link.action}
                style={[
                  styles.linkRow,
                  index !== quickLinks.length - 1 && styles.linkRowDivider,
                ]}
              >
                <Text style={styles.linkText}>{link.label}</Text>
                <Ionicons name="open-outline" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
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
    marginBottom: 24,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  optionRowDivider: {
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
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  linkRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  linkText: {
    fontSize: 16,
    color: "#111827",
  },
});

