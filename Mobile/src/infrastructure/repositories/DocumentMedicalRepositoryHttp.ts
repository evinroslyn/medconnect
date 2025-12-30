import type { Result } from "../../shared/types/Result";
import type { DocumentMedical } from "../../domain/entities/DocumentMedical";
import type { DocumentMedicalRepository } from "../../domain/repositories/DocumentMedicalRepository";
import { httpClient } from "../http/httpClient";

/**
 * Implémentation HTTP du repository des documents médicaux
 */
export class DocumentMedicalRepositoryHttp implements DocumentMedicalRepository {
  async getByDossier(dossierId: string): Promise<Result<DocumentMedical[]>> {
    return httpClient.get<DocumentMedical[]>(`/documents-medicaux?dossierId=${dossierId}`);
  }

  async getByPatient(patientId: string): Promise<Result<DocumentMedical[]>> {
    return httpClient.get<DocumentMedical[]>(`/documents-medicaux?patientId=${patientId}`);
  }

  async getById(documentId: string): Promise<Result<DocumentMedical>> {
    return httpClient.get<DocumentMedical>(`/documents-medicaux/${documentId}`);
  }

  async upload(
    document: Omit<DocumentMedical, "id" | "dateCreation">,
    fichierUri?: string
  ): Promise<Result<DocumentMedical>> {
    // Utiliser FormData de React Native
    const formData = new FormData();
    
    // Ajouter les champs du document de manière explicite
    formData.append("idDossierMedical", document.idDossierMedical);
    formData.append("idPatient", document.idPatient);
    formData.append("nom", document.nom);
    formData.append("type", document.type);
    
    if (document.description) {
      formData.append("description", document.description);
    }

    // Ajouter le fichier si présent
    if (fichierUri) {
      // Détecter le type MIME basé sur l'extension
      const uri = fichierUri.toLowerCase();
      let mimeType = "application/pdf";
      let fileName = "document.pdf";
      
      if (uri.endsWith(".jpg") || uri.endsWith(".jpeg")) {
        mimeType = "image/jpeg";
        fileName = "document.jpg";
      } else if (uri.endsWith(".png")) {
        mimeType = "image/png";
        fileName = "document.png";
      } else if (uri.endsWith(".pdf")) {
        mimeType = "application/pdf";
        fileName = "document.pdf";
      }
      
      // Format pour React Native FormData
      formData.append("fichier", {
        uri: fichierUri,
        type: mimeType,
        name: fileName,
      } as any);
    }

    console.log("[DocumentMedicalRepository] Upload:", {
      idDossierMedical: document.idDossierMedical,
      idPatient: document.idPatient,
      nom: document.nom,
      type: document.type,
      hasFile: !!fichierUri,
      fileUri: fichierUri,
    });

    // Utiliser fetch pour FormData (plus fiable dans React Native)
    return httpClient.post<DocumentMedical>("/documents-medicaux", formData);
  }

  async update(
    documentId: string,
    updates: Partial<DocumentMedical>
  ): Promise<Result<DocumentMedical>> {
    return httpClient.patch<DocumentMedical>(`/documents-medicaux/${documentId}`, updates);
  }

  async delete(documentId: string): Promise<Result<void>> {
    return httpClient.delete<void>(`/documents-medicaux/${documentId}`);
  }
}

