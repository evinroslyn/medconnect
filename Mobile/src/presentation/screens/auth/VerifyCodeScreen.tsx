import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../../../infrastructure/config";

export function VerifyCodeScreen() {
  const params = useLocalSearchParams<{ telephone?: string; email?: string }>();
  const telephone = params.telephone || "";
  const email = params.email || "";
  
  const [code, setCode] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const authService = useAuth();

  // Focus sur le premier champ au montage
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleCodeChange = (value: string, index: number) => {
    // Ne permettre que les chiffres
    const numericValue = value.replace(/[^0-9]/g, "");
    
    if (numericValue.length > 1) {
      // Si plusieurs chiffres sont collés, les répartir
      const digits = numericValue.split("").slice(0, 4);
      const newCode = [...code];
      digits.forEach((digit, i) => {
        if (index + i < 4) {
          newCode[index + i] = digit;
        }
      });
      setCode(newCode);
      
      // Focus sur le prochain champ vide ou le dernier
      const nextIndex = Math.min(index + digits.length, 3);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const newCode = [...code];
      newCode[index] = numericValue;
      setCode(newCode);

      // Auto-focus sur le champ suivant si un chiffre est entré
      if (numericValue && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      // Si le champ est vide et qu'on appuie sur backspace, aller au champ précédent
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const codeString = code.join("");
    
    if (codeString.length !== 4) {
      Alert.alert("Erreur", "Veuillez entrer le code complet à 4 chiffres");
      return;
    }

    // Récupérer le mot de passe depuis AsyncStorage (stocké temporairement)
    const storedPassword = await AsyncStorage.getItem("temp_password");
    if (!storedPassword || !telephone) {
      Alert.alert("Erreur", "Session expirée. Veuillez vous reconnecter.");
      router.replace("/(auth)/login");
      return;
    }

    setLoading(true);
    try {
      console.log(`[VerifyCodeScreen] Tentative de vérification avec le code: "${codeString}"`);
      
      const result = await authService.login({
        telephone,
        motDePasse: storedPassword,
        code2FA: codeString,
      });

      if (result.ok && result.value.token) {
        // Supprimer le mot de passe temporaire
        await AsyncStorage.removeItem("temp_password");
        
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(result.value.user));
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, result.value.token);
        
        // Rediriger directement sans alerte pour une meilleure UX
        router.replace("/(tabs)");
      } else {
        // Message d'erreur plus détaillé
        const errorMessage = result.ok 
          ? (result.value.require2FA 
              ? "Code invalide. Veuillez vérifier le code et réessayer." 
              : "Code invalide")
          : result.error || "Une erreur est survenue";
        
        console.log(`[VerifyCodeScreen] Erreur de vérification: ${errorMessage}`);
        Alert.alert("Erreur", errorMessage);
        // Réinitialiser les champs en cas d'erreur
        setCode(["", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Une erreur est survenue");
      setCode(["", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!telephone) {
      Alert.alert("Erreur", "Numéro de téléphone manquant");
      return;
    }

    setResendLoading(true);
    try {
      // Récupérer le mot de passe temporaire
      const storedPassword = await AsyncStorage.getItem("temp_password");
      if (!storedPassword) {
        Alert.alert("Erreur", "Session expirée. Veuillez vous reconnecter.");
        router.replace("/(auth)/login");
        return;
      }

      // Relancer la connexion pour obtenir un nouveau code
      const result = await authService.login({
        telephone,
        motDePasse: storedPassword,
      });

      if (result.ok && result.value.require2FA) {
        // Afficher le nouveau code en développement
        const devMessage = __DEV__ 
          ? `Un nouveau code a été envoyé. Vérifiez les logs du backend pour le code.`
          : "Un nouveau code de vérification a été envoyé à votre email.";
        
        Alert.alert("Code renvoyé", devMessage);
        // Réinitialiser les champs
        setCode(["", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert("Erreur", result.ok ? "Impossible de renvoyer le code" : result.error);
      }
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Une erreur est survenue");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Verify Code</Text>
        
        <Text style={styles.instructions}>
          Please enter the code we just sent to email
        </Text>
        
        {email && (
          <Text style={styles.email}>{email}</Text>
        )}

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[styles.codeInput, digit && styles.codeInputFilled]}
              value={digit}
              onChangeText={(value) => handleCodeChange(value, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive OTP?</Text>
          <TouchableOpacity
            onPress={handleResendCode}
            disabled={resendLoading}
            style={styles.resendButton}
          >
            {resendLoading ? (
              <ActivityIndicator size="small" color="#000000ff" />
            ) : (
              <Text style={styles.resendButtonText}>Resend code</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={loading || code.join("").length !== 4}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  instructions: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000ff",
    textAlign: "center",
    marginBottom: 40,
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 32,
  },
  codeInput: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    textAlign: "center",
    fontSize: 24,
    fontWeight: "600",
    color: "#111827",
  },
  codeInputFilled: {
    borderColor: "#000000ff",
    backgroundColor: "#FFFFFF",
  },
  resendContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  resendText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000ff",
  },
  verifyButton: {
    backgroundColor: "#000000ff",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  verifyButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

