import { useMemo } from "react";
import { DocumentMedicalService } from "../../application/services/DocumentMedicalService";
import { DocumentMedicalRepositoryHttp } from "../../infrastructure/repositories/DocumentMedicalRepositoryHttp";

/**
 * Hook pour utiliser le service des documents médicaux
 */
export function useDocumentMedical() {
  const documentService = useMemo(() => {
    const documentRepository = new DocumentMedicalRepositoryHttp();
    return new DocumentMedicalService(documentRepository);
  }, []);

  return documentService;
}

