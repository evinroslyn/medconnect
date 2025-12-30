import React, { useState, useEffect } from "react";
import { Image } from "react-native";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMedecin } from "../../hooks/useMedecin";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../contexts/NotificationContext";
import { router } from "expo-router";
import type { Medecin } from "../../../domain/entities/Medecin";
import type { Connexion } from "../../../domain/entities/Connexion";

/**
 * Composant de présentation pour l'écran des médecins avec design moderne en grille
 */
export function DoctorsScreen() {
  const medecinService = useMedecin();
  const authService = useAuth();
  const { showNotification } = useNotifications();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Medecin[]>([]);
  const [connexions, setConnexions] = useState<Connexion[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [doctorToConnect, setDoctorToConnect] = useState<Medecin | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadDoctors();
      loadConnexions();
    }
  }, [selectedSpecialization, user]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (user) {
        loadDoctors();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const loadUser = async () => {
    const result = await authService.getProfile();
    if (result.ok) {
      setUser(result.value);
    }
  };

  const loadConnexions = async () => {
    if (!user?.id) return;
    const result = await medecinService.getConnexions(user.id);
    if (result.ok) {
      setConnexions(result.value);
    }
  };

  const loadDoctors = async () => {
    setLoading(true);
    const params: { nom?: string; specialite?: string; emplacement?: string } = {};
    
    if (searchQuery.trim()) {
      const specialiteMap: Record<string, string> = {
        "cardiologue": "Cardiologue",
        "généraliste": "Généraliste",
        "pédiatre": "Pédiatre",
        "dermatologue": "Dermatologue",
        "dentiste": "Dentiste",
      };
      
      const lowerQuery = searchQuery.toLowerCase();
      const matchedSpecialite = Object.keys(specialiteMap).find(key => 
        lowerQuery.includes(key) || lowerQuery.includes(specialiteMap[key].toLowerCase())
      );
      
      if (matchedSpecialite) {
        params.specialite = specialiteMap[matchedSpecialite];
      } else {
        params.nom = searchQuery;
      }
    }
    
    if (selectedSpecialization && selectedSpecialization !== "all") {
      const specialiteMap: Record<string, string> = {
        "cardio": "Cardiologue",
        "general": "Généraliste",
        "pediatre": "Pédiatre",
        "dermato": "Dermatologue",
        "dentist": "Dentiste",
      };
      params.specialite = specialiteMap[selectedSpecialization] || selectedSpecialization;
    }
    
    const result = await medecinService.searchMedecins(Object.keys(params).length > 0 ? params : undefined);
    if (result.ok) {
      setDoctors(result.value);
    } else {
      Alert.alert("Erreur", "Impossible de charger les médecins");
    }
    setLoading(false);
  };

  const getConnexionStatus = (medecinId: string): "connected" | "pending" | "none" => {
    const connexion = connexions.find(c => c.idMedecin === medecinId);
    if (!connexion) return "none";
    if (connexion.statut === "Accepté") return "connected";
    if (connexion.statut === "En_attente") return "pending";
    return "none";
  };

  const handleSendConnexionRequest = async (medecinId: string) => {
    setSendingRequest(medecinId);
    const result = await medecinService.sendConnexionRequest(medecinId);
    setSendingRequest(null);
    
    if (result.ok) {
      showNotification({
        type: 'success',
        title: 'Demande envoyée',
        message: 'Votre demande de connexion a été envoyée avec succès',
        autoClose: true,
        autoCloseDelay: 4000,
      });
      await loadConnexions();
      await loadDoctors();
      setConfirmModalVisible(false);
      setDoctorToConnect(null);
    } else {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: result.error || "Impossible d'envoyer la demande",
      });
    }
  };

  const handleCancelConnexionRequest = async (connexionId: string, medecinNom: string) => {
    Alert.alert(
      "Annuler la demande",
      `Voulez-vous vraiment annuler votre demande de connexion à ${medecinNom} ?`,
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: async () => {
            const result = await medecinService.rejectConnexionRequest(connexionId);
            if (result.ok) {
              showNotification({
                type: 'success',
                title: 'Demande annulée',
                message: 'Votre demande de connexion a été annulée',
                autoClose: true,
                autoCloseDelay: 4000,
              });
              await loadConnexions();
              await loadDoctors();
            } else {
              showNotification({
                type: 'error',
                title: 'Erreur',
                message: result.error || "Impossible d'annuler la demande",
              });
            }
          },
        },
      ]
    );
  };

  const handleAppointment = (medecinId: string) => {
    const status = getConnexionStatus(medecinId);
    if (status !== "connected") {
        setDoctorToConnect(doctors.find(d => d.id === medecinId) ?? null);
        setConfirmModalVisible(true);
      return;
    }
    // TODO: Naviguer vers l'écran de prise de rendez-vous
    Alert.alert("Info", "Fonctionnalité de prise de rendez-vous à venir");
  };

  // Séparer les médecins par statut de connexion
  const connectedDoctors = doctors.filter(d => getConnexionStatus(d.id) === "connected");
  const pendingDoctors = doctors.filter(d => getConnexionStatus(d.id) === "pending");
  const availableDoctors = doctors.filter(d => getConnexionStatus(d.id) === "none");

  const specializations = [
    { id: "all", name: "Tous", icon: "grid", color: "#1E3A8A" },
    { id: "cardio", name: "Cardiologue", icon: "heart", color: "#EF4444" },
    { id: "general", name: "Généraliste", icon: "fitness", color: "#3B82F6" },
    { id: "pediatre", name: "Pédiatre", icon: "people", color: "#10B981" },
    { id: "dermato", name: "Dermatologue", icon: "flask", color: "#F59E0B" },
    { id: "dentist", name: "Dentiste", icon: "happy", color: "#1E3A8A" },
  ];

  const toggleFavorite = (medecinId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(medecinId)) {
        newFavorites.delete(medecinId);
      } else {
        newFavorites.add(medecinId);
      }
      return newFavorites;
    });
  };

  const renderDoctorCard = (item: Medecin, showConnectionButton: boolean = false) => {
    const isFavorite = favorites.has(item.id);
    const connexionStatus = getConnexionStatus(item.id);
    const connexion = connexions.find(c => c.idMedecin === item.id);

    // Données par défaut pour la localisation et la note
    const location = item.adresse || "Centre médical";
    const rating = 5; // Note par défaut
    const reviewCount = Math.floor(Math.random() * 200) + 50; // Nombre d'avis par défaut

    return (
      <TouchableOpacity 
        key={item.id} 
        style={styles.doctorCard}
        activeOpacity={0.7}
        onPress={() => {
          // Pour les propositions de médecins (pas encore connectés),
          // cliquer sur la carte doit proposer d'envoyer une demande de connexion
          if (connexionStatus === "none") {
            setDoctorToConnect(item);
            setConfirmModalVisible(true);
          } else if (connexionStatus === "pending") {
            // Ne rien faire au clic, le bouton d'annulation gère cela
          } else if (connexionStatus === "connected") {
            // Plus tard : naviguer vers profil ou prise de rendez-vous
          }
        }}
      >
        {/* Indicateur en haut à droite (icône différente selon l'état) */}
        <View style={styles.topRightIndicator}>
          {connexionStatus === "connected" && (
            <TouchableOpacity
              onPress={() => toggleFavorite(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={20} 
                color={isFavorite ? "#EF4444" : "#9CA3AF"} 
              />
            </TouchableOpacity>
          )}

          {connexionStatus === "pending" && (
            <Ionicons name="time-outline" size={20} color="#F59E0B" />
          )}

          {connexionStatus === "none" && (
            <Ionicons name="person-add-outline" size={20} color="#6B7280" />
          )}
        </View>

        <View style={styles.doctorCardContent}>
          {/* Avatar circulaire à gauche avec fond bleu clair */}
          <View style={styles.doctorAvatarContainer}>
            <View style={styles.doctorAvatar}>
              <Text style={styles.doctorAvatarText}>
                {item.nom.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          
          {/* Informations à droite */}
          <View style={styles.doctorInfo}>
            {/* Nom du médecin */}
            <Text style={styles.doctorName} numberOfLines={1}>
              {item.nom.startsWith("Dr.") ? item.nom : `Dr. ${item.nom}`}
            </Text>
            
            {/* Spécialité, Localisation et Années d'expérience */}
            <View style={styles.doctorSpecialtyRow}>
              <Text style={styles.doctorSpecialty} numberOfLines={1}>
                {item.specialite || "Médecin généraliste"}
              </Text>
              <Text style={styles.separator}> | </Text>
              <Text style={styles.doctorLocation} numberOfLines={1}>
                {location}
              </Text>
              {item.anneesExperience && (
                <>
                  <Text style={styles.separator}> | </Text>
                  <Text style={styles.doctorExperience} numberOfLines={1}>
                    {item.anneesExperience} ans d&apos;exp.
                  </Text>
                </>
              )}
            </View>
            {/* Note et avis 
            <View style={styles.doctorRatingRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.doctorRating}>{rating}</Text>
              <Text style={styles.doctorReviews}>({reviewCount} avis)</Text>
            </View>*/}
          </View>
        </View>

        {/* Bouton d'annulation pour les demandes en attente */}
        {connexionStatus === "pending" && connexion && (
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelConnexionRequest(connexion.id, item.nom)}
            >
              <Ionicons name="close-circle" size={18} color="#EF4444" style={styles.cancelButtonIcon} />
              <Text style={styles.cancelButtonText}>Annuler la demande</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header avec recherche */}
      <View style={styles.header}>
      <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
            placeholder="Rechercher un médecin"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              placeholderTextColor="#9CA3AF"
            />
          </View>

        {/* Filtres de spécialités */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
          style={styles.filtersScrollView}
        >
          {specializations.map((spec) => {
            const isActive = selectedSpecialization === spec.id || (!selectedSpecialization && spec.id === "all");
            
            return (
              <TouchableOpacity
                key={spec.id}
                onPress={() =>
                  setSelectedSpecialization(
                    spec.id === selectedSpecialization ? null : spec.id === "all" ? null : spec.id
                  )
                }
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                ]}
              >
                <Text style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}>
                  {spec.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Liste des médecins par sections */}
      <ScrollView 
        style={styles.doctorsList}
        contentContainerStyle={styles.doctorsListContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section : Médecins connectés */}
        {connectedDoctors.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Médecins connectés</Text>
            {connectedDoctors.map((doctor) => renderDoctorCard(doctor, false))}
          </View>
        )}

        {/* Section : Demandes en attente */}
        {pendingDoctors.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Demandes en attente</Text>
            {pendingDoctors.map((doctor) => renderDoctorCard(doctor, false))}
          </View>
        )}

        {/* Section : Propositions de médecins */}
        {availableDoctors.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Propositions de médecins</Text>
            {availableDoctors.map((doctor) => renderDoctorCard(doctor, true))}
          </View>
        )}

        {/* État vide */}
        {connectedDoctors.length === 0 && pendingDoctors.length === 0 && availableDoctors.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="medical-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>Aucun médecin disponible</Text>
            <Text style={styles.emptySubtext}>
              Les médecins apparaîtront ici une fois disponibles
            </Text>
          </View>
        )}
      </ScrollView>
      {/* Confirmation Modal */}
      <Modal
        visible={confirmModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Demande de connexion</Text>
              <TouchableOpacity onPress={() => setConfirmModalVisible(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBodyInner}>
              <Text style={styles.modalMessage}>
                Voulez-vous envoyer une demande de connexion à {doctorToConnect?.nom ? (doctorToConnect.nom.startsWith('Dr.') ? doctorToConnect.nom : `Dr. ${doctorToConnect.nom}`) : 'ce médecin'} ?
              </Text>
            </View>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#E5E7EB' }]} onPress={() => setConfirmModalVisible(false)} disabled={!!sendingRequest}>
                <Text style={[styles.modalButtonText, { color: '#374151' }]}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#1E3A8A' }]} onPress={() => doctorToConnect && handleSendConnexionRequest(doctorToConnect.id)} disabled={!!sendingRequest}>
                {sendingRequest ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Envoyer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight! + 10 : 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    paddingVertical: 0,
  },
  filtersContainer: {
    paddingVertical: 4,
    paddingRight: 20,
  },
  filtersScrollView: {
    maxHeight: 50,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
    minHeight: 36,
    justifyContent: "center",
  },
  filterChipActive: {
    backgroundColor: "#1E3A8A",
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  doctorsList: {
    flex: 1,
  },
  doctorsListContent: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  doctorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 0,
    padding: 5,
    marginBottom: 0,
    width: "100%",
    borderWidth: 0,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    position: "relative",
  },
  favoriteButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  doctorCardContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 32, // Espace pour l'icône favori
  },
  doctorAvatarContainer: {
    marginRight: 16,
  },
  doctorAvatar: {
    width: 55,
    height: 55,
    borderRadius: 40,
    backgroundColor: "#E0F2FE", // Fond bleu clair
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0,
  },
  doctorAvatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  doctorInfo: {
    flex: 1,
    justifyContent: "flex-start",
  },
  doctorName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  doctorSpecialtyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  doctorSpecialty: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "400",
  },
  separator: {
    fontSize: 14,
    color: "#9CA3AF",
    marginHorizontal: 6,
  },
  doctorLocation: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "400",
    flex: 1,
  },
  doctorExperience: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "400",
  },
  doctorRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  doctorRating: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 4,
  },
  doctorReviews: {
    fontSize: 13,
    color: "#9CA3AF",
    marginLeft: 6,
    fontWeight: "400",
  },
  topRightIndicator: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  bookNowButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bookNowIcon: {
    marginRight: 4,
  },
  bookNowText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  callButton: {
    width: 44,
    height: 44,
    backgroundColor: "#1E3A8A",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  connectButton: {
    flex: 1,
    backgroundColor: "#1E3A8A",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  connectButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  pendingButton: {
    flex: 1,
    backgroundColor: "#FEF3C7",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pendingText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#F59E0B",
  },
  cardActions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  cancelButtonIcon: {
    marginRight: 6,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#EF4444",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 16,
    fontWeight: "500",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalBodyInner: {
    paddingVertical: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
