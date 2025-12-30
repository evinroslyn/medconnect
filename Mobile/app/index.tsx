import { Redirect } from "expo-router";
import { useEffect, useState, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator, Text } from "react-native";
import { useAuth } from "@/presentation/hooks/useAuth";
import { STORAGE_KEYS } from "@/infrastructure/config";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const authService = useAuth();
  const hasChecked = useRef(false);

  useEffect(() => {
    // Éviter les appels multiples
    if (hasChecked.current) {
      return;
    }
    hasChecked.current = true;

    // Ajouter un timeout de sécurité pour éviter que l'app reste bloquée indéfiniment
    const safetyTimeout = setTimeout(() => {
      console.warn("[Index] Timeout de sécurité atteint, arrêt du chargement");
      setIsLoading(false);
      setIsAuthenticated(false);
      setErrorMessage("Le serveur ne répond pas. Vérifiez votre connexion.");
    }, 8000); // 8 secondes maximum

    checkAuth().finally(() => {
      clearTimeout(safetyTimeout);
    });

    return () => {
      clearTimeout(safetyTimeout);
    };
  }, []);

  const checkAuth = async () => {
    try {
      console.log("[Index] Début de la vérification de l'authentification");
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const user = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      
      console.log("[Index] Token présent:", !!token, "User présent:", !!user);
      
      // Si pas de token ou utilisateur, pas authentifié
      if (!token || !user) {
        console.log("[Index] Pas de token ou utilisateur, redirection vers auth");
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // Vérifier la validité du token en appelant le backend avec timeout
      console.log("[Index] Vérification du profil avec timeout de 5 secondes");
      
      let result;
      try {
        // Créer un AbortController pour annuler la requête si nécessaire
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.warn("[Index] Timeout atteint, annulation de la requête");
          controller.abort();
        }, 5000); // 5 secondes de timeout

        const profilePromise = authService.getProfile();
        
        // Wrapper pour gérer le timeout
        result = await Promise.race([
          profilePromise,
          new Promise<{ ok: false; error: string }>((resolve) => {
            setTimeout(() => {
              resolve({ ok: false, error: "Timeout: Le serveur ne répond pas" });
            }, 5000);
          })
        ]);

        clearTimeout(timeoutId);
      } catch (error: any) {
        console.error("[Index] Erreur lors de l'appel getProfile:", error);
        result = { ok: false, error: error.message || "Erreur réseau" };
      }

      console.log("[Index] Résultat de getProfile:", result.ok ? "OK" : "Erreur");

      if (result.ok) {
        // Token valide, utilisateur authentifié
        console.log("[Index] Token valide, utilisateur authentifié");
        setIsAuthenticated(true);
      } else {
        // Token invalide ou timeout
        console.warn("[Index] Token invalide ou timeout:", result.error);
        setIsAuthenticated(false);
        // Si c'est un timeout ou une erreur réseau, ne pas supprimer le token
        if (!result.error?.includes("Timeout") && !result.error?.includes("réseau") && !result.error?.includes("Network")) {
          // Supprimer le token seulement si c'est une erreur d'authentification
          console.log("[Index] Suppression du token invalide");
          await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          await AsyncStorage.removeItem(STORAGE_KEYS.USER);
        }
      }
    } catch (error) {
      console.error("[Index] Erreur lors de la vérification de l'authentification:", error);
      setIsAuthenticated(false);
    } finally {
      console.log("[Index] Fin de la vérification, arrêt du chargement");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <ActivityIndicator size="large" color="#0066cc" />
        {errorMessage && (
          <Text style={{ marginTop: 20, color: "#ff0000", textAlign: "center" }}>
            {errorMessage}
          </Text>
        )}
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)" />;
}

