import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { Alert, AlertType } from '../components/common/Alert';

export interface Notification {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const newNotification: Notification = { ...notification, id };
    
    setNotifications((prev) => [...prev, newNotification]);

    if (notification.autoClose !== false) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.autoCloseDelay || 5000);
    }
  }, [removeNotification]);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        removeNotification,
        clearAll,
      }}
    >
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      {notifications.map((notification) => (
        <Alert
          key={notification.id}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => removeNotification(notification.id)}
          autoClose={notification.autoClose}
          autoCloseDelay={notification.autoCloseDelay}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 60,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
});

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

