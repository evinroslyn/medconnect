import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { router } from "expo-router";

export function ForgotPasswordScreen() {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [telephone, setTelephone] = useState("");
  const [code, setCode] = useState("");
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [confirmerMotDePasse, setConfirmerMotDePasse] = useState("");
  const [loading, setLoading] = useState(false);
  const authService = useAuth();

  const handleRequestReset = async () => {
    if (!telephone) {
      Alert.alert("Erreur", "Veuillez entrer votre numéro de téléphone");
      return;
    }

    setLoading(true);
    try {
      const result = await authService.requestPasswordReset(telephone);
      if (result.ok) {
        Alert.alert(
          "Code envoyé",
          result.value.message,
          [
            {
              text: "OK",
              onPress: () => setStep("reset"),
            },
          ]
        );
      } else {
        Alert.alert("Erreur", result.error);
      }
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code || !nouveauMotDePasse || !confirmerMotDePasse) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    if (nouveauMotDePasse !== confirmerMotDePasse) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }

    if (nouveauMotDePasse.length < 8) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(nouveauMotDePasse)) {
      Alert.alert(
        "Erreur",
        "Le mot de passe doit contenir au moins une lettre minuscule, une lettre majuscule et un chiffre"
      );
      return;
    }

    setLoading(true);
    try {
      const result = await authService.resetPassword(telephone, code, nouveauMotDePasse);
      if (result.ok) {
        Alert.alert(
          "Succès",
          result.value.message,
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert("Erreur", result.error);
      }
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (step === "request") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Mot de passe oublié</Text>
          <Text style={styles.subtitle}>
            Entrez votre numéro de téléphone. Un code de réinitialisation vous sera envoyé par email.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Numéro de téléphone"
              placeholderTextColor="#9CA3AF"
              value={telephone}
              onChangeText={setTelephone}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRequestReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Envoyer le code</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => setStep("request")}>
        <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Réinitialiser le mot de passe</Text>
        <Text style={styles.subtitle}>
          Entrez le code reçu par email et votre nouveau mot de passe.
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Ionicons name="key-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Code de vérification"
            placeholderTextColor="#9CA3AF"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Nouveau mot de passe"
            placeholderTextColor="#9CA3AF"
            value={nouveauMotDePasse}
            onChangeText={setNouveauMotDePasse}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirmer le mot de passe"
            placeholderTextColor="#9CA3AF"
            value={confirmerMotDePasse}
            onChangeText={setConfirmerMotDePasse}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Réinitialiser le mot de passe</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1E3A8A",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  button: {
    backgroundColor: "#1E3A8A",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

