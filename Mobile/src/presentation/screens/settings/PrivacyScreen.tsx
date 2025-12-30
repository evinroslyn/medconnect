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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSettings, type PrivacyPreferences } from "../../hooks/useSettings";
import { useAuth } from "../../hooks/useAuth";

/**
 * Écran de gestion de la confidentialité
 */
export function PrivacyScreen() {
  const settings = useSettings();
  const authService = useAuth();
  const [privacySettings, setPrivacySettings] = useState<PrivacyPreferences>({
    profileVisibility: true,
    shareMedicalRecords: false,
    allowDataCollection: false,
    biometricAuth: false,
  });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await settings.getPrivacyPreferences();
      setPrivacySettings(prefs);
    } catch (error) {
      console.error("Erreur lors du chargement des préférences:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePrivacy = async (key: keyof PrivacyPreferences) => {
    const newSettings = {
      ...privacySettings,
      [key]: !privacySettings[key],
    };
    setPrivacySettings(newSettings);

    try {
      await settings.savePrivacyPreferences(newSettings);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      Alert.alert("Erreur", "Impossible de sauvegarder les préférences");
      // Restaurer l'état précédent en cas d'erreur
      setPrivacySettings(privacySettings);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Supprimer le compte",
      "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et supprimera toutes vos données.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            Alert.alert(
              "Confirmation finale",
              "Cette action est définitive. Toutes vos données seront supprimées. Continuer ?",
              [
                { text: "Annuler", style: "cancel" },
                {
                  text: "Oui, supprimer",
                  style: "destructive",
                  onPress: async () => {
                    setDeleting(true);
                    try {
                      const result = await authService.deleteAccount();
                      if (result.ok) {
                        Alert.alert("Succès", "Votre compte a été supprimé avec succès", [
                          {
                            text: "OK",
                            onPress: async () => {
                              // Nettoyer AsyncStorage et rediriger vers l'authentification
                              await AsyncStorage.removeItem("auth_token");
                              await AsyncStorage.removeItem("medconnect_user");
                              router.replace("/(auth)");
                            },
                          },
                        ]);
                      } else {
                        Alert.alert("Erreur", result.error);
                      }
                    } catch (error: any) {
                      Alert.alert("Erreur", error.message || "Impossible de supprimer le compte");
                    } finally {
                      setDeleting(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const privacyOptions = [
    {
      key: "profileVisibility" as const,
      icon: Eye,
      label: "Visibilité du profil",
      description: "Permettre aux médecins de voir votre profil",
    },
    {
      key: "shareMedicalRecords" as const,
      icon: Shield,
      label: "Partage de dossiers médicaux",
      description: "Autoriser le partage automatique avec vos médecins",
    },
    {
      key: "allowDataCollection" as const,
      icon: Lock,
      label: "Collecte de données",
      description: "Autoriser la collecte de données anonymes",
    },
    {
      key: "biometricAuth" as const,
      icon: Lock,
      label: "Authentification biométrique",
      description: "Utiliser l'empreinte digitale ou la reconnaissance faciale",
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confidentialité</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          {privacyOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <View
                key={option.key}
                style={[
                  styles.optionRow,
                  index !== privacyOptions.length - 1 && styles.optionRowDivider,
                ]}
              >
                <View style={styles.iconCircle}>
                  <Icon size={20} color="#4B5563" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                <Switch
                  value={privacySettings[option.key]}
                  onValueChange={() => togglePrivacy(option.key)}
                  trackColor={{ false: "#E5E7EB", true: "#2563EB" }}
                  thumbColor="#FFFFFF"
                />
              </View>
            );
          })}
        </View>

        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>Zone de danger</Text>
          <TouchableOpacity
            style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
            onPress={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <Ionicons name="person-remove" size={20} color="#DC2626" />
            )}
            <Text style={styles.deleteButtonText}>
              {deleting ? "Suppression..." : "Supprimer mon compte"}
            </Text>
          </TouchableOpacity>
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
  dangerSection: {
    marginTop: 8,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: "#FEE2E2",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  deleteButtonText: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "500",
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
});

