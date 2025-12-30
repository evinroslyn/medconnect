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
import type { Traitement } from "../../../domain/entities";

/**
 * Écran pour gérer les traitements du patient
 */
export function TraitementsScreen() {
  const authService = useAuth();
  const allergieTraitementService = useAllergieTraitement();
  const { showNotification } = useNotifications();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [traitements, setTraitements] = useState<Traitement[]>([]);
  const [traitementModalVisible, setTraitementModalVisible] = useState(false);
  const [editingTraitement, setEditingTraitement] = useState<Traitement | null>(null);
  const [traitementForm, setTraitementForm] = useState({ 
    nom: "", 
    description: "", 
    dateDebut: "", 
    dateFin: "", 
    posologie: "", 
    medecinPrescripteur: "" 
  });

  useEffect(() => {
    loadUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadTraitements();
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

  const loadTraitements = async () => {
    if (!user?.id) return;
    
    const result = await allergieTraitementService.getTraitementsByPatient(user.id);
    if (result.ok) {
      setTraitements(result.value);
    }
  };

  const openTraitementModal = (traitement?: Traitement) => {
    if (traitement) {
      setEditingTraitement(traitement);
      setTraitementForm({
        nom: traitement.nom,
        description: traitement.description || "",
        dateDebut: new Date(traitement.dateDebut).toISOString().split('T')[0],
        dateFin: traitement.dateFin ? new Date(traitement.dateFin).toISOString().split('T')[0] : "",
        posologie: traitement.posologie || "",
        medecinPrescripteur: traitement.medecinPrescripteur || "",
      });
    } else {
      setEditingTraitement(null);
      setTraitementForm({ 
        nom: "", 
        description: "", 
        dateDebut: "", 
        dateFin: "", 
        posologie: "", 
        medecinPrescripteur: "" 
      });
    }
    setTraitementModalVisible(true);
  };

  const saveTraitement = async () => {
    if (!user?.id || !traitementForm.nom.trim() || !traitementForm.dateDebut) {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Le nom et la date de début sont requis',
      });
      return;
    }

    const result = editingTraitement
      ? await allergieTraitementService.updateTraitement(
          editingTraitement.id,
          traitementForm.nom,
          new Date(traitementForm.dateDebut),
          traitementForm.description || undefined,
          traitementForm.dateFin ? new Date(traitementForm.dateFin) : undefined,
          traitementForm.posologie || undefined,
          traitementForm.medecinPrescripteur || undefined
        )
      : await allergieTraitementService.addTraitement(
          user.id,
          traitementForm.nom,
          new Date(traitementForm.dateDebut),
          traitementForm.description || undefined,
          traitementForm.dateFin ? new Date(traitementForm.dateFin) : undefined,
          traitementForm.posologie || undefined,
          traitementForm.medecinPrescripteur || undefined
        );

    if (result.ok) {
      showNotification({
        type: 'success',
        title: 'Succès',
        message: editingTraitement ? 'Traitement modifié avec succès' : 'Traitement ajouté avec succès',
      });
      setTraitementModalVisible(false);
      loadTraitements();
    } else {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: result.error || 'Une erreur est survenue',
      });
    }
  };

  const deleteTraitement = async (traitementId: string) => {
    Alert.alert(
      "Supprimer le traitement",
      "Êtes-vous sûr de vouloir supprimer ce traitement ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const result = await allergieTraitementService.deleteTraitement(traitementId);
            if (result.ok) {
              showNotification({
                type: 'success',
                title: 'Succès',
                message: 'Traitement supprimé avec succès',
              });
              loadTraitements();
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
          <Text style={styles.headerTitle}>Traitements</Text>
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
        <Text style={styles.headerTitle}>Traitements</Text>
        <TouchableOpacity onPress={() => openTraitementModal()} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {traitements.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="medical-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>Aucun traitement enregistré</Text>
            <Text style={styles.emptyStateSubtext}>Appuyez sur + pour ajouter un traitement</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {traitements.map((traitement) => {
              const isEnCours = !traitement.dateFin || new Date(traitement.dateFin) >= new Date();
              return (
                <View key={traitement.id} style={styles.traitementCard}>
                  <View style={styles.traitementHeader}>
                    <View style={styles.iconCircleGreen}>
                      <Ionicons name="medical" size={24} color="#10B981" />
                    </View>
                    <View style={styles.traitementContent}>
                      <View style={styles.traitementTitleRow}>
                        <Text style={styles.traitementName}>{traitement.nom}</Text>
                        {isEnCours && (
                          <View style={styles.badgeEnCours}>
                            <Text style={styles.badgeText}>En cours</Text>
                          </View>
                        )}
                      </View>
                      {traitement.description && (
                        <Text style={styles.traitementDescription}>{traitement.description}</Text>
                      )}
                      {traitement.posologie && (
                        <Text style={styles.traitementPosologie}>Posologie: {traitement.posologie}</Text>
                      )}
                      <Text style={styles.traitementDate}>
                        Du {new Date(traitement.dateDebut).toLocaleDateString('fr-FR')}
                        {traitement.dateFin 
                          ? ` au ${new Date(traitement.dateFin).toLocaleDateString('fr-FR')}`
                          : " (en cours)"}
                      </Text>
                      {traitement.medecinPrescripteur && (
                        <Text style={styles.traitementPrescripteur}>
                          Prescrit par: {traitement.medecinPrescripteur}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.traitementActions}>
                    <TouchableOpacity
                      onPress={() => openTraitementModal(traitement)}
                      style={styles.actionButton}
                    >
                      <Ionicons name="create" size={20} color="#1E3A8A" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteTraitement(traitement.id)}
                      style={styles.actionButton}
                    >
                      <Ionicons name="trash" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal Traitement */}
      <Modal
        visible={traitementModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTraitementModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingTraitement ? "Modifier le traitement" : "Ajouter un traitement"}
              </Text>
              <TouchableOpacity
                onPress={() => setTraitementModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nom du traitement *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Paracétamol, Insuline"
                  value={traitementForm.nom}
                  onChangeText={(text) => setTraitementForm({ ...traitementForm, nom: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Détails sur le traitement..."
                  value={traitementForm.description}
                  onChangeText={(text) => setTraitementForm({ ...traitementForm, description: text })}
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <DatePicker
                    label="Date de début *"
                    value={traitementForm.dateDebut}
                    onChange={(date) => setTraitementForm({ ...traitementForm, dateDebut: date })}
                    placeholder="Sélectionner une date"
                    maximumDate={traitementForm.dateFin ? new Date(traitementForm.dateFin) : undefined}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <DatePicker
                    label="Date de fin"
                    value={traitementForm.dateFin}
                    onChange={(date) => setTraitementForm({ ...traitementForm, dateFin: date })}
                    placeholder="Sélectionner une date"
                    minimumDate={traitementForm.dateDebut ? new Date(traitementForm.dateDebut) : undefined}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Posologie</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 1 comprimé matin et soir"
                  value={traitementForm.posologie}
                  onChangeText={(text) => setTraitementForm({ ...traitementForm, posologie: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Médecin prescripteur</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nom du médecin"
                  value={traitementForm.medecinPrescripteur}
                  onChangeText={(text) => setTraitementForm({ ...traitementForm, medecinPrescripteur: text })}
                />
              </View>

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: "#E5E7EB" }]}
                  onPress={() => setTraitementModalVisible(false)}
                >
                  <Text style={[styles.modalButtonText, { color: "#374151" }]}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: "#1E3A8A" }]}
                  onPress={saveTraitement}
                >
                  <Text style={[styles.modalButtonText, { color: "#FFFFFF" }]}>
                    {editingTraitement ? "Modifier" : "Ajouter"}
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
  traitementCard: {
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
  traitementHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  iconCircleGreen: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  traitementContent: {
    flex: 1,
  },
  traitementTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  traitementName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  badgeEnCours: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10B981",
  },
  traitementDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  traitementPosologie: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
    fontStyle: "italic",
  },
  traitementDate: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 2,
  },
  traitementPrescripteur: {
    fontSize: 12,
    color: "#6B7280",
  },
  traitementActions: {
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

