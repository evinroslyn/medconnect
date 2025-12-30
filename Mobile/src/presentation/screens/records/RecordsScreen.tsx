import React, { useState, useEffect } from "react";
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
  Image,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { useDossierMedical } from "../../hooks/useDossierMedical";
import { useDocumentMedical } from "../../hooks/useDocumentMedical";
import { useAuth } from "../../hooks/useAuth";
import { usePartageMedical } from "../../hooks/usePartageMedical";
import { DatePicker } from "../../components/common/DatePicker";
import { storageService } from "../../../infrastructure/storage/StorageService";
import { STORAGE_KEYS } from "../../../infrastructure/config";
import { getDocumentDownloadUrl, getFileUrl } from "../../../infrastructure/utils/urlBuilder";
import type { MedecinInfo } from "../../../domain/entities/PartageMedical";
import type { DossierMedical } from "../../../domain/entities/DossierMedical";
import type { DocumentMedical } from "../../../domain/entities/DocumentMedical";
import type { Utilisateur } from "../../../domain/entities";
import { TypeEnregistrement } from "../../../domain/enums";

/**
 * Composant de présentation pour l'écran des dossiers médicaux
 * Utilise les hooks pour respecter l'architecture propre
 */
export function RecordsScreen() {
  const dossierService = useDossierMedical();
  const documentService = useDocumentMedical();
  const authService = useAuth();
  const partageService = usePartageMedical();
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dossiers, setDossiers] = useState<DossierMedical[]>([]);
  const [documents, setDocuments] = useState<DocumentMedical[]>([]);
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDossierModalVisible, setCreateDossierModalVisible] = useState(false);
  const [uploadDocumentModalVisible, setUploadDocumentModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentMedical | null>(null);
  const [uploading, setUploading] = useState(false);
  const [medecins, setMedecins] = useState<MedecinInfo[]>([]);
  const [loadingMedecins, setLoadingMedecins] = useState(false);
  const [shareType, setShareType] = useState<"dossier" | "document">("document");
  const [selectedMedecinId, setSelectedMedecinId] = useState<string | null>(null);
  const [sharePermissions, setSharePermissions] = useState({
    peutTelecharger: false,
    peutScreenshot: false,
  });
  const [medecinSearchQuery, setMedecinSearchQuery] = useState("");
  const [viewImageUri, setViewImageUri] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  
  // Form state for creating dossier
  const [dossierForm, setDossierForm] = useState({
    titre: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Form state for uploading document
  const [documentForm, setDocumentForm] = useState({
    nom: "",
    description: "",
    type: TypeEnregistrement.RESULTAT_LABO as TypeEnregistrement,
    fichierUri: null as string | null,
  });

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadDossiers();
    }
  }, [user]);

  const loadUser = async () => {
    const result = await authService.getProfile();
    if (result.ok) {
      setUser(result.value);
    } else {
      Alert.alert("Erreur", "Impossible de charger le profil");
    }
  };

  const loadDossiers = async () => {
    if (!user?.id) return;
    setLoading(true);
    const result = await dossierService.getDossiersByPatient(user.id);
    if (result.ok) {
      console.log("[RecordsScreen] Dossiers loaded:", {
        count: result.value?.length || 0,
        dossiers: result.value,
        firstDossier: result.value?.[0],
        isArray: Array.isArray(result.value),
      });
      // S'assurer que result.value est un tableau
      const dossiersArray = Array.isArray(result.value) ? result.value : [];
      console.log("[RecordsScreen] Setting dossiers state:", dossiersArray.length);
      setDossiers(dossiersArray);
      // Si un dossier est sélectionné, charger ses documents
      if (selectedDossierId) {
        await loadDocuments(selectedDossierId);
      }
    } else {
      console.error("[RecordsScreen] Error loading dossiers:", result.error);
      Alert.alert("Erreur", result.error || "Impossible de charger les dossiers");
    }
    setLoading(false);
  };

  const loadDocuments = async (dossierId: string) => {
    if (!user?.id) return;
    const result = await documentService.getDocumentsByDossier(dossierId);
    if (result.ok) {
      setDocuments(result.value);
    } else {
      Alert.alert("Erreur", "Impossible de charger les documents");
    }
  };

  const categories = [
    { id: "all", name: "Tous", icon: "document-text", color: "#1E3A8A" },
    { id: TypeEnregistrement.RESULTAT_LABO, name: "Analyses", icon: "water", color: "#10B981" },
    { id: TypeEnregistrement.ORDONNANCE, name: "Ordonnances", icon: "medical", color: "#F59E0B" },
    { id: TypeEnregistrement.DIAGNOSTIC, name: "Consultations", icon: "checkmark-circle", color: "#3B82F6" },
    { id: TypeEnregistrement.IMAGERIE, name: "Imagerie", icon: "scan", color: "#8B5CF6" },
    { id: TypeEnregistrement.NOTES, name: "Notes", icon: "clipboard", color: "#EF4444" },
    { id: TypeEnregistrement.RADIO, name: "Radiologie", icon: "scan", color: "#06B6D4" },
  ];

  // Filtrer les documents selon la catégorie sélectionnée
  const filteredDocuments = documents.filter((doc) => {
    if (!selectedCategory || selectedCategory === "all") return true;
    return doc.type === selectedCategory;
  });

  const getCategoryIcon = (type: TypeEnregistrement): string => {
    const category = categories.find((c) => c.id === type);
    return category?.icon || "document-text";
  };

  const getCategoryColor = (type: TypeEnregistrement) => {
    const category = categories.find((c) => c.id === type);
    return category?.color || "#1E3A8A";
  };

  const handlePickDocument = async () => {
    try {
      // Pour l'instant, on utilise aussi ImagePicker pour les documents
      // TODO: Installer expo-document-picker pour une meilleure gestion des PDF
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setDocumentForm({ ...documentForm, fichierUri: result.assets[0].uri });
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sélectionner le document");
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission requise", "L'accès à la galerie est nécessaire");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setDocumentForm({ ...documentForm, fichierUri: result.assets[0].uri });
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sélectionner l'image");
    }
  };

  const handleCreateDossier = async () => {
    if (!dossierForm.titre.trim()) {
      Alert.alert("Erreur", "Veuillez saisir un titre pour le dossier");
      return;
    }

    if (!user?.id) {
      Alert.alert("Erreur", "Utilisateur non connecté");
      return;
    }

    setUploading(true);
    try {
      const result = await dossierService.uploadDossier({
        idPatient: user.id,
        titre: dossierForm.titre,
        description: dossierForm.description || undefined,
        date: dossierForm.date,
      });

      if (result.ok) {
        Alert.alert("Succès", "Dossier créé avec succès");
        setCreateDossierModalVisible(false);
        setDossierForm({
          titre: "",
          description: "",
          date: new Date().toISOString().split("T")[0],
        });
        // Recharger la liste des dossiers
        await loadDossiers();
        // Ne pas sélectionner automatiquement - laisser l'utilisateur voir la liste mise à jour
        // L'utilisateur pourra cliquer sur le dossier s'il veut l'ouvrir
      } else {
        Alert.alert("Erreur", result.error || "Impossible de créer le dossier");
      }
    } catch (error) {
      Alert.alert("Erreur", "Une erreur est survenue lors de la création du dossier");
    } finally {
      setUploading(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!documentForm.nom.trim()) {
      Alert.alert("Erreur", "Veuillez saisir un nom pour le document");
      return;
    }

    if (!selectedDossierId) {
      Alert.alert("Erreur", "Veuillez sélectionner un dossier");
      return;
    }

    if (!user?.id) {
      Alert.alert("Erreur", "Utilisateur non connecté");
      return;
    }

    setUploading(true);
    try {
      const result = await documentService.uploadDocument(
        {
          idDossierMedical: selectedDossierId,
          idPatient: user.id,
          nom: documentForm.nom,
          type: documentForm.type,
          description: documentForm.description || undefined,
        },
        documentForm.fichierUri || undefined
      );

      if (result.ok) {
        Alert.alert("Succès", "Document téléversé avec succès");
        setUploadDocumentModalVisible(false);
        setDocumentForm({
          nom: "",
          description: "",
          type: TypeEnregistrement.RESULTAT_LABO,
          fichierUri: null,
        });
        await loadDocuments(selectedDossierId);
      } else {
        Alert.alert("Erreur", result.error || "Impossible de téléverser le document");
      }
    } catch (error) {
      Alert.alert("Erreur", "Une erreur est survenue lors du téléversement");
    } finally {
      setUploading(false);
    }
  };

  const handleSelectDossier = async (dossierId: string) => {
    setSelectedDossierId(dossierId);
    await loadDocuments(dossierId);
  };

  const handleDeleteDossier = async (dossierId: string) => {
    Alert.alert(
      "Supprimer le dossier",
      "Êtes-vous sûr de vouloir supprimer ce dossier ? Tous les documents associés seront également supprimés.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const result = await dossierService.deleteDossier(dossierId);
            if (result.ok) {
              if (selectedDossierId === dossierId) {
                setSelectedDossierId(null);
                setDocuments([]);
              }
              await loadDossiers();
            } else {
              Alert.alert("Erreur", result.error || "Impossible de supprimer le dossier");
            }
          },
        },
      ]
    );
  };

  const handleDeleteDocument = async (documentId: string) => {
    Alert.alert(
      "Supprimer le document",
      "Êtes-vous sûr de vouloir supprimer ce document ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const result = await documentService.deleteDocument(documentId);
            if (result.ok && selectedDossierId) {
              await loadDocuments(selectedDossierId);
            } else if (!result.ok) {
              Alert.alert("Erreur", result.error || "Impossible de supprimer le document");
            }
          },
        },
      ]
    );
  };

  const handleDownload = async (document: DocumentMedical) => {
    if (!document.cheminFichier) {
      Alert.alert("Information", "Aucun fichier associé à ce document");
      return;
    }

    try {
      // Afficher un indicateur de chargement
      Alert.alert("Téléchargement", "Téléchargement en cours...", [], { cancelable: false });

      // Construire l'URL de téléchargement
      const apiBaseUrl = Platform.OS === "android" 
        ? "http://10.0.2.2:3000/api" 
        : "http://localhost:3000/api";
      const downloadUrl = `${apiBaseUrl}/documents-medicaux/${document.id}/download`;

      // Récupérer le token d'authentification
      const token = await storageService.getItem<string>(STORAGE_KEYS.AUTH_TOKEN);

      // Créer le répertoire de téléchargement s'il n'existe pas
      const downloadDir = `${FileSystem.documentDirectory}downloads/`;
      const dirInfo = await FileSystem.getInfoAsync(downloadDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
      }

      // Extraire le nom du fichier depuis le chemin
      const filename = document.cheminFichier.split("/").pop() || `document_${document.id}`;
      const fileUri = `${downloadDir}${filename}`;

      // Télécharger le fichier
      const downloadResult = await FileSystem.downloadAsync(downloadUrl, fileUri, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (downloadResult.status === 200) {
        // Vérifier si le partage est disponible
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          // Proposer de partager le fichier
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: downloadResult.headers?.["content-type"] || "application/octet-stream",
            dialogTitle: `Télécharger ${document.nom}`,
          });
          Alert.alert("Succès", "Fichier téléchargé avec succès");
        } else {
          Alert.alert("Succès", `Fichier téléchargé dans : ${fileUri}`);
        }
      } else {
        throw new Error(`Erreur de téléchargement : ${downloadResult.status}`);
      }
    } catch (error: any) {
      console.error("Erreur lors du téléchargement:", error);
      const errorMessage = error?.message || error?.toString() || "Erreur inconnue";
      console.error("Détails de l'erreur:", {
        message: errorMessage,
        stack: error?.stack,
        name: error?.name,
      });
      Alert.alert(
        "Erreur",
        errorMessage.includes("Cannot find module")
          ? "Module manquant. Veuillez redémarrer l'application avec 'npx expo start --clear'"
          : errorMessage || "Impossible de télécharger le fichier. Vérifiez votre connexion."
      );
    }
  };

  const handleView = async (document: DocumentMedical) => {
    if (!document.cheminFichier) {
      Alert.alert("Information", "Aucun fichier associé à ce document");
      return;
    }

    try {
      // Récupérer le token d'authentification
      const token = await storageService.getItem<string>(STORAGE_KEYS.AUTH_TOKEN);

      // Déterminer le type de fichier
      const fileExtension = document.cheminFichier.toLowerCase().split(".").pop();
      const isImage = ["jpg", "jpeg", "png", "gif"].includes(fileExtension || "");
      const isPdf = fileExtension === "pdf";

      if (isImage) {
        // Pour les images, utiliser l'URL directe du fichier si disponible, sinon le download endpoint
        setLoadingImage(true);
        setViewImageUri(null);
        setSelectedDocument(document);
        setViewModalVisible(true);

        try {
          // Essayer d'abord avec l'URL directe du fichier (plus rapide)
          let imageUrl: string;
          
          if (document.cheminFichier.startsWith("http://") || document.cheminFichier.startsWith("https://")) {
            // URL complète déjà fournie
            imageUrl = document.cheminFichier;
          } else {
            // Construire l'URL à partir du chemin du fichier
            imageUrl = getFileUrl(document.cheminFichier);
          }

          // Ajouter le token d'authentification si nécessaire
          // Note: Pour les fichiers statiques servis via /uploads/, le token peut être dans l'URL ou le header
          const imageUrlWithAuth = token ? `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}token=${token}` : imageUrl;

          console.log(`[Preview] Loading image from: ${imageUrlWithAuth}`);
          
          // Vérifier si l'URL est accessible
          try {
            const response = await fetch(imageUrlWithAuth, {
              method: "HEAD",
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            
            if (response.ok) {
              setViewImageUri(imageUrlWithAuth);
            } else {
              // Si l'URL directe ne fonctionne pas, utiliser l'endpoint de download
              console.log(`[Preview] Direct URL failed (${response.status}), trying download endpoint`);
              const downloadUrl = getDocumentDownloadUrl(document.id);
              const tempFileUri = `${FileSystem.cacheDirectory}temp_image_${document.id}_${Date.now()}`;
              const downloadResult = await FileSystem.downloadAsync(downloadUrl, tempFileUri, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });

              if (downloadResult.status === 200) {
                setViewImageUri(downloadResult.uri);
              } else {
                Alert.alert("Erreur", `Impossible de charger l'image (${downloadResult.status})`);
              }
            }
          } catch (fetchError) {
            console.error("[Preview] Error checking image URL:", fetchError);
            // Essayer avec l'endpoint de download
            const downloadUrl = getDocumentDownloadUrl(document.id);
            const tempFileUri = `${FileSystem.cacheDirectory}temp_image_${document.id}_${Date.now()}`;
            const downloadResult = await FileSystem.downloadAsync(downloadUrl, tempFileUri, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            if (downloadResult.status === 200) {
              setViewImageUri(downloadResult.uri);
            } else {
              Alert.alert("Erreur", `Impossible de charger l'image (${downloadResult.status})`);
            }
          }
        } catch (error) {
          console.error("Erreur lors du chargement de l'image:", error);
          Alert.alert("Erreur", "Impossible de charger l'image");
        } finally {
          setLoadingImage(false);
        }
      } else if (isPdf) {
        // Pour les PDFs, utiliser l'endpoint de download
        const downloadUrl = getDocumentDownloadUrl(document.id);
        const urlWithToken = token ? `${downloadUrl}?token=${token}` : downloadUrl;
        await WebBrowser.openBrowserAsync(urlWithToken, {
          enableBarCollapsing: true,
          showTitle: true,
        });
      } else {
        // Pour les autres types, télécharger et ouvrir
        Alert.alert(
          "Visualisation",
          "Ce type de fichier ne peut pas être visualisé directement. Voulez-vous le télécharger ?",
          [
            { text: "Annuler", style: "cancel" },
            {
              text: "Télécharger",
              onPress: () => handleDownload(document),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error("Erreur lors de la visualisation:", error);
      Alert.alert("Erreur", "Impossible d'ouvrir le fichier");
    }
  };

  const loadMedecins = async () => {
    setLoadingMedecins(true);
    const result = await partageService.getMedecins();
    if (result.ok) {
      setMedecins(result.value);
    } else {
      Alert.alert("Erreur", "Impossible de charger la liste des médecins");
    }
    setLoadingMedecins(false);
  };

  const handleShare = (document: DocumentMedical) => {
    setSelectedDocument(document);
    setShareType("document");
    setSelectedMedecinId(null);
    setSharePermissions({ peutTelecharger: false, peutScreenshot: false });
    loadMedecins();
    setShareModalVisible(true);
  };

  const handleShareDossier = (dossierId: string) => {
    setSelectedDossierId(dossierId);
    setShareType("dossier");
    setSelectedMedecinId(null);
    setSharePermissions({ peutTelecharger: false, peutScreenshot: false });
    loadMedecins();
    setShareModalVisible(true);
  };

  const handleConfirmShare = async () => {
    if (!selectedMedecinId) {
      Alert.alert("Erreur", "Veuillez sélectionner un médecin");
      return;
    }

    const idRessource = shareType === "document" && selectedDocument
      ? selectedDocument.id
      : shareType === "dossier" && selectedDossierId
      ? selectedDossierId
      : null;

    if (!idRessource) {
      Alert.alert("Erreur", "Ressource non trouvée");
      return;
    }

    setUploading(true);
    const result = await partageService.partager(
      selectedMedecinId,
      shareType,
      idRessource,
      sharePermissions.peutTelecharger,
      sharePermissions.peutScreenshot
    );

    if (result.ok) {
      Alert.alert("Succès", "Partage créé avec succès");
      setShareModalVisible(false);
      setSelectedMedecinId(null);
      setSharePermissions({ peutTelecharger: false, peutScreenshot: false });
    } else {
      Alert.alert("Erreur", result.error || "Impossible de créer le partage");
    }
    setUploading(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Mes Dossiers</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => setCreateDossierModalVisible(true)}
          >
            <Ionicons name="cloud-upload" size={20} color="#fff" />
            <Text style={styles.uploadButtonText}>Nouveau dossier</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((cat) => {
            const isActive =
              selectedCategory === cat.id || (!selectedCategory && cat.id === "all");

            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                style={[
                  styles.category,
                  isActive && { backgroundColor: cat.color },
                ]}
              >
                <Ionicons name={cat.icon as any} size={18} color={isActive ? "#fff" : "#6B7280"} />
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Liste des dossiers médicaux */}
      {!selectedDossierId && (
        <>
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
              {dossiers.length} dossier{dossiers.length > 1 ? "s" : ""}
        </Text>
      </View>

          {dossiers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder" size={80} color="#D1D5DB" />
              <Text style={styles.emptyText}>Aucun dossier médical</Text>
              <Text style={styles.emptySub}>
                Créez votre premier dossier pour commencer à organiser vos documents médicaux
              </Text>
              <TouchableOpacity
                style={styles.emptyUploadButton}
                onPress={() => setCreateDossierModalVisible(true)}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.emptyUploadButtonText}>Créer un dossier</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView 
              style={styles.recordsList} 
              contentContainerStyle={styles.dossiersListContainer}
            >
              {dossiers.map((dossier) => {
                return (
                  <TouchableOpacity
                    key={dossier.id}
                    style={styles.dossierCard}
                    onPress={() => handleSelectDossier(dossier.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.dossierCardActions}>
                      <TouchableOpacity
                        style={styles.dossierCardShareBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleShareDossier(dossier.id);
                        }}
                      >
                        <Ionicons name="share" size={14} color="#1E3A8A" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.dossierCardDeleteBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteDossier(dossier.id);
                        }}
                      >
                        <Ionicons name="trash" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.dossierCardContent}>
                    <View style={styles.dossierCardIconContainer}>
                        <Ionicons name="folder" size={40} color="#FFD700" />
                    </View>
                      <View style={styles.dossierCardTextContainer}>
                    <Text style={styles.dossierCardTitle} numberOfLines={2}>
                      {dossier.titre}
                    </Text>
                        <View style={styles.dossierCardDateRow}>
                          <Ionicons name="calendar-outline" size={12} color="#6B7280" />
                    <Text style={styles.dossierCardDate} numberOfLines={1}>
                      {new Date(dossier.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </>
      )}

      {/* Liste des documents du dossier sélectionné */}
      {selectedDossierId && (
        <>
          <View style={styles.dossierHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setSelectedDossierId(null);
                setDocuments([]);
                setSelectedCategory(null);
              }}
            >
              <Ionicons name="arrow-back" size={20} color="#2563eb" />
              <Text style={styles.backButtonText}>Retour</Text>
            </TouchableOpacity>
            <View style={styles.dossierHeaderTitle}>
              <Text style={styles.dossierHeaderTitleText} numberOfLines={1}>
                {dossiers.find((d) => d.id === selectedDossierId)?.titre || "Dossier"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addDocumentButton}
              onPress={() => setUploadDocumentModalVisible(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addDocumentButtonText}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.countContainer}>
            <Text style={styles.countText}>
              {filteredDocuments.length} document{filteredDocuments.length > 1 ? "s" : ""}
            </Text>
          </View>

          <ScrollView style={styles.recordsList} contentContainerStyle={styles.recordsListContent}>
            {filteredDocuments.map((document) => {
              const iconName = getCategoryIcon(document.type);
              const categoryColor = getCategoryColor(document.type);

              return (
                <TouchableOpacity
                  key={document.id}
                  style={styles.recordCard}
                  onPress={() => handleView(document)}
                >
              <View style={styles.recordLeft}>
                    <View style={[styles.recordIcon, { backgroundColor: categoryColor }]}>
                      <Ionicons name={iconName as any} size={24} color="#fff" />
                </View>

                <View style={styles.recordInfo}>
                      <Text style={styles.recordTitle}>{document.nom}</Text>
                      {document.description && (
                        <Text style={styles.recordDescription} numberOfLines={1}>
                          {document.description}
                        </Text>
                      )}
                  <View style={styles.recordMeta}>
                        <Ionicons name="calendar" size={14} color="#6B7280" />
                    <Text style={styles.recordMetaText}>
                          {new Date(document.dateCreation).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                    </Text>
                  </View>
                </View>
              </View>

                  <View style={styles.recordActions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleView(document);
                      }}
                    >
                      <Ionicons name="eye" size={18} color="#1E3A8A" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDownload(document);
                      }}
                    >
                      <Ionicons name="download" size={18} color="#10B981" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleShare(document);
                      }}
                    >
                      <Ionicons name="share-outline" size={18} color="#F59E0B" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteDocument(document.id);
                      }}
                    >
                      <Ionicons name="trash" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
                </TouchableOpacity>
          );
        })}

            {filteredDocuments.length === 0 && (
          <View style={styles.emptyContainer}>
                <Ionicons name="document-text" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>Aucun document dans ce dossier</Text>
                <Text style={styles.emptySub}>
                  {selectedCategory && selectedCategory !== "all"
                    ? "Aucun document de ce type"
                    : "Ajoutez votre premier document à ce dossier"}
                </Text>
                {(!selectedCategory || selectedCategory === "all") && (
                  <TouchableOpacity
                    style={styles.emptyUploadButton}
                    onPress={() => setUploadDocumentModalVisible(true)}
                  >
                    <Ionicons name="cloud-upload" size={20} color="#fff" />
                    <Text style={styles.emptyUploadButtonText}>Ajouter un document</Text>
                  </TouchableOpacity>
                )}
          </View>
        )}
      </ScrollView>
        </>
      )}

      {/* Create Dossier Modal */}
      <Modal
        visible={createDossierModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateDossierModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Créer un nouveau dossier</Text>
              <TouchableOpacity onPress={() => setCreateDossierModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
    </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Titre du dossier *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Consultations 2024"
                  value={dossierForm.titre}
                  onChangeText={(text) => setDossierForm({ ...dossierForm, titre: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <DatePicker
                  label="Date"
                  value={dossierForm.date}
                  onChange={(date) => setDossierForm({ ...dossierForm, date })}
                  placeholder="Sélectionner une date"
                  maximumDate={new Date()}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description optionnelle..."
                  value={dossierForm.description}
                  onChangeText={(text) => setDossierForm({ ...dossierForm, description: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
                onPress={handleCreateDossier}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Créer le dossier</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Upload Document Modal */}
      <Modal
        visible={uploadDocumentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setUploadDocumentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un document</Text>
              <TouchableOpacity onPress={() => setUploadDocumentModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nom du document *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Résultats de laboratoire"
                  value={documentForm.nom}
                  onChangeText={(text) => setDocumentForm({ ...documentForm, nom: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Type de document</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {categories
                    .filter((c) => c.id !== "all")
                    .map((cat) => {
                      const isSelected = documentForm.type === cat.id;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.typeOption,
                            isSelected && { backgroundColor: cat.color },
                          ]}
                          onPress={() =>
                            setDocumentForm({ ...documentForm, type: cat.id as TypeEnregistrement })
                          }
                        >
                          <Ionicons name={cat.icon as any} size={20} color={isSelected ? "#fff" : "#6B7280"} />
                          <Text
                            style={[
                              styles.typeOptionText,
                              isSelected && styles.typeOptionTextActive,
                            ]}
                          >
                            {cat.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description optionnelle..."
                  value={documentForm.description}
                  onChangeText={(text) => setDocumentForm({ ...documentForm, description: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Fichier</Text>
                <View style={styles.filePickerContainer}>
                  <TouchableOpacity style={styles.filePickerBtn} onPress={handlePickDocument}>
                    <Ionicons name="document" size={20} color="#1E3A8A" />
                    <Text style={styles.filePickerText}>Choisir un document</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.filePickerBtn} onPress={handlePickImage}>
                    <Ionicons name="image" size={20} color="#1E3A8A" />
                    <Text style={styles.filePickerText}>Choisir une image</Text>
                  </TouchableOpacity>
                </View>
                {documentForm.fichierUri && (
                  <View style={styles.filePreview}>
                    <Ionicons name="document" size={16} color="#10B981" />
                    <Text style={styles.filePreviewText} numberOfLines={1}>
                      Fichier sélectionné
                    </Text>
                    <TouchableOpacity
                      onPress={() => setDocumentForm({ ...documentForm, fichierUri: null })}
                    >
                      <Ionicons name="close" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
                onPress={handleUploadDocument}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Téléverser</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* View Modal */}
      <Modal
        visible={viewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setViewModalVisible(false);
          setViewImageUri(null);
          setLoadingImage(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDocument?.cheminFichier && 
                 ["jpg", "jpeg", "png", "gif"].includes(
                   selectedDocument.cheminFichier.toLowerCase().split(".").pop() || ""
                 )
                  ? "Visualisation"
                  : "Détails du document"}
              </Text>
              <TouchableOpacity onPress={() => {
                setViewModalVisible(false);
                setViewImageUri(null);
                setLoadingImage(false);
              }}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedDocument && (
              <ScrollView style={styles.modalBody}>
                {/* Afficher l'image si c'est une image */}
                {selectedDocument.cheminFichier &&
                  (() => {
                    const fileExtension = selectedDocument.cheminFichier
                      .toLowerCase()
                      .split(".")
                      .pop();
                    const isImage = ["jpg", "jpeg", "png", "gif"].includes(fileExtension || "");
                    
                    if (isImage) {
                      return (
                        <View style={styles.imagePreviewContainer}>
                          {loadingImage ? (
                            <ActivityIndicator size="large" color="#1E3A8A" />
                          ) : viewImageUri ? (
                            <Image
                              source={{ uri: viewImageUri }}
                              style={styles.imagePreview}
                              resizeMode="contain"
                            />
                          ) : (
                            <Text style={styles.imageErrorText}>Impossible de charger l&apos;image</Text>
                          )}
                        </View>
                      );
                    }
                    return null;
                  })()}

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Nom</Text>
                  <Text style={styles.detailValue}>{selectedDocument.nom}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <View style={styles.detailTypeBadge}>
                    {(() => {
                      const iconName = getCategoryIcon(selectedDocument.type);
                      const color = getCategoryColor(selectedDocument.type);
                      return (
                        <>
                          <Ionicons name={iconName as any} size={16} color={color} />
                          <Text style={[styles.detailTypeText, { color }]}>
                            {categories.find((c) => c.id === selectedDocument.type)?.name}
                          </Text>
                        </>
                      );
                    })()}
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Date de création</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedDocument.dateCreation).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>
                </View>

                {selectedDocument.description && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.detailValue}>{selectedDocument.description}</Text>
                  </View>
                )}

                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={styles.detailActionBtn}
                    onPress={() => {
                      setViewModalVisible(false);
                      handleDownload(selectedDocument);
                    }}
                  >
                    <Ionicons name="download" size={20} color="#fff" />
                    <Text style={styles.detailActionText}>Télécharger</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.detailActionBtn, styles.detailActionBtnSecondary]}
                    onPress={() => {
                      setViewModalVisible(false);
                      handleShare(selectedDocument);
                    }}
                  >
                    <Ionicons name="share-outline" size={20} color="#1E3A8A" />
                    <Text style={[styles.detailActionText, styles.detailActionTextSecondary]}>
                      Partager
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Share Modal */}
      <Modal
        visible={shareModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Partager {shareType === "document" ? "le document" : "le dossier"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShareModalVisible(false);
                  setMedecinSearchQuery("");
                  setSelectedMedecinId(null);
                }}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Sélectionner un médecin *</Text>
                
                {/* Zone de recherche */}
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                  <TextInput
                    placeholder="Rechercher un médecin par nom..."
                    value={medecinSearchQuery}
                    onChangeText={setMedecinSearchQuery}
                    style={styles.searchInput}
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                  />
                  {medecinSearchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setMedecinSearchQuery("")}
                      style={styles.clearSearchButton}
                    >
                      <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>

                {loadingMedecins ? (
                  <ActivityIndicator size="small" color="#2563eb" style={{ marginVertical: 16 }} />
                ) : (
                  <>
                    {/* Affichage conditionnel : suggestions pendant la saisie */}
                    {medecinSearchQuery.trim() ? (
                      <ScrollView 
                        style={styles.medecinsList} 
                        nestedScrollEnabled
                        showsVerticalScrollIndicator={true}
                      >
                        {medecins
                          .filter((medecin) => {
                            const query = medecinSearchQuery.toLowerCase().trim();
                            return (
                              medecin.nom.toLowerCase().includes(query) ||
                              medecin.specialite.toLowerCase().includes(query)
                            );
                          })
                          .slice(0, 2) // Limiter à 2 résultats avec scroll vertical
                          .map((medecin) => (
                      <TouchableOpacity
                        key={medecin.id}
                        style={[
                          styles.medecinOption,
                          selectedMedecinId === medecin.id && styles.medecinOptionSelected,
                        ]}
                              onPress={() => {
                                setSelectedMedecinId(medecin.id);
                                setMedecinSearchQuery(medecin.nom); // Afficher le nom sélectionné dans le champ
                              }}
                      >
                        <View style={styles.medecinInfo}>
                          <Text style={styles.medecinName}>{medecin.nom}</Text>
                          <Text style={styles.medecinSpecialite}>{medecin.specialite}</Text>
                        </View>
                        {selectedMedecinId === medecin.id && (
                          <View style={styles.checkIcon}>
                            <Text style={styles.checkText}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                        {medecins.filter((medecin) => {
                          const query = medecinSearchQuery.toLowerCase().trim();
                          return (
                            medecin.nom.toLowerCase().includes(query) ||
                            medecin.specialite.toLowerCase().includes(query)
                          );
                        }).length === 0 && (
                          <View style={styles.noResultsContainer}>
                            <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                            <Text style={styles.noResultsText}>Aucun médecin trouvé</Text>
                            <Text style={styles.noResultsSubtext}>
                              Essayez avec un autre nom ou une autre spécialité
                            </Text>
                          </View>
                        )}
                        {medecins.filter((medecin) => {
                          const query = medecinSearchQuery.toLowerCase().trim();
                          return (
                            medecin.nom.toLowerCase().includes(query) ||
                            medecin.specialite.toLowerCase().includes(query)
                          );
                        }).length > 2 && (
                          <View style={styles.moreResultsContainer}>
                            <Text style={styles.moreResultsText}>
                              {medecins.filter((medecin) => {
                                const query = medecinSearchQuery.toLowerCase().trim();
                                return (
                                  medecin.nom.toLowerCase().includes(query) ||
                                  medecin.specialite.toLowerCase().includes(query)
                                );
                              }).length - 2} autres résultats... Continuez à taper pour affiner
                            </Text>
                          </View>
                        )}
                  </ScrollView>
                    ) : (
                      <View style={styles.searchHintContainer}>
                        <Ionicons name="search-outline" size={32} color="#D1D5DB" />
                        <Text style={styles.searchHintText}>
                          Commencez à taper pour rechercher un médecin
                        </Text>
                        <Text style={styles.searchHintSubtext}>
                          Recherchez par nom ou spécialité
                        </Text>
                      </View>
                    )}

                    {/* Afficher le médecin sélectionné même s'il n'est plus dans les résultats filtrés */}
                    {selectedMedecinId && medecinSearchQuery.trim() && (
                      (() => {
                        const selectedMedecin = medecins.find(m => m.id === selectedMedecinId);
                        const isInFilteredResults = medecins
                          .filter((medecin) => {
                            const query = medecinSearchQuery.toLowerCase().trim();
                            return (
                              medecin.nom.toLowerCase().includes(query) ||
                              medecin.specialite.toLowerCase().includes(query)
                            );
                          })
                          .slice(0, 2)
                          .some(m => m.id === selectedMedecinId);
                        
                        if (selectedMedecin && !isInFilteredResults) {
                          return (
                            <View style={styles.selectedMedecinContainer}>
                              <Text style={styles.selectedMedecinLabel}>Médecin sélectionné :</Text>
                              <TouchableOpacity
                                style={[styles.medecinOption, styles.medecinOptionSelected]}
                                onPress={() => {
                                  setMedecinSearchQuery(selectedMedecin.nom);
                                }}
                              >
                                <View style={styles.medecinInfo}>
                                  <Text style={styles.medecinName}>{selectedMedecin.nom}</Text>
                                  <Text style={styles.medecinSpecialite}>{selectedMedecin.specialite}</Text>
                                </View>
                                <View style={styles.checkIcon}>
                                  <Text style={styles.checkText}>✓</Text>
                                </View>
                              </TouchableOpacity>
                            </View>
                          );
                        }
                        return null;
                      })()
                    )}
                  </>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Permissions d&apos;accès</Text>
                <Text style={styles.permissionInfo}>
                  Par défaut, le médecin ne pourra pas télécharger ni faire de captures d&apos;écran.
                  Vous pouvez activer ces permissions ci-dessous si nécessaire.
                </Text>

                <TouchableOpacity
                  style={styles.permissionOption}
                  onPress={() =>
                    setSharePermissions({
                      ...sharePermissions,
                      peutTelecharger: !sharePermissions.peutTelecharger,
                    })
                  }
                >
                  <View style={styles.permissionCheckbox}>
                    {sharePermissions.peutTelecharger && (
                      <Text style={styles.checkboxText}>✓</Text>
                    )}
                  </View>
                  <View style={styles.permissionTextContainer}>
                    <Text style={styles.permissionTitle}>Autoriser le téléchargement</Text>
                    <Text style={styles.permissionDescription}>
                      Le médecin pourra télécharger le fichier sur son appareil
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.permissionOption}
                  onPress={() =>
                    setSharePermissions({
                      ...sharePermissions,
                      peutScreenshot: !sharePermissions.peutScreenshot,
                    })
                  }
                >
                  <View style={styles.permissionCheckbox}>
                    {sharePermissions.peutScreenshot && (
                      <Text style={styles.checkboxText}>✓</Text>
                    )}
                  </View>
                  <View style={styles.permissionTextContainer}>
                    <Text style={styles.permissionTitle}>Autoriser les captures d&apos;écran</Text>
                    <Text style={styles.permissionDescription}>
                      Le médecin pourra faire des captures d&apos;écran du document
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
                onPress={handleConfirmShare}
                disabled={uploading || !selectedMedecinId}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="share-outline" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Partager</Text>
                  </>
                )}
              </TouchableOpacity>
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
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight! + 10 : 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E3A8A",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  categoriesScroll: {
    marginHorizontal: -16,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  category: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
    gap: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  categoryTextActive: {
    color: "#fff",
  },
  countContainer: {
    padding: 16,
    paddingTop: 12,
  },
  countText: {
    color: "#6B7280",
    fontSize: 14,
  },
  recordsList: {
    flex: 1,
  },
  recordsListContent: {
    paddingTop: 0,
    paddingBottom: 24,
  },
  // Styles pour la liste de dossiers
  dossiersListContainer: {
    paddingTop: 2,
    paddingBottom: 24,
  },
  dossierCard: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    position: "relative",
    width: "100%",
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  dossierCardActions: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    gap: 8,
    zIndex: 10,
  },
  dossierCardShareBtn: {
    width: 32,
    height: 32,
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  dossierCardDeleteBtn: {
    width: 32,
    height: 32,
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  dossierCardContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 80,
  },
  dossierCardIconContainer: {
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  dossierCardTextContainer: {
    flex: 1,
  },
  dossierCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
  },
  dossierCardDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dossierCardDate: {
    fontSize: 13,
    color: "#6B7280",
  },
  // Styles pour le header du dossier sélectionné
  dossierHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563eb",
  },
  addDocumentButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E3A8A",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  addDocumentButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  dossierHeaderTitle: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  dossierHeaderTitleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  recordCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 0,
    marginBottom: 0,
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 0,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    width: "100%",
  },
  recordLeft: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
  },
  recordIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  recordDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  recordMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  recordMetaText: {
    fontSize: 12,
    color: "#6B7280",
  },
  recordActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 40,
    height: 40,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
  },
  emptyUploadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E3A8A",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 24,
  },
  emptyUploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  modalBody: {
    padding: 20,
  },
  // Form styles
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  typeOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
    gap: 8,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  typeOptionTextActive: {
    color: "#fff",
  },
  filePickerContainer: {
    flexDirection: "row",
    gap: 12,
  },
  filePickerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    padding: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  filePickerText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1E3A8A",
  },
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  filePreviewText: {
    flex: 1,
    fontSize: 14,
    color: "#065F46",
    fontWeight: "500",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E3A8A",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Detail styles
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: "#111827",
    lineHeight: 24,
  },
  detailTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    gap: 6,
  },
  detailTypeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  detailActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  detailActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E3A8A",
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  detailActionBtnSecondary: {
    backgroundColor: "#EFF6FF",
  },
  detailActionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  detailActionTextSecondary: {
    color: "#1E3A8A",
  },
  imagePreviewContainer: {
    width: "100%",
    height: 300,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  imageErrorText: {
    color: "#EF4444",
    fontSize: 14,
    textAlign: "center",
  },
  shareInfo: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    paddingVertical: 0,
  },
  clearSearchButton: {
    marginLeft: 8,
    padding: 4,
  },
  medecinsList: {
    maxHeight: 160,
    marginTop: 8,
    flexGrow: 0,
  },
  noResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
  searchHintContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  searchHintText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
    textAlign: "center",
  },
  searchHintSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
  moreResultsContainer: {
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginTop: 8,
  },
  moreResultsText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    fontStyle: "italic",
  },
  selectedMedecinContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  selectedMedecinLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  medecinOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  medecinOptionSelected: {
    backgroundColor: "#EFF6FF",
    borderColor: "#2563eb",
  },
  medecinInfo: {
    flex: 1,
  },
  medecinName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  medecinSpecialite: {
    fontSize: 14,
    color: "#6B7280",
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
  checkText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  permissionInfo: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 16,
    lineHeight: 18,
  },
  permissionOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  permissionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  checkboxText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "bold",
  },
  permissionTextContainer: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
});

