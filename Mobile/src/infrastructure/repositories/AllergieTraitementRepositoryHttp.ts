import { httpClient } from "../http/httpClient";
import { AllergieTraitementRepository } from "../../domain/repositories/AllergieTraitementRepository";
import { Allergie } from "../../domain/entities/Allergie";
import { Traitement } from "../../domain/entities/Traitement";
import type { Result } from "../../shared/types/Result";
import { ok, err } from "../../shared/types/Result";

/**
 * Implémentation HTTP du repository pour les allergies et traitements
 */
export class AllergieTraitementRepositoryHttp implements AllergieTraitementRepository {
  async getAllergiesByPatient(idPatient: string): Promise<Result<Allergie[]>> {
    try {
      const result = await httpClient.get<{ success: boolean; data: Allergie[] }>(
        `/patients/${idPatient}/allergies`
      );

      if (!result.ok) {
        return result;
      }

      const allergies = result.value.data.map(
        (a: any) =>
          new Allergie(
            a.id,
            a.nom,
            a.idDossierMedical,
            a.idPatient,
            a.description,
            a.dateDecouverte ? new Date(a.dateDecouverte) : undefined
          )
      );

      return ok(allergies);
    } catch (error: any) {
      return err(error.message || "Erreur lors de la récupération des allergies");
    }
  }

  async addAllergie(
    idPatient: string,
    nom: string,
    description?: string,
    dateDecouverte?: Date
  ): Promise<Result<Allergie>> {
    try {
      const result = await httpClient.post<{ success: boolean; data: Allergie }>(
        `/patients/${idPatient}/allergies`,
        {
          nom,
          description,
          dateDecouverte: dateDecouverte?.toISOString(),
        }
      );

      if (!result.ok) {
        return result;
      }

      const a = result.value.data;
      const allergie = new Allergie(
        a.id,
        a.nom,
        a.idDossierMedical,
        a.idPatient,
        a.description,
        a.dateDecouverte ? new Date(a.dateDecouverte) : undefined
      );

      return ok(allergie);
    } catch (error: any) {
      return err(error.message || "Erreur lors de l'ajout de l'allergie");
    }
  }

  async updateAllergie(
    id: string,
    nom: string,
    description?: string,
    dateDecouverte?: Date
  ): Promise<Result<Allergie>> {
    try {
      const result = await httpClient.put<{ success: boolean; data: Allergie }>(
        `/allergies/${id}`,
        {
          nom,
          description,
          dateDecouverte: dateDecouverte?.toISOString(),
        }
      );

      if (!result.ok) {
        return result;
      }

      const a = result.value.data;
      const allergie = new Allergie(
        a.id,
        a.nom,
        a.idDossierMedical,
        a.idPatient,
        a.description,
        a.dateDecouverte ? new Date(a.dateDecouverte) : undefined
      );

      return ok(allergie);
    } catch (error: any) {
      return err(error.message || "Erreur lors de la mise à jour de l'allergie");
    }
  }

  async deleteAllergie(id: string): Promise<Result<void>> {
    try {
      const result = await httpClient.delete<void>(`/allergies/${id}`);

      if (!result.ok) {
        return result;
      }

      return ok(undefined);
    } catch (error: any) {
      return err(error.message || "Erreur lors de la suppression de l'allergie");
    }
  }

  async getTraitementsByPatient(idPatient: string): Promise<Result<Traitement[]>> {
    try {
      const result = await httpClient.get<{ success: boolean; data: Traitement[] }>(
        `/patients/${idPatient}/traitements`
      );

      if (!result.ok) {
        return result;
      }

      const traitements = result.value.data.map(
        (t: any) =>
          new Traitement(
            t.id,
            t.idPatient,
            t.nom,
            new Date(t.dateDebut),
            t.description,
            t.dateFin ? new Date(t.dateFin) : undefined,
            t.posologie,
            t.medecinPrescripteur,
            t.dateCreation ? new Date(t.dateCreation) : undefined
          )
      );

      return ok(traitements);
    } catch (error: any) {
      return err(error.message || "Erreur lors de la récupération des traitements");
    }
  }

  async addTraitement(
    idPatient: string,
    nom: string,
    dateDebut: Date,
    description?: string,
    dateFin?: Date,
    posologie?: string,
    medecinPrescripteur?: string
  ): Promise<Result<Traitement>> {
    try {
      const result = await httpClient.post<{ success: boolean; data: Traitement }>(
        `/patients/${idPatient}/traitements`,
        {
          nom,
          dateDebut: dateDebut.toISOString().split('T')[0],
          description,
          dateFin: dateFin ? dateFin.toISOString().split('T')[0] : undefined,
          posologie,
          medecinPrescripteur,
        }
      );

      if (!result.ok) {
        return result;
      }

      const t = result.value.data;
      const traitement = new Traitement(
        t.id,
        t.idPatient,
        t.nom,
        new Date(t.dateDebut),
        t.description,
        t.dateFin ? new Date(t.dateFin) : undefined,
        t.posologie,
        t.medecinPrescripteur,
        t.dateCreation ? new Date(t.dateCreation) : undefined
      );

      return ok(traitement);
    } catch (error: any) {
      return err(error.message || "Erreur lors de l'ajout du traitement");
    }
  }

  async updateTraitement(
    id: string,
    nom: string,
    dateDebut: Date,
    description?: string,
    dateFin?: Date,
    posologie?: string,
    medecinPrescripteur?: string
  ): Promise<Result<Traitement>> {
    try {
      const result = await httpClient.put<{ success: boolean; data: Traitement }>(
        `/traitements/${id}`,
        {
          nom,
          dateDebut: dateDebut.toISOString().split('T')[0],
          description,
          dateFin: dateFin ? dateFin.toISOString().split('T')[0] : undefined,
          posologie,
          medecinPrescripteur,
        }
      );

      if (!result.ok) {
        return result;
      }

      const t = result.value.data;
      const traitement = new Traitement(
        t.id,
        t.idPatient,
        t.nom,
        new Date(t.dateDebut),
        t.description,
        t.dateFin ? new Date(t.dateFin) : undefined,
        t.posologie,
        t.medecinPrescripteur,
        t.dateCreation ? new Date(t.dateCreation) : undefined
      );

      return ok(traitement);
    } catch (error: any) {
      return err(error.message || "Erreur lors de la mise à jour du traitement");
    }
  }

  async deleteTraitement(id: string): Promise<Result<void>> {
    try {
      const result = await httpClient.delete<void>(`/traitements/${id}`);

      if (!result.ok) {
        return result;
      }

      return ok(undefined);
    } catch (error: any) {
      return err(error.message || "Erreur lors de la suppression du traitement");
    }
  }
}

