import { useEffect, useState, useCallback, useRef } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  TextInput,
  ImageBackground,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../hooks/useAuth";
import { useDossierMedical } from "../../hooks/useDossierMedical";
import { useRendezVous } from "../../hooks/useRendezVous";
import { useMedecin } from "../../hooks/useMedecin";
import { useAllergieTraitement } from "../../hooks/useAllergieTraitement";
import { useNotifications } from "../../contexts/NotificationContext";
import { StatusRV } from "../../../domain/enums";
import { getBaseUrl } from "../../../infrastructure/http/httpClient";
import type { Utilisateur, Patient, RendezVous, Medecin, Allergie, Traitement } from "../../../domain/entities";

/**
 * Composant de présentation pour l'écran d'accueil avec design moderne
 */
export function HomeScreen() {
  const authService = useAuth();
  const dossierService = useDossierMedical();
  const rendezVousService = useRendezVous();
  const medecinService = useMedecin();
  const allergieTraitementService = useAllergieTraitement();
  const { showNotification } = useNotifications();
  const appointmentsScrollRef = useRef<ScrollView | null>(null);
  const [currentAppointmentIndex, setCurrentAppointmentIndex] = useState(0);
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<RendezVous[]>([]);
  const [availableDisponibilites, setAvailableDisponibilites] = useState<any[]>([]);
  const [recentDoctors, setRecentDoctors] = useState<Medecin[]>([]);
  const [allergies, setAllergies] = useState<Allergie[]>([]);
  const [traitements, setTraitements] = useState<Traitement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDisponibilites, setLoadingDisponibilites] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [imageCacheKey, setImageCacheKey] = useState(Date.now());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const carouselImages = [
    require("../../../../assets/images/acceuil 2.jpg"),
    require("../../../../assets/images/acceuil 3.jpg"),
    require("../../../../assets/images/acceuil 4.jpg"),
  ];

  useEffect(() => {
    loadUser();
  }, []);

  // Recharger le profil quand l'écran reprend le focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadUser();
      }
    }, [user?.id])
  );

  useEffect(() => {
    if (user?.id && user.typeUtilisateur === "patient") {
      loadAppointments();
      loadRecentDoctors();
      loadAvailableDisponibilites();
      loadAllergies();
      loadTraitements();
    }
  }, [user]);

  // Auto-swipe horizontal des rendez-vous disponibles
  useEffect(() => {
    if (!availableDisponibilites || availableDisponibilites.length <= 1) {
      return;
    }

    const CARD_WIDTH = Dimensions.get("window").width - 80; // largeur approximative d'une carte
    const INTERVAL_MS = 9000; // 4 secondes entre chaque swipe

    const intervalId = setInterval(() => {
      setCurrentAppointmentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % availableDisponibilites.length;

        if (appointmentsScrollRef.current) {
          appointmentsScrollRef.current.scrollTo({
            x: nextIndex * (CARD_WIDTH + 12),
            animated: true,
          });
        }

        return nextIndex;
      });
    }, INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [availableDisponibilites]);

  // Auto-swipe du carrousel d'images
  useEffect(() => {
    const CAROUSEL_INTERVAL_MS = 5000; // 5 secondes entre chaque image

    const carouselIntervalId = setInterval(() => {
      setCurrentCarouselIndex((prevIndex) => {
        return (prevIndex + 1) % carouselImages.length;
      });
    }, CAROUSEL_INTERVAL_MS);

    return () => clearInterval(carouselIntervalId);
  }, []);

  // Recharger les données à chaque fois que l'écran Home reprend le focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id && user.typeUtilisateur === "patient") {
        loadAppointments();
        loadRecentDoctors();
        loadAvailableDisponibilites();
      }
    }, [user])
  );

  const loadUser = async () => {
    const result = await authService.getProfile();
    if (result.ok) {
      setUser(result.value);
      // Forcer le rechargement de l'image en mettant à jour la clé de cache
      setImageCacheKey(Date.now());
    } else {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: "Impossible de charger le profil",
      });
    }
    setLoading(false);
  };

  const loadAppointments = async () => {
    if (!user?.id) return;

    const result = await rendezVousService.getByPatient(user.id);
    if (result.ok) {
      const now = new Date();
      const upcoming = result.value
        .filter((rv) => {
          const rvDate = new Date(rv.date);
          return rvDate >= now && rv.statut === StatusRV.PLANIFIE;
        })
        .sort((a, b) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        })
        .slice(0, 1); // Prendre seulement le prochain
      setUpcomingAppointments(upcoming);
    }
  };

  const loadAvailableDisponibilites = async () => {
    if (!user?.id) {
      setAvailableDisponibilites([]);
      return;
    }

    setLoadingDisponibilites(true);
    try {
      // D'abord, récupérer les connexions acceptées pour obtenir les IDs des médecins connectés
      const connexionsResult = await medecinService.getConnexions(user.id);
      
      let connectedMedecinIds: Set<string> = new Set();
      
      if (connexionsResult.ok && connexionsResult.value.length > 0) {
        const acceptedConnexions = connexionsResult.value.filter(
          (c) => c.statut === "Accepté"
        );
        connectedMedecinIds = new Set(acceptedConnexions.map(c => c.idMedecin));
      }

      // Récupérer toutes les disponibilités publiques
      const result = await rendezVousService.getDisponibilitesPublic();
      if (result.ok && result.value) {
        let filtered = result.value;
        
        // Si l'utilisateur a des connexions acceptées, filtrer par ces médecins
        // Sinon, afficher toutes les disponibilités publiques
        if (connectedMedecinIds.size > 0) {
          filtered = result.value.filter(
            (disponibilite) => connectedMedecinIds.has(disponibilite.idMedecin)
          );
        }

        // Filtrer les disponibilités passées
        const now = new Date();
        filtered = filtered.filter((disponibilite) => {
          const disponibiliteDate = new Date(`${disponibilite.jour}T${disponibilite.heureDebut}`);
          return disponibiliteDate >= now;
        });

        // Trier par date et heure (sans limiter le nombre de résultats)
        const sorted = filtered.sort((a, b) => {
          const dateA = new Date(`${a.jour}T${a.heureDebut}`);
          const dateB = new Date(`${b.jour}T${b.heureDebut}`);
          return dateA.getTime() - dateB.getTime();
        });

        // Garder toutes les disponibilités triées pour affichage vertical (une carte par rendez-vous)
        setAvailableDisponibilites(sorted);
      } else {
        const errorMessage = !result.ok && 'error' in result ? result.error : "Erreur inconnue";
        console.error("Erreur lors du chargement des disponibilités:", errorMessage);
        setAvailableDisponibilites([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des disponibilités:", error);
      setAvailableDisponibilites([]);
    } finally {
      setLoadingDisponibilites(false);
    }
  };

  const loadRecentDoctors = async () => {
    if (!user?.id) return;

    try {
      const connexionsResult = await medecinService.getConnexions(user.id);
      if (connexionsResult.ok && connexionsResult.value.length > 0) {
        const acceptedConnexions = connexionsResult.value.filter(
          (c) => c.statut === "Accepté"
        );
        
        if (acceptedConnexions.length > 0) {
          // Récupérer les médecins connectés
          const doctorsPromises = acceptedConnexions.map(async (connexion) => {
            const medecinResult = await medecinService.getMedecinById(connexion.idMedecin);
            return medecinResult.ok ? medecinResult.value : null;
          });

          const doctors = (await Promise.all(doctorsPromises)).filter(
            (d) => d !== null
          ) as Medecin[];
          
          if (doctors.length > 0) {
            setRecentDoctors(doctors.slice(0, 2)); // Limiter à 2 médecins récents
            return;
          }
        }
      }
      
      // Si pas de connexions ou pas de médecins connectés, charger les médecins disponibles
      const result = await medecinService.searchMedecins();
      if (result.ok && result.value.length > 0) {
        setRecentDoctors(result.value.slice(0, 2));
      }
    } catch (error) {
      console.error("Erreur lors du chargement des médecins récents:", error);
      // En cas d'erreur, essayer de charger tous les médecins
      const result = await medecinService.searchMedecins();
      if (result.ok && result.value.length > 0) {
        setRecentDoctors(result.value.slice(0, 2));
      }
    }
  };

  if (loading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  const userName = user.typeUtilisateur === "medecin" 
    ? `Dr. ${(user as Patient)?.nom || user.mail?.split("@")[0] || "Utilisateur"}`
    : (user as Patient)?.nom || user.mail?.split("@")[0] || "Utilisateur";

  const doctorCategories = [
    { id: "neurologist", name: "Neurologue", icon: "brain", color: "#1E3A8A" },
    { id: "cardiologist", name: "Cardiologue", icon: "heart", color: "#EF4444" },
    { id: "orthopedist", name: "Orthopédiste", icon: "fitness", color: "#10B981" },
    { id: "pulmo", name: "Pneumologue", icon: "medical", color: "#3B82F6" },
  ];

  const formatAppointmentDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatAppointmentTime = (date: Date) => {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleBookDisponibilite = (disponibilite: any) => {
    if (!user?.id) {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: "Utilisateur non identifié",
      });
      return;
    }

    // Si la disponibilité est marquée comme indisponible, ne rien faire
    if (disponibilite.disponible === false) {
      showNotification({
        type: 'warning',
        title: 'Créneau indisponible',
        message: "Ce rendez-vous a déjà été réservé par un autre patient.",
      });
      return;
    }

    const disponibiliteDate = new Date(`${disponibilite.jour}T${disponibilite.heureDebut}`);

    Alert.alert(
      "Confirmer le rendez-vous",
      `Voulez-vous prendre un rendez-vous avec ${disponibilite.medecinNom || "ce médecin"} le ${formatAppointmentDate(
        disponibiliteDate
      )} à ${disponibilite.heureDebut} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            try {
              const isoDate = disponibiliteDate.toISOString();
              const result = await rendezVousService.create({
                patientId: user.id,
                medecinId: disponibilite.idMedecin,
                date: isoDate,
                motif: disponibilite.typeConsultation || "Consultation",
              });

              if (result.ok) {
                showNotification({
                  type: 'success',
                  title: 'Rendez-vous confirmé',
                  message: `Votre rendez-vous avec ${disponibilite.medecinNom || "le médecin"} a été pris avec succès.`,
                  autoClose: true,
                  autoCloseDelay: 5000,
                });
                await Promise.all([
                  loadAppointments(),
                  loadAvailableDisponibilites(),
                ]);
              } else {
                showNotification({
                  type: 'error',
                  title: 'Erreur',
                  message: result.error || "Impossible de créer le rendez-vous. Veuillez réessayer.",
                });
              }
            } catch (error) {
              console.error("Erreur lors de la prise de rendez-vous:", error);
              showNotification({
                type: 'error',
                title: 'Erreur',
                message: "Une erreur est survenue lors de la prise de rendez-vous.",
              });
            }
          },
        },
      ]
    );
  };

  const loadAllergies = async () => {
    if (!user?.id) return;

    const result = await allergieTraitementService.getAllergiesByPatient(user.id);
    if (result.ok) {
      setAllergies(result.value);
    }
  };

  const loadTraitements = async () => {
    if (!user?.id) return;

    const result = await allergieTraitementService.getTraitementsByPatient(user.id);
    if (result.ok) {
      setTraitements(result.value);
    }
  };

  const onRefresh = async () => {
    if (user?.id && user.typeUtilisateur === "patient") {
      await Promise.all([
        loadAppointments(),
        loadRecentDoctors(),
        loadAvailableDisponibilites(),
        loadAllergies(),
        loadTraitements(),
      ]);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={loading || loadingDisponibilites} onRefresh={onRefresh} />
      }
    >
      {/* Header avec salutation */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.userName}>{userName} !</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => {
              // TODO: Implémenter la navigation vers les notifications
              showNotification({
                type: 'info',
                title: 'Notifications',
                message: 'Fonctionnalité à venir',
              });
            }}
          >
            <Ionicons name="notifications-outline" size={24} color="#1E3A8A" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
          <View style={styles.profileImageContainer}>
            {user && (user as any).photoProfil ? (
              <Image
                key={imageCacheKey}
                source={{ 
                  uri: `${getBaseUrl()}${(user as any).photoProfil}?t=${imageCacheKey}`,
                }}
                style={styles.profileImage}
                cachePolicy="none"
                contentFit="cover"
                transition={200}
                onError={(error) => {
                  console.error("[HomeScreen] Erreur de chargement de l'image:", error);
                }}
              />
            ) : (
            <View style={styles.profileImage}>
              <Text style={styles.profileInitial}>{userName.charAt(0).toUpperCase()}</Text>
            </View>
            )}
            {user.typeUtilisateur === "medecin" && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Barre de recherche */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => router.push("/(tabs)/doctors")}
      >
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <Text style={styles.searchPlaceholder}>Rechercher un médecin</Text>
      </TouchableOpacity>

      {/* Banner promotionnel avec carrousel */}
      <View style={styles.carouselContainer}>
        <ImageBackground
          source={carouselImages[currentCarouselIndex]}
          style={styles.promotionalBanner}
          imageStyle={styles.promotionalBannerImage}
        >
          <View style={styles.promotionalContent}>
            <View style={styles.promotionalTextContainer}>
              <Text style={styles.promotionalSubtitle}>
                La santé est précieuse : Accédez facilement aux médecins avec nous !
              </Text>
            </View>
          </View>
        </ImageBackground>
        
        {/* Indicateurs de pagination */}
        <View style={styles.carouselIndicators}>
          {carouselImages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.carouselIndicator,
                index === currentCarouselIndex && styles.carouselIndicatorActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Vue récapitulative des paramètres de santé */}
      {user?.typeUtilisateur === "patient" && (
        <View style={styles.healthSummaryCardWrapper}>
          <View style={styles.healthSummaryCard}>
          <View style={styles.healthSummaryHeader}>
            <Text style={styles.healthSummaryTitle}>Résumé de santé</Text>
          </View>
          
          <View style={styles.healthSummaryContent}>
            {/* Allergies */}
            <View style={styles.healthSummaryItem}>
              <View style={styles.healthSummaryItemHeader}>
                <Ionicons name="warning" size={20} color="#EF4444" />
                <Text style={styles.healthSummaryItemTitle}>Allergies</Text>
              </View>
              {allergies.length > 0 ? (
                <View style={styles.healthSummaryTags}>
                  {allergies.slice(0, 3).map((allergie) => (
                    <View key={allergie.id} style={styles.healthTag}>
                      <Text style={styles.healthTagText}>{allergie.nom}</Text>
                    </View>
                  ))}
                  {allergies.length > 3 && (
                    <View style={styles.healthTag}>
                      <Text style={styles.healthTagText}>+{allergies.length - 3}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <Text style={styles.healthSummaryEmpty}>Aucune allergie enregistrée</Text>
              )}
            </View>

            {/* Traitements en cours */}
            <View style={styles.healthSummaryItem}>
              <View style={styles.healthSummaryItemHeader}>
                <Ionicons name="medical-outline" size={20} color="#10B981" />
                <Text style={styles.healthSummaryItemTitle}>Traitements en cours</Text>
              </View>
              {traitements.filter(t => !t.dateFin || new Date(t.dateFin) >= new Date()).length > 0 ? (
                <View style={styles.healthSummaryTags}>
                  {traitements
                    .filter(t => !t.dateFin || new Date(t.dateFin) >= new Date())
                    .slice(0, 3)
                    .map((traitement) => (
                      <View key={traitement.id} style={styles.healthTag}>
                        <Text style={styles.healthTagText}>{traitement.nom}</Text>
                      </View>
                    ))}
                  {traitements.filter(t => !t.dateFin || new Date(t.dateFin) >= new Date()).length > 3 && (
                    <View style={styles.healthTag}>
                      <Text style={styles.healthTagText}>
                        +{traitements.filter(t => !t.dateFin || new Date(t.dateFin) >= new Date()).length - 3}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <Text style={styles.healthSummaryEmpty}>Aucun traitement en cours</Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.healthSummaryButton}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <Text style={styles.healthSummaryButtonText}>Gérer mes informations de santé</Text>
            <Ionicons name="chevron-forward" size={20} color="#1E3A8A" />
          </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Texte entre le banner et les catégories */}
      <View style={styles.categoriesHeader}>
        <Text style={styles.categoriesHeaderText}>Spécialités médicales</Text>
      </View>

      {/* Catégories de médecins */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {doctorCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryCard}
            onPress={() => router.push({
              pathname: "/(tabs)/doctors",
              params: { specialty: category.name }
            })}
          >
            <View style={[styles.categoryIcon, { backgroundColor: `${category.color}15` }]}>
              <Ionicons name={category.icon as any} size={24} color={category.color} />
            </View>
            <Text style={styles.categoryName}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Disponibilités publiées - Carte bleue */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rendez-vous disponibles</Text>
        <View style={styles.sectionSpacing} />
        {loadingDisponibilites ? (
          <View style={styles.loadingDisponibilitesContainer}>
            <ActivityIndicator size="small" color="#1E3A8A" />
            <Text style={styles.loadingDisponibilitesText}>Chargement des disponibilités...</Text>
          </View>
        ) : availableDisponibilites.length > 0 ? (
          <ScrollView
            horizontal
            ref={appointmentsScrollRef}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.appointmentsHorizontalContainer}
          >
            {availableDisponibilites.map((disponibilite) => {
              const disponibiliteDate = new Date(`${disponibilite.jour}T${disponibilite.heureDebut}`);
              const isAvailable = disponibilite.disponible !== false;
              return (
                <TouchableOpacity
                  key={disponibilite.id}
                  style={[
                    styles.appointmentCard,
                    !isAvailable && styles.appointmentCardDisabled,
                  ]}
                  activeOpacity={0.8}
                  onPress={isAvailable ? () => handleBookDisponibilite(disponibilite) : undefined}
                >
                  <View style={styles.appointmentLeft}>
                    <View style={styles.appointmentAvatar}>
                      <Text style={styles.appointmentAvatarText}>
                        {disponibilite.medecinNom?.charAt(0) || "D"}
                      </Text>
                    </View>
                    <View style={styles.appointmentInfo}>
                      <View style={styles.appointmentHeaderRow}>
                        <Text style={styles.appointmentDoctorName}>
                          {disponibilite.medecinNom || "Dr. Médecin"}
                        </Text>
                        <View style={styles.appointmentStatusContainer}>
                          <View
                            style={[
                              styles.appointmentStatusBadge,
                              isAvailable
                                ? styles.appointmentStatusAvailable
                                : styles.appointmentStatusUnavailable,
                            ]}
                          >
                            <Text style={styles.appointmentStatusText}>
                              {isAvailable ? "Disponible" : "Indisponible"}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Text style={styles.appointmentSpecialty}>
                        {disponibilite.medecinSpecialite || disponibilite.typeConsultation}
                      </Text>
                      <View style={styles.appointmentDateTime}>
                        <Ionicons name="calendar-outline" size={14} color="#FFFFFF" />
                        <Text style={styles.appointmentDateText}>
                          {formatAppointmentDate(disponibiliteDate)}
                        </Text>
                        <Ionicons name="time-outline" size={14} color="#FFFFFF" style={styles.timeIcon} />
                        <Text style={styles.appointmentDateText}>
                          {disponibilite.heureDebut} - {disponibilite.heureFin}
                        </Text>
                      </View>
                      {disponibilite.typeConsultation && (
                        <Text style={styles.appointmentTypeText}>
                          {disponibilite.typeConsultation}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyAppointmentCard}>
            <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyAppointmentText}>Aucune disponibilité publiée</Text>
            <TouchableOpacity
              style={styles.bookAppointmentButton}
              onPress={() => router.push("/(tabs)/doctors")}
            >
              <Text style={styles.bookAppointmentButtonText}>Voir les médecins</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Mes visites récentes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes visites récentes</Text>
          {recentDoctors.length > 0 && (
            <TouchableOpacity onPress={() => router.push("/(tabs)/doctors")}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.sectionSpacing} />
        {recentDoctors.length > 0 ? (
          <View>
            {recentDoctors.map((doctor) => {
              const isFavorite = favorites.has(doctor.id);
              const location = doctor.adresse || "Centre médical";
              const rating = 5;
              const reviewCount = Math.floor(Math.random() * 200) + 50;

              return (
                <TouchableOpacity 
                  key={doctor.id} 
                  style={styles.recentDoctorCard}
                  activeOpacity={0.7}
                >
                  {/* Icône favori en haut à droite */}
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => {
                      setFavorites(prev => {
                        const newFavorites = new Set(prev);
                        if (newFavorites.has(doctor.id)) {
                          newFavorites.delete(doctor.id);
                        } else {
                          newFavorites.add(doctor.id);
                        }
                        return newFavorites;
                      });
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons 
                      name={isFavorite ? "heart" : "heart-outline"} 
                      size={20} 
                      color={isFavorite ? "#EF4444" : "#9CA3AF"} 
                    />
                  </TouchableOpacity>

                <View style={styles.recentDoctorCardContent}>
                    {/* Avatar circulaire à gauche avec fond bleu clair */}
                    <View style={styles.recentDoctorAvatarContainer}>
                  <View style={styles.recentDoctorAvatar}>
                    <Text style={styles.recentDoctorAvatarText}>
                      {doctor.nom.charAt(0).toUpperCase()}
                    </Text>
                      </View>
                  </View>
                    {/* Informations à droite */}
                  <View style={styles.recentDoctorInfo}>
                      {/* Nom du médecin */}
                      <Text style={styles.recentDoctorName} numberOfLines={1}>
                        {doctor.nom.startsWith("Dr.") ? doctor.nom : `Dr. ${doctor.nom}`}
                      </Text>
                    {/* Spécialité, Localisation et Années d'expérience */}
                    <View style={styles.recentDoctorSpecialtyRow}>
                      <Text style={styles.recentDoctorSpecialty} numberOfLines={1}>
                        {doctor.specialite || "Médecin généraliste"}
                      </Text>
                      <Text style={styles.separator}> | </Text>
                      <Text style={styles.recentDoctorLocation} numberOfLines={1}>
                        {location}
                      </Text>
                      {doctor.anneesExperience && (
                        <>
                          <Text style={styles.separator}> | </Text>
                          <Text style={styles.recentDoctorExperience} numberOfLines={1}>
                            {doctor.anneesExperience} ans d&apos;exp.
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyRecentDoctors}>
            <Ionicons name="medical-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyRecentDoctorsText}>Aucun médecin récent</Text>
            <TouchableOpacity
              style={styles.findDoctorButton}
              onPress={() => router.push("/(tabs)/doctors")}
            >
              <Text style={styles.findDoctorButtonText}>Trouver un médecin</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight! + 16 : 50,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  notificationButton: {
    position: "relative",
    padding: 8,
  },
  notificationBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1E3A8A",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  proBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#10B981",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  proBadgeText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    gap: 12,
  },
  searchPlaceholder: {
    fontSize: 15,
    color: "#9CA3AF",
  },
  promotionalBanner: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    overflow: "hidden",
    minHeight: 240,
  },
  promotionalBannerImage: {
    borderRadius: 16,
    resizeMode: "cover",
  },
  promotionalContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    flex: 1,
    paddingBottom: 4,
  },
  promotionalTextContainer: {
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  promotionalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 10,
    lineHeight: 28,
  },
  promotionalSubtitle: {
    fontSize: 15,
    fontWeight: "400",
    color: "#1E3A8A",
    lineHeight: 22,
  },
  carouselContainer: {
    position: "relative",
    marginBottom: 16,
  },
  carouselIndicators: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 1,
    paddingHorizontal: 20,
  },
  carouselIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D1D5DB",
  },
  carouselIndicatorActive: {
    backgroundColor: "#1E3A8A",
    width: 24,
  },
  categoriesHeader: {
    marginBottom: 16,
  },
  categoriesHeaderText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  categoriesContainer: {
    paddingVertical: 8,
    gap: 12,
    marginBottom: 24,
  },
  categoryCard: {
    alignItems: "center",
    marginRight: 16,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  sectionSpacing: {
    height: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  appointmentsHorizontalContainer: {
    paddingVertical: 4,
    paddingRight: 4,
    gap: 12,
  },
  appointmentCard: {
    backgroundColor: "#1E3A8A",
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  appointmentCardDisabled: {
    opacity: 0.5,
  },
  appointmentLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  appointmentAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  appointmentAvatarText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentDoctorName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  appointmentHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  appointmentSpecialty: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 12,
  },
  appointmentTypeText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
    fontStyle: "italic",
  },
  appointmentStatusContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  appointmentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  appointmentStatusAvailable: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
  },
  appointmentStatusUnavailable: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
  },
  appointmentStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  appointmentDateTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  appointmentDateText: {
    fontSize: 13,
    color: "#FFFFFF",
    marginLeft: 4,
  },
  timeIcon: {
    marginLeft: 12,
  },
  recentDoctorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 0,
    padding: 8,
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
  recentDoctorCardContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 32, // Espace pour l'icône favori
  },
  recentDoctorAvatarContainer: {
    marginRight: 16,
  },
  recentDoctorAvatar: {
    width: 55,
    height: 55,
    borderRadius: 40,
    backgroundColor: "#E0F2FE", // Fond bleu clair
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0,
  },
  recentDoctorAvatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  recentDoctorInfo: {
    flex: 1,
    justifyContent: "flex-start",
  },
  recentDoctorName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  recentDoctorSpecialtyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  recentDoctorSpecialty: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "400",
  },
  separator: {
    fontSize: 14,
    color: "#9CA3AF",
    marginHorizontal: 6,
  },
  recentDoctorLocation: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "400",
    flex: 1,
  },
  recentDoctorExperience: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "400",
  },
  recentDoctorRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  recentDoctorRating: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 4,
  },
  recentDoctorReviews: {
    fontSize: 13,
    color: "#9CA3AF",
    marginLeft: 6,
    fontWeight: "400",
  },
  emptyAppointmentCard: {
    backgroundColor: "#F3F4F6",
    borderRadius: 5,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyAppointmentText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 16,
    marginBottom: 20,
  },
  bookAppointmentButton: {
    backgroundColor: "#1E3A8A",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookAppointmentButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyRecentDoctors: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyRecentDoctorsText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 16,
    marginBottom: 20,
  },
  healthSummaryCardWrapper: {
    width: "100%",
    
  },
  healthSummaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 0,
    padding: 20,
    marginBottom: 20,
    marginHorizontal: 0,
    borderWidth: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: "100%",
  },
  healthSummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  healthSummaryTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  healthSummaryContent: {
    gap: 16,
    marginBottom: 16,
  },
  healthSummaryItem: {
    gap: 8,
  },
  healthSummaryItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  healthSummaryItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  healthSummaryTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  healthTag: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  healthTagText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  healthSummaryEmpty: {
    fontSize: 14,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  healthSummaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  healthSummaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  findDoctorButton: {
    backgroundColor: "#1E3A8A",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  findDoctorButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  bookNowIcon: {
    marginRight: 4,
  },
  loadingDisponibilitesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 12,
  },
  loadingDisponibilitesText: {
    fontSize: 14,
    color: "#6B7280",
  },
});
