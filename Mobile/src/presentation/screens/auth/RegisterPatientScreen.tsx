import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AuthService, { RegisterData } from '../../../application/services/AuthService';
import { router } from 'expo-router';
import { DatePicker } from '../../components/common/DatePicker';

export const RegisterPatientScreen: React.FC = () => {
  const [formData, setFormData] = useState<RegisterData>({
    telephone: '',
    motDePasse: '',
    typeUtilisateur: 'patient',
    nom: '',
    adresse: '',
    dateNaissance: '',
    genre: 'Homme',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof RegisterData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRegister = async () => {
    // Validation des champs
    if (!formData.telephone || !formData.motDePasse || !formData.nom || 
        !formData.dateNaissance) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);

    try {
      const response = await AuthService.register(formData);

      if (response.success) {
        Alert.alert(
          'Inscription réussie',
          'Votre compte patient a été créé avec succès.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)')
            }
          ]
        );
      } else {
        Alert.alert('Erreur', response.message);
      }
    } catch (error) {
      Alert.alert('Erreur', "Une erreur est survenue lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.replace('/(auth)');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Inscription Patient</Text>
          <Text style={styles.subtitle}>Med-Connect</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nom complet *</Text>
            <TextInput
              style={styles.input}
              value={formData.nom}
              onChangeText={(value) => handleInputChange('nom', value)}
              placeholder="Jean Dupont"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Numéro de téléphone *</Text>
            <TextInput
              style={styles.input}
              value={formData.telephone}
              onChangeText={(value) => handleInputChange('telephone', value)}
              placeholder="+33123456789"
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mot de passe *</Text>
            <TextInput
              style={styles.input}
              value={formData.motDePasse}
              onChangeText={(value) => handleInputChange('motDePasse', value)}
              placeholder="Minimum 8 caractères"
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <DatePicker
              label="Date de naissance *"
              value={formData.dateNaissance}
              onChange={(date) => handleInputChange('dateNaissance', date)}
              placeholder="Sélectionner votre date de naissance"
              maximumDate={new Date()}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Genre *</Text>
            <View style={styles.genreContainer}>
              {['Homme', 'Femme', 'Autre'].map((genre) => (
                <TouchableOpacity
                  key={genre}
                  style={[
                    styles.genreButton,
                    formData.genre === genre && styles.genreButtonSelected,
                  ]}
                  onPress={() => handleInputChange('genre', genre)}
                >
                  <Text style={[
                    styles.genreButtonText,
                    formData.genre === genre && styles.genreButtonTextSelected,
                  ]}>
                    {genre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Adresse</Text>
            <TextInput
              style={styles.input}
              value={formData.adresse}
              onChangeText={(value) => handleInputChange('adresse', value)}
              placeholder="123 Rue de la Santé, Paris"
              multiline
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{"S'inscrire"}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={navigateToLogin}
          >
            <Text style={styles.linkText}>
              Déjà un compte ? Se connecter
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  genreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genreButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  genreButtonSelected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  genreButtonText: {
    color: '#333',
    fontSize: 14,
  },
  genreButtonTextSelected: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#007bff',
    fontSize: 14,
  },
});