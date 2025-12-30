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
import { useSettings, type AppSettings } from "../../hooks/useSettings";

/**
 * Écran des paramètres de l'application
 */
export function AppSettingsScreen() {
  const navigation = useNavigation();
  const settingsService = useSettings();
  const [settings, setSettings] = useState<AppSettings>({
    darkMode: false,
    language: "Français",
    autoSync: true,
    cacheData: true,
  });
  const [loading, setLoading] = useState(true);

  const languages = ["Français", "English", "Español"];

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSettings = async () => {
    try {
      const appSettings = await settingsService.getAppSettings();
      setSettings(appSettings);
    } catch (error) {
      console.error("Erreur lors du chargement des paramètres:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = async (key: keyof AppSettings) => {
    if (key === "language") {
      // Afficher un sélecteur de langue
      Alert.alert(
        "Changer la langue",
        "Sélectionnez une langue",
        languages.map((lang) => ({
          text: lang,
          onPress: async () => {
            const newSettings = { ...settings, language: lang };
            setSettings(newSettings);
            try {
              await settingsService.saveAppSettings(newSettings);
              Alert.alert("Succès", `Langue changée pour ${lang}`);
            } catch (error) {
              console.error("Erreur lors de la sauvegarde:", error);
              Alert.alert("Erreur", "Impossible de sauvegarder les paramètres");
              setSettings(settings);
            }
          },
        }))
      );
      return;
    }

    const newSettings = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(newSettings);

    try {
      await settingsService.saveAppSettings(newSettings);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      Alert.alert("Erreur", "Impossible de sauvegarder les paramètres");
      // Restaurer l'état précédent en cas d'erreur
      setSettings(settings);
    }
  };

  const appSettings = [
    {
      key: "darkMode" as const,
      icon: "moon",
      label: "Mode sombre",
      description: "Activer le thème sombre",
      type: "switch" as const,
    },
    {
      key: "language" as const,
      icon: "globe",
      label: "Langue",
      description: settings.language,
      type: "select" as const,
    },
    {
      key: "autoSync" as const,
      icon: "server",
      label: "Synchronisation automatique",
      description: "Synchroniser automatiquement vos données",
      type: "switch" as const,
    },
    {
      key: "cacheData" as const,
      icon: "server",
      label: "Mise en cache",
      description: "Mettre en cache les données pour un accès hors ligne",
      type: "switch" as const,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          {appSettings.map((option, index) => {
            return (
              <View
                key={option.key}
                style={[
                  styles.optionRow,
                  index !== appSettings.length - 1 && styles.optionRowDivider,
                ]}
              >
                <View style={styles.iconCircle}>
                  <Ionicons name={option.icon as any} size={20} color="#4B5563" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                {option.type === "switch" && (
                  <Switch
                    value={settings[option.key] as boolean}
                    onValueChange={() => toggleSetting(option.key)}
                    trackColor={{ false: "#E5E7EB", true: "#2563EB" }}
                    thumbColor="#FFFFFF"
                  />
                )}
                {option.type === "select" && (
                  <TouchableOpacity onPress={() => toggleSetting(option.key)}>
                    <Text style={styles.selectText}>{settings.language}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>À propos</Text>
          <Text style={styles.infoText}>Version 1.0.0</Text>
          <Text style={styles.infoText}>MEED-CONNECT</Text>
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
  selectText: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "500",
  },
  infoCard: {
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
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
});

