import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../hooks/useAuth";
import { useAllergieTraitement } from "../../hooks/useAllergieTraitement";
import { useNotifications } from "../../contexts/NotificationContext";
import { DatePicker } from "../../components/common/DatePicker";
import type { Allergie } from "../../../domain/entities";

/**
 * Écran pour gérer les allergies du patient
 */
export function AllergiesScreen() {
  const authService = useAuth();
  const allergieTraitementService = useAllergieTraitement();
  const { showNotification } = useNotifications();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allergies, setAllergies] = useState<Allergie[]>([]);
  const [allergieModalVisible, setAllergieModalVisible] = useState(false);
  const [editingAllergie, setEditingAllergie] = useState<Allergie | null>(null);
  const [allergieForm, setAllergieForm] = useState({ nom: "", description: "", dateDecouverte: "" });

  useEffect(() => {
    loadUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadAllergies();
      }
    }, [user])
  );

  const loadUser = async () => {
    const result = await authService.getProfile();
    if (result.ok) {
      setUser(result.value);
    }
    setLoading(false);
  };

  const loadAllergies = async () => {
    if (!user?.id) return;
    
    const result = await allergieTraitementService.getAllergiesByPatient(user.id);
    if (result.ok) {
      setAllergies(result.value);
    }
  };

  const openAllergieModal = (allergie?: Allergie) => {
    if (allergie) {
      setEditingAllergie(allergie);
      setAllergieForm({
        nom: allergie.nom,
        description: allergie.description || "",
        dateDecouverte: allergie.dateDecouverte 
          ? new Date(allergie.dateDecouverte).toISOString().split('T')[0] 
          : "",
      });
    } else {
      setEditingAllergie(null);
      setAllergieForm({ nom: "", description: "", dateDecouverte: "" });
    }
    setAllergieModalVisible(true);
  };

  const saveAllergie = async () => {
    if (!user?.id || !allergieForm.nom.trim()) {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Le nom de l\'allergie est requis',
      });
      return;
    }

    const result = editingAllergie
      ? await allergieTraitementService.updateAllergie(
          editingAllergie.id,
          allergieForm.nom,
          allergieForm.description || undefined,
          allergieForm.dateDecouverte ? new Date(allergieForm.dateDecouverte) : undefined
        )
      : await allergieTraitementService.addAllergie(
          user.id,
          allergieForm.nom,
          allergieForm.description || undefined,
          allergieForm.dateDecouverte ? new Date(allergieForm.dateDecouverte) : undefined
        );

    if (result.ok) {
      showNotification({
        type: 'success',
        title: 'Succès',
        message: editingAllergie ? 'Allergie modifiée avec succès' : 'Allergie ajoutée avec succès',
      });
      setAllergieModalVisible(false);
      loadAllergies();
    } else {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: result.error || 'Une erreur est survenue',
      });
    }
  };

  const deleteAllergie = async (allergieId: string) => {
    Alert.alert(
      "Supprimer l'allergie",
      "Êtes-vous sûr de vouloir supprimer cette allergie ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const result = await allergieTraitementService.deleteAllergie(allergieId);
            if (result.ok) {
              showNotification({
                type: 'success',
                title: 'Succès',
                message: 'Allergie supprimée avec succès',
              });
              loadAllergies();
            } else {
              showNotification({
                type: 'error',
                title: 'Erreur',
                message: result.error || 'Une erreur est survenue',
              });
            }
          },
        },
      ]
    );
  };

  if (loading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  if (user.typeUtilisateur !== "patient") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Allergies</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Cette page est réservée aux patients</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Allergies</Text>
        <TouchableOpacity onPress={() => openAllergieModal()} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {allergies.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="warning-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>Aucune allergie enregistrée</Text>
            <Text style={styles.emptyStateSubtext}>Appuyez sur + pour ajouter une allergie</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {allergies.map((allergie) => (
              <View key={allergie.id} style={styles.allergieCard}>
                <View style={styles.allergieHeader}>
                  <View style={styles.iconCircleRed}>
                    <Ionicons name="warning" size={24} color="#EF4444" />
                  </View>
                  <View style={styles.allergieContent}>
                    <Text style={styles.allergieName}>{allergie.nom}</Text>
                    {allergie.description && (
                      <Text style={styles.allergieDescription}>{allergie.description}</Text>
                    )}
                    {allergie.dateDecouverte && (
                      <Text style={styles.allergieDate}>
                        Découverte le {new Date(allergie.dateDecouverte).toLocaleDateString('fr-FR')}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.allergieActions}>
                  <TouchableOpacity
                    onPress={() => openAllergieModal(allergie)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="create" size={20} color="#1E3A8A" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteAllergie(allergie.id)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="trash" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal Allergie */}
      <Modal
        visible={allergieModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAllergieModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAllergie ? "Modifier l'allergie" : "Ajouter une allergie"}
              </Text>
              <TouchableOpacity
                onPress={() => setAllergieModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nom de l'allergie *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Pénicilline, Arachides"
                  value={allergieForm.nom}
                  onChangeText={(text) => setAllergieForm({ ...allergieForm, nom: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Détails sur l'allergie..."
                  value={allergieForm.description}
                  onChangeText={(text) => setAllergieForm({ ...allergieForm, description: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <DatePicker
                  label="Date de découverte"
                  value={allergieForm.dateDecouverte}
                  onChange={(date) => setAllergieForm({ ...allergieForm, dateDecouverte: date })}
                  placeholder="Sélectionner une date"
                  maximumDate={new Date()}
                />
              </View>

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: "#E5E7EB" }]}
                  onPress={() => setAllergieModalVisible(false)}
                >
                  <Text style={[styles.modalButtonText, { color: "#374151" }]}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: "#1E3A8A" }]}
                  onPress={saveAllergie}
                >
                  <Text style={[styles.modalButtonText, { color: "#FFFFFF" }]}>
                    {editingAllergie ? "Modifier" : "Ajouter"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: "#1E3A8A",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight! + 16 : 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    color: "#6B7280",
    marginTop: 16,
    fontWeight: "500",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
  },
  listContainer: {
    padding: 0,
  },
  allergieCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 0,
    padding: 16,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    width: "100%",
  },
  allergieHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  iconCircleRed: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  allergieContent: {
    flex: 1,
  },
  allergieName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  allergieDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  allergieDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  allergieActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
  },
  actionButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalButtonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

