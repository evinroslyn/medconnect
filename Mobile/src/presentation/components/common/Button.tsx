import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  loading?: boolean;
  disabled?: boolean;
}

/**
 * Composant de bouton réutilisable
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === "primary" ? styles.primaryButton : styles.secondaryButton,
        (disabled || loading) && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : "#007AFF"} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === "primary" ? styles.primaryText : styles.secondaryText,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  primaryText: {
    color: "#fff",
  },
  secondaryText: {
    color: "#007AFF",
  },
});

