/**
 * Entité représentant un message entre utilisateurs
 */
export interface Message {
  readonly id: string;
  readonly emetteurId: string;
  readonly destinataireId: string;
  readonly contenu: string;
  readonly dateEnvoi: string; // ISO datetime string
  readonly lu: boolean;
}

