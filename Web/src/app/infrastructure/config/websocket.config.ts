/**
 * Configuration WebSocket
 */
export const WEBSOCKET_CONFIG = {
  URL: 'ws://localhost:3000',
  RECONNECT_INTERVAL: 3000, // 3 secondes
  MAX_RECONNECT_ATTEMPTS: 3, // Réduit à 3 tentatives
  HEARTBEAT_INTERVAL: 30000, // 30 secondes
  ENABLED: true, // Peut être désactivé si le serveur WebSocket n'est pas disponible
} as const;

