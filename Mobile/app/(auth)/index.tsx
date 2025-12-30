import { Redirect } from "expo-router";

export default function AuthIndex() {
  // Rediriger vers la page de connexion
  return <Redirect href="/(auth)/login" />;
}
