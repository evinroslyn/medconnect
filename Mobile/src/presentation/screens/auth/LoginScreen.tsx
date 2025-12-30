import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../../../infrastructure/config";
import { DatePicker } from "../../components/common/DatePicker";
import type { RegisterData } from "../../../domain/repositories/AuthRepository";

interface UserType {
  id: string;
  name: string;
  email: string;
  type: "patient" | "doctor";
  specialization?: string;
}

interface AuthScreenProps {
  onLogin?: (user: UserType) => void;
}

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [nom, setNom] = useState("");
  const [mail, setMail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [telephone, setTelephone] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [genre, setGenre] = useState<"Homme" | "Femme" | "Autre">("Homme");
  const [adresse, setAdresse] = useState("");
  const [loading, setLoading] = useState(false);
  const authService = useAuth();

  const handleLogin = async () => {
    if (!telephone || !motDePasse) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    // Première étape : envoi des identifiants
    setLoading(true);
    try {
      const result = await authService.login({ telephone, motDePasse });
      if (result.ok) {
        // Si 2FA est requis, rediriger vers la page de vérification
        if (result.value.require2FA) {
          // Stocker temporairement le mot de passe pour la vérification
          await AsyncStorage.setItem("temp_password", motDePasse);
          
          // Rediriger vers la page de vérification du code
          router.push({
            pathname: "/(auth)/verify-code",
            params: {
              telephone,
              email: result.value.user?.mail || "",
            },
          });
        } else if (result.value.token) {
          // Connexion réussie sans 2FA
          await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(result.value.user));
          await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, result.value.token);
          if (onLogin) {
            onLogin({
              id: result.value.user.id,
              name: (result.value.user as any).nom || "",
              email: result.value.user.mail || "",
              type: result.value.user.typeUtilisateur === "medecin" ? "doctor" : "patient",
            });
          }
          router.replace("/(tabs)");
        } else {
          Alert.alert("Erreur", "Token manquant dans la réponse");
        }
      } else {
        Alert.alert("Erreur", result.error);
      }
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    // Validation des champs requis
    if (!nom || !mail || !motDePasse || !telephone || !dateNaissance || !genre) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
      return;
    }

    // Validation du format de téléphone (format camerounais)
    const phoneRegex = /^(\+237[6-7]\d{8}|[6-7]\d{8})$/;
    if (!phoneRegex.test(telephone)) {
      Alert.alert("Erreur", "Format de téléphone invalide. Format attendu: 612345678 ou +237612345678");
      return;
    }

    // Validation du mot de passe
    if (motDePasse.length < 8) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(motDePasse)) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre");
      return;
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(mail)) {
      Alert.alert("Erreur", "Format d'email invalide");
      return;
    }

    // Validation de la date de naissance (format ISO: YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateNaissance)) {
      Alert.alert("Erreur", "Format de date invalide. Format attendu: AAAA-MM-JJ");
      return;
    }

    setLoading(true);
    try {
      const registerData: RegisterData = {
        telephone,
        motDePasse,
        typeUtilisateur: "patient",
        nom,
        mail,
        dateNaissance,
        genre,
        adresse: adresse || undefined,
      };

      const result = await authService.register(registerData);
      if (result.ok) {
        Alert.alert(
          "Succès",
          "Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.",
          [
            {
              text: "OK",
              onPress: () => {
                setIsLogin(true);
                // Réinitialiser les champs
                setNom("");
                setMail("");
                setMotDePasse("");
                setTelephone("");
                setDateNaissance("");
                setAdresse("");
              },
            },
          ]
        );
      } else {
        Alert.alert("Erreur", result.error);
      }
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Une erreur est survenue lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (isLogin) {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Ionicons name="heart" size={40} color="#fff" />
        </View>
        <Text style={styles.title}>MED-CONNECT</Text>
        <Text style={styles.subtitle}>Votre santé, toujours connectée</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, isLogin && styles.toggleActive]}
            onPress={() => setIsLogin(true)}
          >
            <Text style={[styles.toggleText, isLogin && styles.toggleActiveText]}>Connexion</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, !isLogin && styles.toggleActive]}
            onPress={() => setIsLogin(false)}
          >
            <Text style={[styles.toggleText, !isLogin && styles.toggleActiveText]}>Inscription</Text>
          </TouchableOpacity>
        </View>

        {/* FORM */}
        <View style={{ gap: 14 }}>
          {!isLogin && (
            <>
              <View>
                <Text style={styles.label}>Nom complet *</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="person" size={18} color="#9ca3af" style={styles.icon} />
                  <TextInput
                    placeholder="Votre nom"
                    style={styles.input}
                    value={nom}
                    onChangeText={setNom}
                  />
                </View>
              </View>

              <View>
                <Text style={styles.label}>Téléphone *</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="call" size={18} color="#9ca3af" style={styles.icon} />
                  <TextInput
                    placeholder="612345678 ou +237612345678"
                    style={styles.input}
                    value={telephone}
                    onChangeText={setTelephone}
                    keyboardType="phone-pad"
                  />
                </View>
                <Text style={styles.hint}>Format camerounais: 612345678 ou +237612345678</Text>
              </View>
            </>
          )}

          {isLogin && (
            <View>
              <Text style={styles.label}>Téléphone</Text>
              <View style={styles.inputBox}>
                <Ionicons name="call" size={18} color="#9ca3af" style={styles.icon} />
                <TextInput
                  placeholder="612345678"
                  style={styles.input}
                  value={telephone}
                  onChangeText={setTelephone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          )}

          {!isLogin && (
            <View>
              <Text style={styles.label}>Email *</Text>
              <View style={styles.inputBox}>
                <Ionicons name="mail" size={18} color="#9ca3af" style={styles.icon} />
                <TextInput
                  placeholder="email@example.com"
                  style={styles.input}
                  value={mail}
                  onChangeText={setMail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
          )}

          <View>
            <Text style={styles.label}>Mot de passe *</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed" size={18} color="#9ca3af" style={styles.icon} />
              <TextInput
                placeholder="••••••••"
                style={styles.input}
                value={motDePasse}
                onChangeText={setMotDePasse}
                secureTextEntry
              />
            </View>
            {!isLogin && (
              <Text style={styles.hint}>Min. 8 caractères, avec majuscule, minuscule et chiffre</Text>
            )}
          </View>

          {!isLogin && (
            <>
              <View>
                <DatePicker
                  label="Date de naissance *"
                  value={dateNaissance}
                  onChange={setDateNaissance}
                  placeholder="Sélectionner votre date de naissance"
                  maximumDate={new Date()}
                />
              </View>

              <View>
                <Text style={styles.label}>Genre *</Text>
                <View style={styles.row}>
                  {(["Homme", "Femme", "Autre"] as const).map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genreBtn,
                        genre === g && styles.genreBtnActive,
                      ]}
                      onPress={() => setGenre(g)}
                    >
                      <Text style={[styles.genreText, genre === g && styles.genreTextActive]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text style={styles.label}>Adresse</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="location" size={18} color="#9ca3af" style={styles.icon} />
                  <TextInput
                    placeholder="Adresse (optionnel)"
                    style={styles.input}
                    value={adresse}
                    onChangeText={setAdresse}
                    multiline
                  />
                </View>
              </View>
            </>
          )}

          {isLogin && (
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => router.push("/(auth)/forgot-password")}
            >
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>
                {isLogin ? "Se connecter" : "S'inscrire"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 160,
    backgroundColor: "#f1f5f9",
  },

  header: {
    alignItems: "center",
    marginBottom: 30,
  },

  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#000000ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  title: {
    fontSize: 28,
    color: "#000000ff",
    fontWeight: "bold",
  },

  subtitle: {
    color: "#64748b",
  },

  card: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 18,
    marginBottom: 20,
    elevation: 3,
  },

  toggleContainer: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: "#e5e7eb",
    padding: 4,
    borderRadius: 10,
  },

  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  toggleActive: {
    backgroundColor: "#fff",
    elevation: 2,
  },

  toggleText: {
    color: "#6b7280",
    fontWeight: "600",
  },

  toggleActiveText: {
    color: "#000000ff",
  },

  label: { color: "#374151", marginBottom: 4, fontWeight: "500" },

  hint: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    marginLeft: 4,
  },

  row: {
    flexDirection: "row",
    gap: 10,
  },

  genreBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  genreBtnActive: {
    borderColor: "#000000ff",
    backgroundColor: "#dbeafe",
  },

  genreText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
  },

  genreTextActive: {
    color: "#000000ff",
    fontWeight: "600",
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },

  input: {
    flex: 1,
    padding: 12,
  },

  icon: { marginRight: 6 },

  forgotBtn: { alignSelf: "flex-end" },

  forgotText: { color: "#000000ff", fontSize: 13 },

  submitBtn: {
    backgroundColor: "#000000ff",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  submitBtnDisabled: {
    backgroundColor: "#9ca3af",
  },

  submitText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

export default AuthScreen;
