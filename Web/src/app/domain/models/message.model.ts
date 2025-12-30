/**
 * Modèle pour un message (format backend)
 */
export interface Message {
  id: string;
  emetteurId: string;
  destinataireId: string;
  contenu: string;
  dateEnvoi: string | Date;
  lu?: boolean;
  confirmationDeLecture?: boolean; // Alias pour compatibilité
}

/**
 * Modèle pour une conversation (format backend)
 */
export interface Conversation {
  utilisateurId: string;
  nom: string;
  dernierMessage: {
    id: string;
    contenu: string;
    dateEnvoi: string | Date;
    emetteurId: string;
    destinataireId: string;
    lu: boolean;
  };
  nonLu: number;
}

