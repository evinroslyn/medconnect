import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

interface DatePickerProps {
  label?: string;
  value: string; // Format: YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  style?: any;
}

/**
 * Composant de sélection de date avec calendrier
 */
export function DatePicker({
  label,
  value,
  onChange,
  placeholder = "Sélectionner une date",
  minimumDate,
  maximumDate,
  style,
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(
    value ? new Date(value + "T00:00:00") : new Date()
  );

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }

    if (date) {
      setSelectedDate(date);
      onChange(formatDate(date));
      
      if (Platform.OS === "ios") {
        // Sur iOS, on garde le picker ouvert pour permettre la sélection de l'heure si nécessaire
        // Mais pour les dates seulement, on ferme après sélection
        setShowPicker(false);
      }
    }
  };

  const openPicker = () => {
    if (value) {
      setSelectedDate(new Date(value + "T00:00:00"));
    }
    setShowPicker(true);
  };

  return (
    <View style={style}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity style={styles.dateInput} onPress={openPicker}>
        <Ionicons name="calendar-outline" size={20} color="#6B7280" style={styles.calendarIcon} />
        <Text style={[styles.dateText, !value && styles.placeholderText]}>
          {value ? formatDisplayDate(value) : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
      </TouchableOpacity>

      {showPicker && (
        <>
          {Platform.OS === "ios" ? (
            <Modal
              visible={showPicker}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowPicker(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowPicker(false)}>
                      <Text style={styles.modalCancelText}>Annuler</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Sélectionner une date</Text>
                    <TouchableOpacity
                      onPress={() => {
                        onChange(formatDate(selectedDate));
                        setShowPicker(false);
                      }}
                    >
                      <Text style={styles.modalConfirmText}>Confirmer</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="spinner"
                    onChange={(event, date) => {
                      if (date) {
                        setSelectedDate(date);
                      }
                    }}
                    minimumDate={minimumDate}
                    maximumDate={maximumDate}
                    locale="fr_FR"
                    style={styles.iosPicker}
                  />
                </View>
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              locale="fr_FR"
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#FFFFFF",
    minHeight: 48,
  },
  calendarIcon: {
    marginRight: 8,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  placeholderText: {
    color: "#9CA3AF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  modalCancelText: {
    fontSize: 16,
    color: "#6B7280",
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  iosPicker: {
    height: 200,
  },
});

