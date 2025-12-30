import React, { useState, useEffect, useRef } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { useMessage } from "../../hooks/useMessage";
import { useMedecin } from "../../hooks/useMedecin";
import { useLocalSearchParams, router } from "expo-router";
import { useUnreadMessages } from "../../contexts/UnreadMessagesContext";
import { useNotifications } from "../../contexts/NotificationContext";
import type { Message } from "../../../domain/entities/Message";
import type { Utilisateur } from "../../../domain/entities";
import type { Medecin } from "../../../domain/entities/Medecin";
import type { Connexion } from "../../../domain/entities/Connexion";

/**
 * Composant d'illustration pour l'état vide du chat
 */
function EmptyChatIllustration() {
  return (
    <View style={styles.illustrationContainer}>
      {/* Person silhouette (back view) */}
      <View style={styles.personContainer}>
        {/* Head/Hair */}
        <View style={styles.head}>
          <View style={styles.hair} />
        </View>
        {/* Body */}
        <View style={styles.body} />
        {/* Speech bubbles */}
        <View style={[styles.speechBubble, styles.bubble1]} />
        <View style={[styles.speechBubble, styles.bubble2]} />
        <View style={[styles.speechBubble, styles.bubble3]} />
        <View style={[styles.speechBubble, styles.bubble4]} />
        <View style={[styles.speechBubble, styles.bubble5]} />
        {/* Connecting lines */}
        <View style={[styles.connector, styles.connector1]} />
        <View style={[styles.connector, styles.connector2]} />
        <View style={[styles.connector, styles.connector3]} />
        <View style={[styles.connector, styles.connector4]} />
        {/* Small dots */}
        <View style={[styles.dot, styles.dot1]} />
        <View style={[styles.dot, styles.dot2]} />
      </View>
    </View>
  );
}

/**
 * Composant de présentation pour l'écran de chat
 * Utilise les hooks pour respecter l'architecture propre
 */
