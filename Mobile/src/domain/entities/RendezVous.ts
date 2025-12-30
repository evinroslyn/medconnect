import type { StatusRV } from "../enums";

/**
 * Entité représentant un rendez-vous
 */
export interface RendezVous {
  readonly id: string;
  readonly patientId: string;
  readonly medecinId: string;
  readonly date: string; // ISO datetime string
  readonly motif: string;
  readonly statut: StatusRV;
}

