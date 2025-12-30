import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService, SendMessageData } from '@/application/services/message.service';
import { PatientService } from '@/application/services/patient.service';
import { AuthService } from '@/application/services/auth.service';
import { Message, Conversation, Patient } from '@/domain/models';

/**
 * Composant de messagerie sécurisée pour les médecins
 */
@Component({
  selector: 'app-medecin-chat',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class MedecinChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;
  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  messages: Message[] = [];
  newMessage: string = '';
  loading = false;
  error: string | null = null;
  patientInfo: Patient | null = null;
  currentUserId: string | null = null;
  currentUser: any = null;
  userProfile: any = null;
  private shouldScrollToBottom = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private patientService: PatientService,
    private authService: AuthService
  ) {
    const currentUser = this.authService.getCurrentUser();
    this.currentUserId = currentUser?.id || null;
    this.currentUser = currentUser;
  }

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadConversations();

    // Si un patientId est fourni dans la route, charger la conversation
    this.route.params.subscribe(params => {
      const patientId = params['patientId'];
      if (patientId) {
        this.selectConversationByPatientId(patientId);
      }
    });
  }

  /**
   * Charge toutes les conversations
   */
  loadConversations(): void {
    this.loading = true;
    this.messageService.getConversations().subscribe({
      next: (conversations: Conversation[]) => {
        this.conversations = conversations;
        this.loading = false;
      },
      error: (err: Error) => {
        this.error = err.message || 'Erreur lors du chargement des conversations';
        this.loading = false;
      }
    });
  }

  /**
   * Sélectionne une conversation par ID de patient
   */
  selectConversationByPatientId(patientId: string): void {
    // Vérifier si la conversation existe déjà
    const existingConversation = this.conversations.find(c => c.utilisateurId === patientId);
    if (existingConversation) {
      this.selectConversation(existingConversation);
      return;
    }

    // Charger les informations du patient
    this.patientService.getPatientProfile(patientId).subscribe({
      next: (patient: Patient) => {
        this.patientInfo = patient;
        // Créer une conversation temporaire si elle n'existe pas
        this.selectedConversation = {
          utilisateurId: patientId,
          nom: patient.nom,
          dernierMessage: {
            id: '',
            emetteurId: '',
            destinataireId: '',
            contenu: '',
            dateEnvoi: new Date().toISOString(),
            lu: false
          },
          nonLu: 0
        };
        this.loadMessages(patientId);
      },
      error: (err: Error) => {
        this.error = err.message || 'Erreur lors du chargement du patient';
      }
    });
  }

  /**
   * Sélectionne une conversation
   */
  selectConversation(conversation: Conversation): void {
    this.selectedConversation = conversation;
    this.patientInfo = null; // Réinitialiser les infos du patient
    this.loadMessages(conversation.utilisateurId);
  }

  /**
   * Charge les messages d'une conversation
   */
  loadMessages(patientId: string): void {
    this.loading = true;
    this.messageService.getConversation(patientId).subscribe({
      next: (messages: Message[]) => {
        this.messages = messages;
        this.loading = false;

        // Charger les infos du patient si pas déjà chargées
        if (!this.patientInfo) {
          this.patientService.getPatientProfile(patientId).subscribe({
            next: (patient: Patient) => {
              this.patientInfo = patient;
            },
            error: () => {
              // Ignorer l'erreur, on peut continuer sans les infos du patient
            }
          });
        }

        // Marquer les messages comme lus (seulement ceux reçus, pas ceux envoyés)
        messages.forEach((msg: Message) => {
          // Ne marquer comme lu que les messages reçus (où l'utilisateur est le destinataire)
          if (!msg.confirmationDeLecture && msg.destinataireId === this.currentUserId) {
            this.messageService.markAsRead(msg.id).subscribe({
              error: (err) => {
                // Ignorer les erreurs de marquage comme lu (peut arriver si le message a déjà été marqué)
                console.warn('Erreur lors du marquage du message comme lu:', err);
              }
            });
          }
        });
        
        // Scroller vers le bas après le chargement
        this.shouldScrollToBottom = true;
      },
      error: (err: Error) => {
        this.error = err.message || 'Erreur lors du chargement des messages';
        this.loading = false;
      }
    });
  }

  /**
   * Calcule le total de messages non lus
   */
  getTotalUnread(): number {
    return this.conversations.reduce((sum, c) => sum + c.nonLu, 0);
  }

  /**
   * Vérifie si un message vient du médecin actuel
   */
  isMessageFromMe(message: Message): boolean {
    return message.emetteurId === this.currentUserId;
  }

  /**
   * Scroll automatique vers le bas après chaque mise à jour de la vue
   */
  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom && this.messagesContainer) {
      const container = this.messagesContainer.nativeElement;
      if (container) {
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
          this.shouldScrollToBottom = false;
        }, 100);
      }
    }
  }

  /**
   * Envoie un message
   */
  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedConversation) {
      return;
    }

    const messageText = this.newMessage.trim();
    this.newMessage = ''; // Vider le champ immédiatement

    // Ajouter le message optimiste à l'interface
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      emetteurId: this.currentUserId || '',
      destinataireId: this.selectedConversation.utilisateurId,
      contenu: messageText,
      dateEnvoi: new Date().toISOString(),
      lu: false
    };
    this.messages.push(optimisticMessage);

    const messageData: SendMessageData = {
      destinataireId: this.selectedConversation.utilisateurId,
      contenu: messageText
    };

    this.loading = true;
    this.messageService.sendMessage(messageData).subscribe({
      next: (message: Message) => {
        // Remplacer le message optimiste par le message réel
        const index = this.messages.findIndex(m => m.id === optimisticMessage.id);
        if (index !== -1) {
          this.messages[index] = message;
        } else {
        this.messages.push(message);
        }
        this.loading = false;
        // Recharger les conversations pour mettre à jour le dernier message
        this.loadConversations();
        // Recharger les messages pour avoir l'ordre correct et scroller vers le bas
        this.loadMessages(this.selectedConversation!.utilisateurId);
        this.shouldScrollToBottom = true;
      },
      error: (err: Error) => {
        // Retirer le message optimiste en cas d'erreur
        this.messages = this.messages.filter(m => m.id !== optimisticMessage.id);
        this.newMessage = messageText; // Remettre le texte
        this.error = err.message || 'Erreur lors de l\'envoi du message';
        this.loading = false;
      }
    });
  }

  /**
   * Charge le profil complet de l'utilisateur pour obtenir photoProfil
   */
  loadUserProfile(): void {
    this.authService.getProfile().subscribe({
      next: (response: any) => {
        if (response.success && response.user) {
          this.userProfile = response.user;
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement du profil:', error);
      }
    });
  }

  /**
   * Obtient l'URL complète d'un document
   */
  getDocumentUrl(documentPath: string | undefined): string {
    if (!documentPath) {
      return '';
    }
    if (documentPath.startsWith('http://') || documentPath.startsWith('https://')) {
      return documentPath;
    }
    if (documentPath.startsWith('/uploads/')) {
      return `http://localhost:3000${documentPath}`;
    }
    return `http://localhost:3000/uploads/${documentPath}`;
  }
}