export function ChatScreen() {
  const authService = useAuth();
  const messageService = useMessage();
  const medecinService = useMedecin();
  const { setTotalUnread } = useUnreadMessages();
  const { showNotification } = useNotifications();
  const params = useLocalSearchParams<{ medecinId?: string }>();
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [selectedChat, setSelectedChat] = useState<string | null>(
    params.medecinId || null
  );
  const [showDoctorsModal, setShowDoctorsModal] = useState(false);
  const [doctors, setDoctors] = useState<Medecin[]>([]);
  const [connexions, setConnexions] = useState<Connexion[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [chatConfirmModalVisible, setChatConfirmModalVisible] = useState(false);
  const [chatConfirmDoctorId, setChatConfirmDoctorId] = useState<string | null>(null);
  const [chatSendingRequest, setChatSendingRequest] = useState(false);

  // Si un medecinId est passé en paramètre, charger les messages
  useEffect(() => {
    if (params.medecinId) {
      setSelectedChat(params.medecinId);
    }
  }, [params.medecinId]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Array<{
    utilisateurId: string;
    nom: string;
    dernierMessage: Message;
    nonLu: number;
  }>>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const isLoadingMessages = useRef(false);
  const isLoadingConversations = useRef(false);

  useEffect(() => {
    loadUser();
    loadConversations();
    
    // Rafraîchir les conversations automatiquement toutes les 10 secondes (réduit pour éviter les timeouts)
    const conversationsInterval = setInterval(() => {
      loadConversations(false);
    }, 10000);
    
    return () => clearInterval(conversationsInterval);
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat, false);
      
      // Rafraîchir les messages automatiquement toutes les 5 secondes (réduit pour éviter les timeouts)
      const interval = setInterval(() => {
        loadMessages(selectedChat, false);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  useEffect(() => {
    if (user?.id && showDoctorsModal) {
      loadDoctors();
      loadConnexions();
    }
  }, [showDoctorsModal, user]);

  const loadDoctors = async () => {
    setLoadingDoctors(true);
    const result = await medecinService.searchMedecins();
    if (result.ok) {
      setDoctors(result.value);
    }
    setLoadingDoctors(false);
  };

  const loadConnexions = async () => {
    if (!user?.id) return;
    const result = await medecinService.getConnexions(user.id);
    if (result.ok) {
      setConnexions(result.value);
    }
  };

  const getConnexionStatus = (medecinId: string): "connected" | "pending" | "none" => {
    const connexion = connexions.find(c => c.idMedecin === medecinId);
    if (!connexion) return "none";
    if (connexion.statut === "Accepté") return "connected";
    if (connexion.statut === "En_attente") return "pending";
    return "none";
  };

  const handleStartChatWithDoctor = async (medecinId: string) => {
    const status = getConnexionStatus(medecinId);
    if (status !== "connected") {
      setChatConfirmDoctorId(medecinId);
      setChatConfirmModalVisible(true);
      return;
    }
    setShowDoctorsModal(false);
    setSelectedChat(medecinId);
  };

  const sendChatConnexionRequest = async () => {
    if (!chatConfirmDoctorId) return;
    setChatSendingRequest(true);
    const result = await medecinService.sendConnexionRequest(chatConfirmDoctorId);
    setChatSendingRequest(false);
    if (result.ok) {
      showNotification({ type: 'success', title: 'Demande envoyée', message: 'Votre demande de connexion a été envoyée avec succès', autoClose: true });
      await loadConnexions();
      setChatConfirmModalVisible(false);
      setChatConfirmDoctorId(null);
    } else {
      showNotification({ type: 'error', title: 'Erreur', message: result.error || "Impossible d'envoyer la demande" });
    }
  };

  const loadUser = async () => {
    try {
    const result = await authService.getProfile();
    if (result.ok) {
      setUser(result.value);
      } else {
        console.error("[ChatScreen] loadUser error:", result.error);
      }
    } catch (error: any) {
      console.error("[ChatScreen] loadUser exception:", error);
    }
  };

  const loadConversations = async (showLoading: boolean = true) => {
    // Éviter les requêtes simultanées
    if (isLoadingConversations.current) {
      console.log(`[ChatScreen] Chargement conversations déjà en cours, ignoré`);
      return;
    }
    
    isLoadingConversations.current = true;
    
    if (showLoading) {
    setLoading(true);
    }
    try {
    const result = await messageService.getConversations();
    if (result.ok) {
        console.log(`[ChatScreen] ${result.value.length} conversations chargées`);
        const previousUnread = conversations.reduce((sum, conv) => sum + conv.nonLu, 0);
      setConversations(result.value);
        
        // Calculer le total de messages non lus et mettre à jour le contexte
        const totalUnread = result.value.reduce((sum, conv) => sum + conv.nonLu, 0);
        setTotalUnread(totalUnread);
        
        // Afficher une notification si de nouveaux messages sont arrivés
        if (totalUnread > previousUnread && !showLoading) {
          const newMessagesCount = totalUnread - previousUnread;
          showNotification({
            type: 'info',
            title: `${newMessagesCount} nouveau${newMessagesCount > 1 ? 'x' : ''} message${newMessagesCount > 1 ? 's' : ''}`,
            message: `Vous avez ${newMessagesCount} nouveau${newMessagesCount > 1 ? 'x' : ''} message${newMessagesCount > 1 ? 's' : ''} non lu${newMessagesCount > 1 ? 's' : ''}`,
            autoClose: true,
            autoCloseDelay: 4000,
          });
        }
    } else {
        console.error("[ChatScreen] loadConversations error:", result.error);
        // Ne pas afficher d'alerte lors du rafraîchissement automatique
        if (showLoading) {
        showNotification({
          type: 'error',
          title: 'Erreur',
          message: result.error || "Impossible de charger les conversations",
        });
        }
    }
    } catch (error: any) {
      console.error("[ChatScreen] loadConversations exception:", error);
      // Ne pas afficher d'alerte lors du rafraîchissement automatique
      if (showLoading) {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: error.message || "Une erreur est survenue lors du chargement des conversations",
      });
      }
    } finally {
      isLoadingConversations.current = false;
      if (showLoading) {
    setLoading(false);
    }
    }
  };

  const loadMessages = async (autreUtilisateurId: string, scrollToBottom: boolean = false) => {
    // Éviter les requêtes simultanées
    if (isLoadingMessages.current) {
      console.log(`[ChatScreen] Chargement messages déjà en cours, ignoré`);
      return;
    }
    
    isLoadingMessages.current = true;
    console.log(`[ChatScreen] Chargement messages avec ID: ${autreUtilisateurId}`);
    
    try {
    const result = await messageService.getConversation(autreUtilisateurId);
    if (result.ok) {
        console.log(`[ChatScreen] ${result.value.length} messages reçus`);
      setMessages(result.value);
        
        // Marquer tous les messages non lus comme lus lorsque la conversation est ouverte
        if (user?.id) {
          const unreadMessages = result.value.filter(
            (msg) => !msg.lu && msg.destinataireId === user.id
          );
          
          // Marquer chaque message non lu comme lu
          for (const message of unreadMessages) {
            try {
              await messageService.markAsRead(message.id);
            } catch (error) {
              console.error(`[ChatScreen] Erreur lors du marquage du message ${message.id} comme lu:`, error);
            }
          }
          
          // Recharger les conversations pour mettre à jour les compteurs
          if (unreadMessages.length > 0) {
            await loadConversations(false);
          }
        }
        
        // Scroll vers le bas après le chargement si demandé
        if (scrollToBottom && flatListRef.current) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 300);
        }
    } else {
        console.error(`[ChatScreen] Erreur chargement messages: ${result.error}`);
        // Ne pas afficher d'alerte à chaque rafraîchissement automatique
        if (!selectedChat) {
          Alert.alert("Erreur", result.error || "Impossible de charger les messages");
        }
      }
    } finally {
      isLoadingMessages.current = false;
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChat) return;

    const messageText = messageInput.trim();
    setMessageInput(""); // Vider le champ immédiatement pour une meilleure UX

    // Ajouter le message optimiste à l'interface (affichage immédiat)
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      emetteurId: user?.id || "",
      destinataireId: selectedChat,
      contenu: messageText,
      dateEnvoi: new Date().toISOString(),
      lu: false,
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    const result = await messageService.send(selectedChat, messageText);
    if (result.ok) {
      // Recharger les messages pour avoir la version réelle du serveur et scroller vers le bas
      await loadMessages(selectedChat, true);
      await loadConversations();
    } else {
      // En cas d'erreur, retirer le message optimiste et remettre le texte
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
      setMessageInput(messageText); // Remettre le texte pour que l'utilisateur puisse réessayer
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: result.error || "Impossible d'envoyer le message",
      });
    }
  };

  // Filtrer les conversations par nom ou mot-clé dans les messages
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const nomMatch = c.nom.toLowerCase().includes(query);
    const messageMatch = c.dernierMessage.contenu.toLowerCase().includes(query);
    
    return nomMatch || messageMatch;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // Liste des conversations
  if (!selectedChat) {
    return (
      <View style={styles.container}>
        <View style={styles.messagesHeader}>
          <Text style={styles.messagesTitle}>Messages</Text>
        </View>
        
        {/* Barre de recherche */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une conversation..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery("")}
              >
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {filteredConversations.length > 0 ? (
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => item.utilisateurId}
            contentContainerStyle={styles.conversationsList}
            renderItem={({ item }) => {
              const messageDate = new Date(item.dernierMessage.dateEnvoi);
              const now = new Date();
              const diffMs = now.getTime() - messageDate.getTime();
              const diffMins = Math.floor(diffMs / 60000);
              const diffHours = Math.floor(diffMs / 3600000);
              const diffDays = Math.floor(diffMs / 86400000);
              
              let timeText = "";
              if (diffMins < 1) {
                timeText = "À l'instant";
              } else if (diffMins < 60) {
                timeText = `${diffMins} min`;
              } else if (diffHours < 24) {
                timeText = `${diffHours} h`;
              } else if (diffDays < 7) {
                timeText = `${diffDays} j`;
              } else {
                timeText = messageDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
              }

              return (
              <TouchableOpacity
                onPress={() => setSelectedChat(item.utilisateurId)}
                style={styles.convItem}
                  activeOpacity={0.7}
              >
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {item.nom.charAt(0).toUpperCase()}
                  </Text>
                </View>

                  <View style={styles.convContent}>
                  <View style={styles.convHeader}>
                      <Text style={styles.convName} numberOfLines={1}>{item.nom}</Text>
                      <Text style={styles.convTime}>{timeText}</Text>
                  </View>

                  <View style={styles.convBottom}>
                    <Text style={styles.convLast} numberOfLines={1}>
                      {item.dernierMessage.contenu}
                    </Text>
                    {item.nonLu > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.nonLu}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
              );
            }}
          />
        ) : (
          <View style={styles.emptyConversations}>
            <EmptyChatIllustration />
            <Text style={styles.emptyInstructionText}>
              Une fois que vous commencerez une nouvelle conversation, elle apparaîtra ici
            </Text>
          </View>
        )}

        {/* FAB pour créer une nouvelle conversation */}
              <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowDoctorsModal(true)}
          activeOpacity={0.8}
              >
          <Ionicons name="add" size={28} color="#FFFFFF" />
              </TouchableOpacity>

        {/* Modal pour sélectionner un médecin */}
        <Modal
          visible={showDoctorsModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowDoctorsModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner un médecin</Text>
              <TouchableOpacity
                onPress={() => setShowDoctorsModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#1E3A8A" />
              </TouchableOpacity>
            </View>

            {loadingDoctors ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#1E3A8A" />
              </View>
            ) : doctors.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Ionicons name="medical-outline" size={64} color="#9CA3AF" />
                <Text style={styles.modalEmptyText}>Aucun médecin disponible</Text>
                <Text style={styles.modalEmptySubtext}>
                  Les médecins apparaîtront ici une fois disponibles
                </Text>
              </View>
            ) : (
              <FlatList
                data={doctors}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.modalList}
                renderItem={({ item }) => {
                  const status = getConnexionStatus(item.id);
                  return (
                    <TouchableOpacity
                      style={styles.doctorItem}
                      onPress={() => handleStartChatWithDoctor(item.id)}
                    >
                      <View style={styles.doctorAvatar}>
                        <Ionicons name="person" size={32} color="#1E3A8A" />
                      </View>
                      <View style={styles.doctorInfo}>
                        <Text style={styles.doctorName}>{item.nom}</Text>
                        <Text style={styles.doctorSpecialty}>{item.specialite}</Text>
                      </View>
                      <View style={styles.doctorAction}>
                        {status === "connected" ? (
                          <Ionicons name="chatbubble" size={24} color="#10B981" />
                        ) : status === "pending" ? (
                          <Ionicons name="time" size={24} color="#F59E0B" />
                        ) : (
                          <Ionicons name="person-add" size={24} color="#6B7280" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </Modal>

        {/* Confirmation modal for starting chat (send connexion request) */}
        <Modal
          visible={chatConfirmModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setChatConfirmModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Demande de connexion</Text>
                <TouchableOpacity onPress={() => setChatConfirmModalVisible(false)} style={styles.modalCloseButton}>
                  <Ionicons name="close" size={24} color="#111827" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBodyInner}>
                <Text style={styles.modalMessage}>Voulez-vous envoyer une demande de connexion à ce médecin ?</Text>
              </View>

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#E5E7EB' }]} onPress={() => setChatConfirmModalVisible(false)} disabled={chatSendingRequest}>
                  <Text style={[styles.modalButtonText, { color: '#374151' }]}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#1E3A8A' }]} onPress={sendChatConnexionRequest} disabled={chatSendingRequest}>
                  {chatSendingRequest ? <ActivityIndicator color="#fff" /> : <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Envoyer</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Discussion
  const currentChat = conversations.find((c) => c.utilisateurId === selectedChat);

  // Grouper les messages par date
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    messages.forEach((msg) => {
      const date = new Date(msg.dateEnvoi);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dateKey = "";
      if (date.toDateString() === today.toDateString()) {
        dateKey = "Aujourd'hui";
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = "Hier";
      } else {
        dateKey = date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });
    
    // Trier les messages dans chaque groupe par date (croissante : plus anciens en premier)
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => {
        return new Date(a.dateEnvoi).getTime() - new Date(b.dateEnvoi).getTime();
      });
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);
  // Trier les dates : plus anciennes en premier, plus récentes en dernier
  const sortedDates = Object.keys(messageGroups).sort((a, b) => {
    // Aujourd'hui doit être en dernier (en bas)
    if (a === "Aujourd'hui" && b !== "Aujourd'hui") return 1;
    if (b === "Aujourd'hui" && a !== "Aujourd'hui") return -1;
    // Hier doit être avant Aujourd'hui mais après les autres dates
    if (a === "Hier" && b === "Aujourd'hui") return -1;
    if (b === "Hier" && a === "Aujourd'hui") return 1;
    if (a === "Hier" && b !== "Aujourd'hui" && b !== "Hier") return 1;
    if (b === "Hier" && a !== "Aujourd'hui" && a !== "Hier") return -1;
    // Pour les autres dates, trier chronologiquement (plus anciennes en premier)
    try {
      const dateA = new Date(a);
      const dateB = new Date(b);
      if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
        return dateA.getTime() - dateB.getTime();
      }
    } catch (e) {
      // Ignorer les erreurs de parsing
    }
    return a.localeCompare(b);
  });

  return (
    <View style={styles.chatContainer}>
      <View style={styles.chatHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setSelectedChat(null)}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={styles.avatarHeader}>
            <Text style={styles.avatarHeaderText}>
              {currentChat?.nom.charAt(0).toUpperCase() || "M"}
            </Text>
          </View>
            <Text style={styles.headerName}>
              {currentChat?.nom || "Médecin"}
            </Text>
        </View>

        <TouchableOpacity style={styles.infoButton}>
          <Ionicons name="information-circle-outline" size={24} color="#111827" />
          </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={sortedDates}
        keyExtractor={(date) => date}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => {
          // Scroll automatique vers le bas quand de nouveaux messages sont ajoutés
          if (messages.length > 0) {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        }}
        renderItem={({ item: dateKey }) => (
          <View>
            <View style={styles.dateSeparator}>
              <Text style={styles.dateSeparatorText}>{dateKey}</Text>
            </View>
            {messageGroups[dateKey].map((item) => {
          const isUser = item.emetteurId === user?.id;
          const messageTime = new Date(item.dateEnvoi).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          });
          
          return (
            <View
                  key={item.id}
              style={[
                styles.msgContainer,
                isUser ? styles.msgRight : styles.msgLeft,
              ]}
            >
              <View
                style={[
                  styles.msgBubble,
                  isUser ? styles.msgBubbleUser : styles.msgBubbleDoctor,
                ]}
              >
                <Text style={isUser ? styles.msgText : styles.msgTextDoctor}>
                  {item.contenu}
                </Text>
                <Text
                  style={[
                    styles.msgTime,
                    isUser ? styles.msgTimeUser : styles.msgTimeDoctor,
                  ]}
                >
                  {messageTime}
                </Text>
              </View>
            </View>
          );
            })}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyMessages}>
            <Text style={styles.emptyMessagesText}>Aucun message</Text>
            <Text style={styles.emptyMessagesSub}>Commencez la conversation</Text>
          </View>
        }
      />

      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="add-circle" size={28} color="#1E3A8A" />
        </TouchableOpacity>

        <View style={styles.textInputContainer}>
          <TextInput
            placeholder="Message..."
            value={messageInput}
            onChangeText={setMessageInput}
            style={styles.textInput}
            placeholderTextColor="#9CA3AF"
            multiline
          />
        </View>

        <TouchableOpacity style={styles.emojiButton}>
          <Ionicons name="happy-outline" size={24} color="#6B7280" />
        </TouchableOpacity>

        {messageInput.trim() ? (
          <TouchableOpacity onPress={handleSendMessage} style={styles.sendBtn}>
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.micButton}>
            <Ionicons name="mic" size={24} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  messagesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight! + 16 : 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  messagesTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  searchIconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBarContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    paddingVertical: 0,
  },
  clearSearchButton: {
    padding: 4,
  },
  conversationsList: {
    paddingBottom: 100,
  },
  convItem: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1E3A8A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  convContent: {
    flex: 1,
    justifyContent: "center",
  },
  convHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  convName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  convTime: {
    fontSize: 13,
    color: "#9CA3AF",
    marginLeft: 8,
  },
  convBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  convLast: {
    color: "#6B7280",
    fontSize: 14,
    flex: 1,
  },
  badge: {
    backgroundColor: "#1E3A8A",
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1E3A8A",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  chatHeader: {
    flexDirection: "row",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight! + 10 : 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerInfo: { 
    flexDirection: "row", 
    alignItems: "center", 
    flex: 1,
    gap: 12,
  },
  avatarHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1E3A8A",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarHeaderText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerName: { 
    fontSize: 17, 
    fontWeight: "600",
    color: "#111827",
  },
  infoButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  dateSeparator: {
    alignItems: "center",
    marginVertical: 16,
  },
  dateSeparatorText: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  msgContainer: {
    marginVertical: 6,
    flexDirection: "row",
  },
  msgLeft: { 
    justifyContent: "flex-start",
  },
  msgRight: { 
    justifyContent: "flex-end",
  },
  msgBubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  msgBubbleUser: {
    backgroundColor: "#1E3A8A",
    borderBottomRightRadius: 4,
    borderTopRightRadius: 16,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  msgBubbleDoctor: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    borderTopRightRadius: 16,
    borderTopLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  msgTextDoctor: {
    color: "#111827",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "400",
  },
  msgText: { 
    color: "#fff",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "400",
  },
  msgTime: { 
    fontSize: 11, 
    marginTop: 4,
    fontWeight: "400",
  },
  msgTimeUser: { color: "#93C5FD" },
  msgTimeDoctor: { color: "#6B7280" },
  inputBar: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    alignItems: "center",
    gap: 8,
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 40,
    maxHeight: 100,
    justifyContent: "center",
  },
  textInput: {
    fontSize: 15,
    color: "#111827",
    paddingVertical: 0,
    textAlignVertical: "center",
  },
  emojiButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  micButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtn: {
    backgroundColor: "#1E3A8A",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyMessages: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyMessagesText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  emptyMessagesSub: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  emptyConversations: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 60,
    backgroundColor: "#FFFFFF",
  },
  illustrationContainer: {
    width: 200,
    height: 200,
    marginBottom: 24,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  personContainer: {
    width: 120,
    height: 160,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  head: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1E3A8A",
    position: "absolute",
    top: 0,
    zIndex: 2,
  },
  hair: {
    width: 60,
    height: 40,
    backgroundColor: "#1E3A8A",
    borderRadius: 30,
    position: "absolute",
    top: -10,
    left: -5,
  },
  body: {
    width: 60,
    height: 100,
    backgroundColor: "transparent",
    borderWidth: 3,
    borderColor: "#1E3A8A",
    borderRadius: 30,
    position: "absolute",
    top: 45,
    zIndex: 1,
  },
  speechBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#1E3A8A",
    backgroundColor: "transparent",
    position: "absolute",
  },
  bubble1: {
    top: 20,
    left: -40,
    width: 25,
    height: 25,
  },
  bubble2: {
    top: 30,
    right: -45,
    width: 28,
    height: 28,
  },
  bubble3: {
    top: 70,
    left: -50,
    width: 22,
    height: 22,
  },
  bubble4: {
    top: 80,
    right: -48,
    width: 26,
    height: 26,
  },
  bubble5: {
    top: 120,
    left: -35,
    width: 24,
    height: 24,
  },
  connector: {
    height: 2,
    backgroundColor: "#1E3A8A",
    position: "absolute",
  },
  connector1: {
    width: 35,
    top: 35,
    left: -35,
  },
  connector2: {
    width: 40,
    top: 40,
    right: -40,
  },
  connector3: {
    width: 45,
    top: 85,
    left: -45,
  },
  connector4: {
    width: 43,
    top: 90,
    right: -43,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#1E3A8A",
    position: "absolute",
  },
  dot1: {
    top: 50,
    left: -60,
  },
  dot2: {
    top: 60,
    right: -65,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 24,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  emptyInstructionText: {
    fontSize: 15,
    color: "#374151",
    marginTop: 16,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  emptyActions: {
    position: "absolute",
    bottom: 40,
    right: 20,
    alignItems: "flex-end",
    gap: 12,
  },
  secondaryFab: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  startChatButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  startChatText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight! + 10 : 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  modalEmptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
    textAlign: "center",
  },
  modalEmptySubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
  },
  modalList: {
    padding: 16,
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
  doctorItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  doctorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: "#6B7280",
  },
  doctorAction: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    color: "#1E3A8A",
  },
});

