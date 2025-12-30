import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { WEBSOCKET_CONFIG } from '../config/websocket.config';

/**
 * Types d'événements WebSocket
 */
export enum WebSocketEventType {
  MESSAGE = 'message',
  RENDEZ_VOUS = 'rendez-vous',
  DISPONIBILITE = 'disponibilite',
  CONNEXION = 'connexion',
  NOTIFICATION = 'notification',
  ERROR = 'error',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
}

/**
 * Interface pour les événements WebSocket
 */
export interface WebSocketEvent {
  type: WebSocketEventType;
  data: any;
  timestamp?: number;
}

/**
 * Service WebSocket pour la communication en temps réel
 */
@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private eventSubject = new Subject<WebSocketEvent>();
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private serverUnavailable = false; // Flag pour indiquer que le serveur n'est pas disponible
  private lastCloseCode: number | null = null; // Code de fermeture pour détecter les erreurs 404

  public events$ = this.eventSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  constructor() {
    // Écouter les changements de visibilité de la page pour reconnecter
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !this.isConnected()) {
          this.connect();
        }
      });
    }
  }

  /**
   * Se connecter au serveur WebSocket
   */
  connect(): void {
    // Vérifier si le WebSocket est désactivé ou si le serveur n'est pas disponible
    if (!WEBSOCKET_CONFIG.ENABLED || this.serverUnavailable) {
      console.log('🔌 WebSocket désactivé ou serveur non disponible');
      return;
    }

    if (this.isConnected()) {
      console.log('🔌 WebSocket déjà connecté');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('⚠️ Pas de token d\'authentification, connexion WebSocket annulée');
      return;
    }

    try {
      const wsUrl = `${WEBSOCKET_CONFIG.URL}?token=${encodeURIComponent(token)}`;
      console.log('🔌 Connexion WebSocket...', wsUrl);

      this.socket = new WebSocket(wsUrl);

      // Timeout pour détecter les erreurs de connexion rapidement
      const connectionTimeout = setTimeout(() => {
        if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
          console.warn('⚠️ Timeout de connexion WebSocket. Le serveur semble indisponible.');
          if (this.reconnectAttempts === 0) {
            this.serverUnavailable = true;
            console.warn('⚠️ WebSocket désactivé: serveur non disponible');
          }
          if (this.socket) {
            this.socket.close();
          }
        }
      }, 5000); // 5 secondes de timeout

      this.socket.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('✅ WebSocket connecté');
        this.reconnectAttempts = 0;
        this.serverUnavailable = false; // Réinitialiser le flag si la connexion réussit
        this.connectionStatusSubject.next(true);
        this.startHeartbeat();
        this.eventSubject.next({
          type: WebSocketEventType.CONNECTED,
          data: { message: 'Connexion établie' },
          timestamp: Date.now()
        });
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 Message WebSocket reçu:', message);
          
          this.eventSubject.next({
            type: message.type || WebSocketEventType.MESSAGE,
            data: message.data || message,
            timestamp: Date.now()
          });
        } catch (error) {
          console.error('❌ Erreur lors du parsing du message WebSocket:', error);
        }
      };

      this.socket.onerror = (error) => {
        clearTimeout(connectionTimeout);
        // Ne pas logger d'erreur bruyante si c'est juste que le serveur n'existe pas
        if (this.reconnectAttempts === 0) {
          console.warn('⚠️ Erreur WebSocket lors de la première connexion. Le serveur WebSocket n\'est peut-être pas encore disponible.');
          // Marquer le serveur comme indisponible pour éviter les tentatives infinies
          this.serverUnavailable = true;
        } else {
          console.error('❌ Erreur WebSocket:', error);
        }
        this.eventSubject.next({
          type: WebSocketEventType.ERROR,
          data: { error: 'Erreur de connexion WebSocket' },
          timestamp: Date.now()
        });
      };

      this.socket.onclose = (event) => {
        clearTimeout(connectionTimeout);
        this.lastCloseCode = event.code;
        
        // Détecter les erreurs de connexion (code 1006 = connexion fermée anormalement)
        // Si c'est la première tentative et que la connexion échoue rapidement, c'est probablement un 404
        const isConnectionError = event.code === 1006 || event.code === 1002 || event.code === 1003 || !event.wasClean;
        
        if (isConnectionError && this.reconnectAttempts === 0) {
          // Première tentative avec erreur, probablement le serveur n'existe pas
          console.warn('⚠️ Serveur WebSocket non disponible. WebSocket désactivé pour éviter les tentatives infinies.');
          this.serverUnavailable = true;
          this.connectionStatusSubject.next(false);
          this.stopHeartbeat();
          return; // Ne pas tenter de reconnexion
        }

        console.log('🔌 WebSocket déconnecté', { code: event.code, reason: event.reason, wasClean: event.wasClean });
        this.connectionStatusSubject.next(false);
        this.stopHeartbeat();
        this.eventSubject.next({
          type: WebSocketEventType.DISCONNECTED,
          data: { message: 'Connexion fermée', code: event.code },
          timestamp: Date.now()
        });

        // Tentative de reconnexion automatique seulement si le serveur est disponible
        if (!this.serverUnavailable) {
          this.attemptReconnect();
        }
      };
    } catch (error) {
      console.error('❌ Erreur lors de la création de la connexion WebSocket:', error);
    }
  }

  /**
   * Se déconnecter du serveur WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.stopHeartbeat();
      this.socket.close();
      this.socket = null;
      this.reconnectAttempts = 0;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    }
  }

  /**
   * Envoyer un message via WebSocket
   */
  send(type: WebSocketEventType, data: any): void {
    // Si le serveur n'est pas disponible, ne pas essayer d'envoyer
    if (this.serverUnavailable) {
      console.log('🔌 WebSocket non disponible, message non envoyé:', type);
      return;
    }

    if (!this.isConnected()) {
      // Ne pas tenter de connexion si le serveur n'est pas disponible
      if (this.serverUnavailable) {
        console.log('🔌 WebSocket non disponible, message non envoyé:', type);
        return;
      }
      
      console.warn('⚠️ WebSocket non connecté, tentative de connexion...');
      this.connect();
      // Attendre un peu avant d'envoyer
      setTimeout(() => {
        if (this.isConnected()) {
          this.send(type, data);
        } else {
          console.log('⚠️ Impossible d\'envoyer le message, WebSocket non connecté');
        }
      }, 1000);
      return;
    }

    try {
      const message = {
        type,
        data,
        timestamp: Date.now()
      };
      this.socket!.send(JSON.stringify(message));
      console.log('📤 Message WebSocket envoyé:', message);
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message WebSocket:', error);
    }
  }

  /**
   * S'abonner à un type d'événement spécifique
   */
  onEvent(type: WebSocketEventType): Observable<WebSocketEvent> {
    return new Observable(observer => {
      const subscription = this.events$.subscribe(event => {
        if (event.type === type) {
          observer.next(event);
        }
      });
      return () => subscription.unsubscribe();
    });
  }

  /**
   * Vérifier si la connexion est active
   */
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Tentative de reconnexion automatique
   */
  private attemptReconnect(): void {
    // Ne pas tenter de reconnexion si le serveur n'est pas disponible
    if (this.serverUnavailable) {
      console.log('🔌 Reconnexion annulée: serveur non disponible');
      return;
    }

    if (this.reconnectAttempts >= WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      console.warn('⚠️ Nombre maximum de tentatives de reconnexion atteint. WebSocket désactivé.');
      this.serverUnavailable = true;
      return;
    }

    this.reconnectAttempts++;
    const delay = WEBSOCKET_CONFIG.RECONNECT_INTERVAL * this.reconnectAttempts;

    console.log(`🔄 Tentative de reconnexion ${this.reconnectAttempts}/${WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS} dans ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Démarrer le heartbeat pour maintenir la connexion active
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send(WebSocketEventType.CONNEXION, { type: 'heartbeat' });
      }
    }, WEBSOCKET_CONFIG.HEARTBEAT_INTERVAL);
  }

  /**
   * Arrêter le heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

