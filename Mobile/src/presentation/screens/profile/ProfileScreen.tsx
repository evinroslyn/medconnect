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
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../hooks/useAuth";
import { useRendezVous } from "../../hooks/useRendezVous";
import { useDossierMedical } from "../../hooks/useDossierMedical";
import { useMedecin } from "../../hooks/useMedecin";
import { useNotifications } from "../../contexts/NotificationContext";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import type { Utilisateur, Patient } from "../../../domain/entities";
import { getBaseUrl } from "../../../infrastructure/http/httpClient";
import { storageService } from "../../../infrastructure/storage/StorageService";
import { STORAGE_KEYS } from "../../../infrastructure/config";

/**
 * Composant de présentation pour l'écran de profil
 * Utilise les hooks pour respecter l'architecture propre
 */
export function ProfileScreen() {
  const authService = useAuth();
  const rendezVousService = useRendezVous();
  const dossierService = useDossierMedical();
  const medecinService = useMedecin();
  const { showNotification } = useNotifications();
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    rdv: 0,
    documents: 0,
    medecins: 0,
  });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<Utilisateur & Patient>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageCacheKey, setImageCacheKey] = useState(Date.now());

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recharger le profil quand l'écran reprend le focus
  useFocusEffect(
    useCallback(() => {
      loadUser();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  useEffect(() => {
    if (user?.id) {
      loadStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadUser = async () => {
    setLoading(true);
    try {
      const result = await authService.getProfile();
      if (result.ok) {
        const updatedUser = result.value;
        setUser(updatedUser);
        // Forcer le rechargement de l'image en mettant à jour la clé de cache
        if ((updatedUser as any).photoProfil) {
          setImageCacheKey(Date.now());
        }
        console.log("[ProfileScreen] Profil chargé, photoProfil:", (updatedUser as any).photoProfil);
      } else {
        console.error("[ProfileScreen] loadUser error:", result.error);
        Alert.alert("Erreur", result.error || "Impossible de charger le profil");
      }
    } catch (error: any) {
      console.error("[ProfileScreen] loadUser exception:", error);
      Alert.alert("Erreur", error.message || "Une erreur est survenue lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user?.id) return;

    try {
      // Charger les rendez-vous
      if (user.typeUtilisateur === "patient") {
        const rdvResult = await rendezVousService.getByPatient(user.id);
        if (rdvResult.ok) {
          setStats((prev) => ({ ...prev, rdv: rdvResult.value.length }));
        }

        // Charger les dossiers médicaux
        const dossiersResult = await dossierService.getDossiersByPatient(user.id);
        if (dossiersResult.ok) {
          setStats((prev) => ({ ...prev, documents: dossiersResult.value.length }));
        }

        // Charger les médecins connectés (via les connexions)
        const connexionsResult = await medecinService.getConnexions(user.id);
        if (connexionsResult.ok) {
          // Compter uniquement les connexions acceptées
          const connectedMedecins = connexionsResult.value.filter(
            (c) => c.statut === "Accepté"
          );
          setStats((prev) => ({ ...prev, medecins: connectedMedecins.length }));
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    }
  };


  const openEditModal = () => {
    if (user) {
      const patient = user as Patient;
      setEditingUser({
        nom: patient.nom || "",
        mail: user.mail || "",
        telephone: user.telephone || "",
        adresse: user.adresse || "",
      });
      setSelectedImage(null);
      setEditModalVisible(true);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "Nous avons besoin de l'accès à votre galerie pour sélectionner une photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setUploading(true);
    try {
      let photoProfilPath: string | undefined;

      // Upload de la photo si une nouvelle photo a été sélectionnée
      if (selectedImage) {
        const fileName = `photo-profil-${user.id}-${Date.now()}.jpg`;
        const uploadResult = await authService.uploadPhotoProfil(selectedImage, fileName);
        
        if (!uploadResult.ok) {
          Alert.alert("Erreur", uploadResult.error || "Erreur lors de l'upload de la photo");
          setUploading(false);
          return;
        }

        photoProfilPath = uploadResult.value.path;
        console.log("[ProfileScreen] Photo uploadée, path:", photoProfilPath);
      }

      // Préparer les mises à jour
      const updates: any = {};
      const currentNom = (user as Patient)?.nom || "";
      if (editingUser.nom !== undefined && editingUser.nom !== currentNom) {
        updates.nom = editingUser.nom;
      }
      if (editingUser.mail !== undefined && editingUser.mail !== user.mail) {
        updates.mail = editingUser.mail;
      }
      if (editingUser.telephone !== undefined && editingUser.telephone !== user.telephone) {
        updates.telephone = editingUser.telephone;
      }
      if (editingUser.adresse !== undefined && editingUser.adresse !== user.adresse) {
        updates.adresse = editingUser.adresse;
      }
      if (photoProfilPath) {
        updates.photoProfil = photoProfilPath;
      }

      // Mettre à jour le profil seulement si des changements ont été faits
      if (Object.keys(updates).length > 0) {
        const updateResult = await authService.updateProfile(updates);
        
        if (updateResult.ok) {
          // Nettoyer le cache de l'image si la photo a changé
          if (photoProfilPath) {
            setSelectedImage(null);
            // Forcer le rechargement de l'image en changeant la clé de cache immédiatement
            setImageCacheKey(Date.now());
          }
          
          // Recharger le profil depuis le serveur pour avoir la dernière version à jour
          await loadUser();
          
          // Mettre à jour le storage avec les données fraîches
          const freshUserResult = await authService.getProfile();
          if (freshUserResult.ok) {
            const updatedUserData = freshUserResult.value;
            console.log("[ProfileScreen] Profil mis à jour, photoProfil:", (updatedUserData as any).photoProfil);
            await storageService.setItem(STORAGE_KEYS.USER, updatedUserData);
            
            // Si la photo a changé, forcer à nouveau le rechargement avec une nouvelle clé
            if (photoProfilPath) {
              // Attendre un peu pour que le serveur soit prêt et que le fichier soit accessible
              await new Promise(resolve => setTimeout(resolve, 500));
              // Forcer le rechargement avec une nouvelle clé unique (plusieurs fois pour être sûr)
              const newCacheKey = Date.now() + Math.random();
              setImageCacheKey(newCacheKey);
              console.log("[ProfileScreen] Nouvelle clé de cache:", newCacheKey);
              
              // Forcer un deuxième rechargement après un court délai
              setTimeout(() => {
                setImageCacheKey(Date.now() + Math.random());
              }, 1000);
            }
          }
          
          // Fermer le modal et afficher la notification
          setEditModalVisible(false);
          showNotification({
            type: "success",
            title: "Profil mis à jour",
            message: "Vos modifications ont été enregistrées avec succès",
          });
        } else {
          showNotification({
            type: "error",
            title: "Erreur",
            message: updateResult.error || "Erreur lors de la mise à jour du profil",
          });
        }
      } else {
        setEditModalVisible(false);
        showNotification({
          type: "info",
          title: "Information",
          message: "Aucune modification détectée",
        });
      }
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde du profil:", error);
      Alert.alert("Erreur", error.message || "Une erreur est survenue lors de la sauvegarde");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Déconnexion",
          style: "destructive",
          onPress: async () => {
            const result = await authService.logout();
            if (result.ok) {
              // Nettoyer le storage et rediriger vers l'authentification
              await storageService.removeItem(STORAGE_KEYS.AUTH_TOKEN);
              await storageService.removeItem(STORAGE_KEYS.USER);
              router.replace("/(auth)");
            } else {
              Alert.alert("Erreur", result.error);
            }
          },
        },
      ]
    );
  };

  if (loading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const settingsOptions = [
    ...(user?.typeUtilisateur === "patient"
      ? [
          {
            icon: "warning",
            label: "Allergies",
            action: () => {
              router.push("/(tabs)/allergies");
            },
          },
          {
            icon: "medical",
            label: "Traitements",
            action: () => {
              router.push("/(tabs)/traitements");
            },
          },
        ]
      : []),
    {
      icon: "notifications",
      label: "Notifications",
      action: () => {
        // TODO: Créer la route pour NotificationsScreen dans Expo Router
        Alert.alert("Info", "Fonctionnalité à venir");
      },
    },
    {
      icon: "lock-closed",
      label: "Confidentialité",
      action: () => {
        // TODO: Créer la route pour PrivacyScreen dans Expo Router
        Alert.alert("Info", "Fonctionnalité à venir");
      },
    },
    {
      icon: "settings",
      label: "Paramètres",
      action: () => {
        // TODO: Créer la route pour SettingsScreen dans Expo Router
        Alert.alert("Info", "Fonctionnalité à venir");
      },
    },
    {
      icon: "help-circle",
      label: "Aide & Support",
      action: () => {
        // TODO: Créer la route pour HelpSupportScreen dans Expo Router
        Alert.alert("Info", "Fonctionnalité à venir");
      },
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {user && (user as any).photoProfil ? (
            <Image
              key={imageCacheKey}
              source={{ 
                uri: `${getBaseUrl()}${(user as any).photoProfil}?t=${imageCacheKey}`,
              }}
              style={styles.avatarImage}
              cachePolicy="none"
              contentFit="cover"
              transition={200}
              onError={(error) => {
                console.error("[ProfileScreen] Erreur de chargement de l'image:", error);
              }}
            />
          ) : (
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#1E3A8A" />
          </View>
          )}

          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>
              {(user as Patient)?.nom || "Utilisateur"}
            </Text>
            <Text style={styles.email}>{user.mail || user.telephone || ""}</Text>
            {user.typeUtilisateur === "medecin" && (
              <View style={styles.specializationTag}>
                <Text style={styles.specializationText}>Médecin</Text>
              </View>
            )}
            {user.typeUtilisateur === "patient" && (
              <View style={styles.specializationTag}>
                <Text style={styles.specializationText}>Patient</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.editBtn} onPress={openEditModal}>
            <Ionicons name="create" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsWrapper}>
        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{stats.rdv}</Text>
            <Text style={styles.statLabel}>RDV</Text>
          </View>

          <View style={styles.statCenter}>
            <Text style={styles.statNumber}>{stats.documents}</Text>
            <Text style={styles.statLabel}>Documents</Text>
          </View>

          <View style={styles.stat}>
            <Text style={styles.statNumber}>{stats.medecins}</Text>
            <Text style={styles.statLabel}>Médecins</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations</Text>

        <View style={styles.card}>
          <View style={[styles.infoRow, user.adresse || user.telephone ? styles.memberDivider : null]}>
            <View style={styles.iconCircleBlue}>
              <Ionicons name="mail" size={20} color="#1E3A8A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.mail}</Text>
            </View>
          </View>

          {user.telephone && (
            <View style={[styles.infoRow, user.adresse ? styles.memberDivider : null]}>
              <View style={styles.iconCircleBlue}>
                <Ionicons name="call" size={20} color="#1E3A8A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Téléphone</Text>
                <Text style={styles.infoValue}>{user.telephone}</Text>
              </View>
            </View>
          )}

          {user.adresse && (
            <View style={styles.infoRow}>
              <View style={styles.iconCircleBlue}>
                <Ionicons name="location" size={20} color="#1E3A8A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Adresse</Text>
                <Text style={styles.infoValue}>{user.adresse}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paramètres</Text>

        <View style={styles.card}>
          {settingsOptions.map((option, index) => {
            return (
              <TouchableOpacity
                key={index}
                onPress={option.action}
                style={[
                  styles.settingsRow,
                  index !== settingsOptions.length - 1 && styles.memberDivider,
                ]}
              >
                <View style={styles.iconCircleGray}>
                  <Ionicons name={option.icon as any} size={20} color="#1E3A8A" />
                </View>

                <Text style={styles.settingsText}>{option.label}</Text>

                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Ionicons name="log-out" size={20} color="#DC2626" />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>

      {/* Modal d'édition du profil */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier le profil</Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Photo de profil */}
              <View style={styles.photoSection}>
                <TouchableOpacity onPress={pickImage} style={styles.photoContainer}>
                  {selectedImage ? (
                    <Image 
                      source={{ uri: selectedImage }} 
                      style={styles.photoPreview}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : user && (user as any).photoProfil ? (
                    <Image
                      key={`modal-${imageCacheKey}`}
                      source={{ 
                        uri: `${getBaseUrl()}${(user as any).photoProfil}?t=${imageCacheKey}`,
                      }}
                      style={styles.photoPreview}
                      cachePolicy="none"
                      contentFit="cover"
                      transition={200}
                      onError={(error) => {
                        console.error("[ProfileScreen] Erreur de chargement de l'image dans le modal:", error);
                      }}
                    />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="camera" size={40} color="#9CA3AF" />
                    </View>
                  )}
                  <View style={styles.photoEditBadge}>
                    <Ionicons name="camera" size={16} color="#fff" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.photoLabel}>Appuyez pour changer la photo</Text>
              </View>

              {/* Nom */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nom</Text>
                <TextInput
                  style={styles.input}
                  value={editingUser.nom}
                  onChangeText={(text) => setEditingUser({ ...editingUser, nom: text })}
                  placeholder="Votre nom"
                />
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={editingUser.mail}
                  onChangeText={(text) => setEditingUser({ ...editingUser, mail: text })}
                  placeholder="Votre email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Téléphone */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Téléphone</Text>
                <TextInput
                  style={styles.input}
                  value={editingUser.telephone}
                  onChangeText={(text) => setEditingUser({ ...editingUser, telephone: text })}
                  placeholder="Votre téléphone"
                  keyboardType="phone-pad"
                />
              </View>

              {/* Adresse */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Adresse</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editingUser.adresse}
                  onChangeText={(text) => setEditingUser({ ...editingUser, adresse: text })}
                  placeholder="Votre adresse"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={[styles.modalButton, styles.cancelButton]}
                disabled={uploading}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveProfile}
                style={[styles.modalButton, styles.saveButton]}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: "#1E3A8A",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight! + 24 : 50,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 999,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 999,
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  userName: { fontSize: 24, color: "white", fontWeight: "bold" },
  email: { color: "#BFDBFE" },
  specializationTag: {
    marginTop: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  specializationText: { color: "white", fontSize: 12 },
  statsWrapper: { paddingHorizontal: 16, marginTop: -30, marginBottom: 20 },
  statsCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    elevation: 2,
  },
  stat: { flex: 1, alignItems: "center" },
  statCenter: {
    flex: 1,
    alignItems: "center",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#E5E7EB",
  },
  statNumber: { fontSize: 22, fontWeight: "bold", color: "#111827" },
  statLabel: { fontSize: 12, color: "#6B7280" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#111827", marginBottom: 10, paddingHorizontal: 16 },
  card: {
    backgroundColor: "white",
    borderRadius: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 1,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    width: "100%",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  iconCircleBlue: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
  },
  infoLabel: { fontSize: 12, color: "#6B7280" },
  infoValue: { fontSize: 16, color: "#111827" },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  memberDivider: { borderBottomWidth: 1, borderColor: "#F3F4F6" },
  iconCircleGray: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  settingsText: { flex: 1, fontSize: 16, color: "#111827" },
  logoutButton: {
    width: "90%",
    alignSelf: "center",
    backgroundColor: "#FEE2E2",
    padding: 14,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 30,
    marginTop: -10,
  },
  logoutText: { color: "#DC2626", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
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
    padding: 20,
  },
  photoSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  photoContainer: {
    position: "relative",
    marginBottom: 8,
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F3F4F6",
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  photoEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  photoLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 20,
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
    backgroundColor: "#fff",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#1E3A8A",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 12,
    fontWeight: "500",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 4,
  },
  healthItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  healthItemContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  healthItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  healthItemDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  healthItemPosologie: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
    fontStyle: "italic",
  },
  healthItemDate: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 2,
  },
  healthItemPrescripteur: {
    fontSize: 12,
    color: "#6B7280",
  },
  healthItemActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  iconCircleRed: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconCircleGreen: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
});

