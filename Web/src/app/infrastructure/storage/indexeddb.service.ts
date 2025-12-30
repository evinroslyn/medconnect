import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * Service IndexedDB pour la synchronisation offline
 */
@Injectable({
  providedIn: 'root'
})
export class IndexedDBService {
  private dbName = 'MedConnectDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  /**
   * Initialiser la base de données IndexedDB
   */
  init(): Observable<boolean> {
    return new Observable(observer => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('❌ Erreur lors de l\'ouverture d\'IndexedDB:', request.error);
        observer.error(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialisé');
        observer.next(true);
        observer.complete();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createObjectStores(db);
      };
    });
  }

  /**
   * Créer les object stores nécessaires
   */
  private createObjectStores(db: IDBDatabase): void {
    // Store pour les messages
    if (!db.objectStoreNames.contains('messages')) {
      const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
      messageStore.createIndex('conversationId', 'conversationId', { unique: false });
      messageStore.createIndex('timestamp', 'timestamp', { unique: false });
      messageStore.createIndex('synced', 'synced', { unique: false });
    }

    // Store pour les rendez-vous
    if (!db.objectStoreNames.contains('rendezVous')) {
      const rendezVousStore = db.createObjectStore('rendezVous', { keyPath: 'id' });
      rendezVousStore.createIndex('idMedecin', 'idMedecin', { unique: false });
      rendezVousStore.createIndex('date', 'date', { unique: false });
      rendezVousStore.createIndex('synced', 'synced', { unique: false });
    }

    // Store pour les disponibilités
    if (!db.objectStoreNames.contains('disponibilites')) {
      const disponibiliteStore = db.createObjectStore('disponibilites', { keyPath: 'id' });
      disponibiliteStore.createIndex('idMedecin', 'idMedecin', { unique: false });
      disponibiliteStore.createIndex('jour', 'jour', { unique: false });
      disponibiliteStore.createIndex('synced', 'synced', { unique: false });
    }

    // Store pour les patients
    if (!db.objectStoreNames.contains('patients')) {
      const patientStore = db.createObjectStore('patients', { keyPath: 'id' });
      patientStore.createIndex('synced', 'synced', { unique: false });
    }

    // Store pour les conversations
    if (!db.objectStoreNames.contains('conversations')) {
      const conversationStore = db.createObjectStore('conversations', { keyPath: 'utilisateurId' });
      conversationStore.createIndex('synced', 'synced', { unique: false });
    }

    // Store pour les dossiers médicaux
    if (!db.objectStoreNames.contains('dossiers')) {
      const dossierStore = db.createObjectStore('dossiers', { keyPath: 'id' });
      dossierStore.createIndex('idPatient', 'idPatient', { unique: false });
      dossierStore.createIndex('synced', 'synced', { unique: false });
    }

    // Store pour les documents médicaux
    if (!db.objectStoreNames.contains('documents')) {
      const documentStore = db.createObjectStore('documents', { keyPath: 'id' });
      documentStore.createIndex('idDossier', 'idDossier', { unique: false });
      documentStore.createIndex('idPatient', 'idPatient', { unique: false });
      documentStore.createIndex('synced', 'synced', { unique: false });
    }

    // Store pour les opérations en attente de synchronisation
    if (!db.objectStoreNames.contains('pendingOperations')) {
      const pendingStore = db.createObjectStore('pendingOperations', { keyPath: 'id', autoIncrement: true });
      pendingStore.createIndex('type', 'type', { unique: false });
      pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
    }
  }

  /**
   * Ajouter ou mettre à jour un élément
   */
  add<T>(storeName: string, item: T & { synced?: boolean }): Observable<T> {
    return new Observable(observer => {
      if (!this.db) {
        observer.error(new Error('IndexedDB non initialisé'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const itemWithSync = { ...item, synced: item.synced ?? false };
      const request = store.put(itemWithSync);

      request.onsuccess = () => {
        console.log(`✅ Élément ajouté dans ${storeName}:`, item);
        observer.next(item);
        observer.complete();
      };

      request.onerror = () => {
        console.error(`❌ Erreur lors de l'ajout dans ${storeName}:`, request.error);
        observer.error(request.error);
      };
    });
  }

  /**
   * Récupérer un élément par sa clé
   */
  get<T>(storeName: string, key: string): Observable<T | null> {
    return new Observable(observer => {
      if (!this.db) {
        observer.next(null);
        observer.complete();
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        observer.next(request.result || null);
        observer.complete();
      };

      request.onerror = () => {
        console.error(`❌ Erreur lors de la récupération depuis ${storeName}:`, request.error);
        observer.error(request.error);
      };
    });
  }

  /**
   * Récupérer tous les éléments d'un store
   */
  getAll<T>(storeName: string): Observable<T[]> {
    return new Observable(observer => {
      if (!this.db) {
        observer.next([]);
        observer.complete();
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        observer.next(request.result || []);
        observer.complete();
      };

      request.onerror = () => {
        console.error(`❌ Erreur lors de la récupération depuis ${storeName}:`, request.error);
        observer.error(request.error);
      };
    });
  }

  /**
   * Récupérer les éléments non synchronisés
   */
  getUnsynced<T>(storeName: string): Observable<T[]> {
    return new Observable(observer => {
      if (!this.db) {
        observer.next([]);
        observer.complete();
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index('synced');
      // Utiliser IDBKeyRange pour rechercher les valeurs false
      const request = index.getAll(IDBKeyRange.only(false));

      request.onsuccess = () => {
        observer.next(request.result || []);
        observer.complete();
      };

      request.onerror = () => {
        console.error(`❌ Erreur lors de la récupération des éléments non synchronisés depuis ${storeName}:`, request.error);
        observer.error(request.error);
      };
    });
  }

  /**
   * Supprimer un élément
   */
  delete(storeName: string, key: string): Observable<void> {
    return new Observable(observer => {
      if (!this.db) {
        observer.error(new Error('IndexedDB non initialisé'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        console.log(`✅ Élément supprimé de ${storeName}:`, key);
        observer.next();
        observer.complete();
      };

      request.onerror = () => {
        console.error(`❌ Erreur lors de la suppression depuis ${storeName}:`, request.error);
        observer.error(request.error);
      };
    });
  }

  /**
   * Marquer un élément comme synchronisé
   */
  markAsSynced(storeName: string, key: string): Observable<void> {
    return this.get(storeName, key).pipe(
      map(item => {
        if (!item) {
          throw new Error('Élément non trouvé');
        }
        return { ...item, synced: true };
      }),
      map(updatedItem => this.add(storeName, updatedItem)),
      map(() => undefined),
      catchError(error => {
        console.error(`❌ Erreur lors du marquage comme synchronisé:`, error);
        return of(undefined);
      })
    );
  }

  /**
   * Ajouter une opération en attente de synchronisation
   */
  addPendingOperation(operation: {
    type: string;
    action: 'create' | 'update' | 'delete';
    storeName: string;
    data: any;
  }): Observable<number> {
    return new Observable(observer => {
      if (!this.db) {
        observer.error(new Error('IndexedDB non initialisé'));
        return;
      }

      const transaction = this.db.transaction(['pendingOperations'], 'readwrite');
      const store = transaction.objectStore('pendingOperations');
      const pendingOp = {
        ...operation,
        timestamp: Date.now()
      };
      const request = store.add(pendingOp);

      request.onsuccess = () => {
        observer.next(request.result as number);
        observer.complete();
      };

      request.onerror = () => {
        console.error('❌ Erreur lors de l\'ajout de l\'opération en attente:', request.error);
        observer.error(request.error);
      };
    });
  }

  /**
   * Récupérer toutes les opérations en attente
   */
  getPendingOperations(): Observable<any[]> {
    return this.getAll('pendingOperations');
  }

  /**
   * Supprimer une opération en attente
   */
  removePendingOperation(id: number): Observable<void> {
    return this.delete('pendingOperations', id.toString());
  }

  /**
   * Vider un store
   */
  clear(storeName: string): Observable<void> {
    return new Observable(observer => {
      if (!this.db) {
        observer.error(new Error('IndexedDB non initialisé'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log(`✅ Store ${storeName} vidé`);
        observer.next();
        observer.complete();
      };

      request.onerror = () => {
        console.error(`❌ Erreur lors du vidage de ${storeName}:`, request.error);
        observer.error(request.error);
      };
    });
  }
}

