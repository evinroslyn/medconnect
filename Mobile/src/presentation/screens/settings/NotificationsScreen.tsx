import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSettings, type NotificationPreferences } from "../../hooks/useSettings";

/**
 * Écran de gestion des notifications
 */
export function NotificationsScreen() {
  const navigation = useNavigation();
  const settings = useSettings();
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    medicalRecordsUpdates: true,
    messages: true,
  });

  useEffect(() => {
    loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await settings.getNotificationPreferences();
      setNotifications(prefs);
    } catch (error) {
      console.error("Erreur lors du chargement des préférences:", error);
    }
  };

  const toggleNotification = async (key: keyof NotificationPreferences) => {
    const newNotifications = {
      ...notifications,
      [key]: !notifications[key],
    };
    setNotifications(newNotifications);

    try {
      await settings.saveNotificationPreferences(newNotifications);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      Alert.alert("Erreur", "Impossible de sauvegarder les préférences");
      // Restaurer l'état précédent en cas d'erreur
      setNotifications(notifications);
    }
  };

  const notificationOptions = [
    {
      key: "pushNotifications" as const,
      label: "Notifications push",
      description: "Recevoir des notifications sur votre appareil",
    },
    {
      key: "emailNotifications" as const,
      label: "Notifications par email",
      description: "Recevoir des notifications par email",
    },
    {
      key: "smsNotifications" as const,
      label: "Notifications par SMS",
      description: "Recevoir des notifications par SMS",
    },
    {
      key: "appointmentReminders" as const,
      label: "Rappels de rendez-vous",
      description: "Être notifié avant vos rendez-vous",
    },
    {
      key: "medicalRecordsUpdates" as const,
      label: "Mises à jour des dossiers médicaux",
      description: "Notifications lors de modifications de vos dossiers",
    },
    {
      key: "messages" as const,
      label: "Messages",
      description: "Notifications pour les nouveaux messages",
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          {notificationOptions.map((option, index) => (
            <React.Fragment key={option.key}>
              <View
                style={[
                  styles.optionRow,
                  index !== notificationOptions.length - 1 && styles.optionRowDivider,
                ]}
              >
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <Switch
                value={notifications[option.key]}
                onValueChange={() => toggleNotification(option.key)}
                trackColor={{ false: "#E5E7EB", true: "#2563EB" }}
                thumbColor="#FFFFFF"
              />
            </View>
            </React.Fragment>
          ))}
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
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  optionRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  optionContent: {
    flex: 1,
    marginRight: 16,
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
});

