import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

export interface AlertProps {
  type: AlertType;
  title: string;
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const AlertConfig: Record<AlertType, { icon: keyof typeof Ionicons.glyphMap; backgroundColor: string; borderColor: string }> = {
  success: {
    icon: 'checkmark-circle',
    backgroundColor: '#14b073',
    borderColor: '#14b073',
  },
  error: {
    icon: 'alert-circle',
    backgroundColor: '#fa5855',
    borderColor: '#fa5855',
  },
  warning: {
    icon: 'warning',
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  info: {
    icon: 'information-circle',
    backgroundColor: '#314de7',
    borderColor: '#314de7',
  },
};

export function Alert({
  type,
  title,
  message,
  onClose,
  autoClose = false,
  autoCloseDelay = 5000,
}: AlertProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(-50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onClose]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.();
    });
  };

  const config = AlertConfig[type];

  return (
    <Animated.View
      style={[
        styles.alert,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View
        style={[
          styles.alertIcon,
          { backgroundColor: config.backgroundColor, borderColor: config.borderColor },
        ]}
      >
        <Ionicons
          color="#fff"
          name={config.icon}
          size={30}
        />
      </View>

      <View style={styles.alertBody}>
        <Text style={styles.alertTitle}>{title}</Text>
        <Text style={styles.alertMessage}>{message}</Text>
      </View>

      {onClose && (
        <TouchableOpacity
          onPress={handleClose}
          style={styles.alertClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons color="#9a9a9a" name="close" size={24} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  alert: {
    position: 'relative',
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  alertIcon: {
    padding: 16,
    borderWidth: 1,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBody: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderLeftWidth: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: '#fff',
  },
  alertTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e1e1e',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9c9c9c',
  },
  alertClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

