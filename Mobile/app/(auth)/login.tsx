import { AuthScreen } from "@/presentation/screens/auth/LoginScreen";

export default function LoginPage() {
  const handleLogin = async (user: any) => {
    // La navigation est gérée directement dans AuthScreen avec router.replace
    // Cette fonction est appelée mais la navigation se fait dans AuthScreen
  };

  return <AuthScreen onLogin={handleLogin} />;
}

