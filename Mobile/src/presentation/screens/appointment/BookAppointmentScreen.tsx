import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BookAppointmentScreenProps {
  navigation: any;
  route: any;
}

export const BookAppointmentScreen: React.FC<BookAppointmentScreenProps> = ({ navigation, route }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('clinic');

  const { doctor } = route.params;

  const availableDates = [
    { date: '2024-09-07', day: 'Sat', dayNum: '07' },
    { date: '2024-09-08', day: 'Sun', dayNum: '08' },
    { date: '2024-09-09', day: 'Mon', dayNum: '09' },
    { date: '2024-09-10', day: 'Tue', dayNum: '10' },
    { date: '2024-09-11', day: 'Wed', dayNum: '11' },
    { date: '2024-09-12', day: 'Thu', dayNum: '12' },
    { date: '2024-09-13', day: 'Fri', dayNum: '13' },
  ];

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  ];

  const handleBookAppointment = () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Error', 'Please select both date and time for your appointment');
      return;
    }

    Alert.alert(
      'Confirm Appointment',
      `Book appointment with ${doctor.name} on ${selectedDate} at ${selectedTime}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            // Handle booking logic here
            Alert.alert('Success', 'Appointment booked successfully!', [
              { text: 'OK', onPress: () => navigation.navigate('appointments') }
            ]);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Doctor Info */}
        <View style={styles.doctorCard}>
          <Image source={{ uri: doctor.avatar }} style={styles.doctorAvatar} />
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{doctor.name}</Text>
            <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{doctor.rating}</Text>
            </View>
          </View>
          <View style={styles.consultationFee}>
            <Text style={styles.feeLabel}>Consultation Fee</Text>
            <Text style={styles.feeAmount}>${doctor.consultationFee}</Text>
          </View>
        </View>

        {/* Appointment Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appointment Type</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                appointmentType === 'clinic' && styles.activeTypeButton
              ]}
              onPress={() => setAppointmentType('clinic')}
            >
              <Ionicons
                name="business-outline"
                size={24}
                color={appointmentType === 'clinic' ? '#FFF' : '#666'}
              />
              <Text style={[
                styles.typeText,
                appointmentType === 'clinic' && styles.activeTypeText
              ]}>
                Clinic Visit
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.typeButton,
                appointmentType === 'video' && styles.activeTypeButton
              ]}
              onPress={() => setAppointmentType('video')}
            >
              <Ionicons
                name="videocam-outline"
                size={24}
                color={appointmentType === 'video' ? '#FFF' : '#666'}
              />
              <Text style={[
                styles.typeText,
                appointmentType === 'video' && styles.activeTypeText
              ]}>
                Video Call
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Select Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.datesContainer}
            contentContainerStyle={styles.datesContent}
          >
            {availableDates.map((dateItem) => (
              <TouchableOpacity
                key={dateItem.date}
                style={[
                  styles.dateButton,
                  selectedDate === dateItem.date && styles.activeDateButton
                ]}
                onPress={() => setSelectedDate(dateItem.date)}
              >
                <Text style={[
                  styles.dayText,
                  selectedDate === dateItem.date && styles.activeDateText
                ]}>
                  {dateItem.day}
                </Text>
                <Text style={[
                  styles.dayNumText,
                  selectedDate === dateItem.date && styles.activeDateText
                ]}>
                  {dateItem.dayNum}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Select Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Time</Text>
          <View style={styles.timeSlotsContainer}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeSlot,
                  selectedTime === time && styles.activeTimeSlot
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text style={[
                  styles.timeText,
                  selectedTime === time && styles.activeTimeText
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary */}
        {selectedDate && selectedTime && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Appointment Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Doctor:</Text>
              <Text style={styles.summaryValue}>{doctor.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date:</Text>
              <Text style={styles.summaryValue}>{selectedDate}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Time:</Text>
              <Text style={styles.summaryValue}>{selectedTime}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Type:</Text>
              <Text style={styles.summaryValue}>
                {appointmentType === 'clinic' ? 'Clinic Visit' : 'Video Call'}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>${doctor.consultationFee}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Book Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.bookButton,
            (!selectedDate || !selectedTime) && styles.disabledButton
          ]}
          onPress={handleBookAppointment}
          disabled={!selectedDate || !selectedTime}
        >
          <Text style={styles.bookButtonText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  doctorCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  doctorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#6C5CE7',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  consultationFee: {
    alignItems: 'flex-end',
  },
  feeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  feeAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6C5CE7',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  typeButton: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  activeTypeButton: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  typeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
  },
  activeTypeText: {
    color: '#FFF',
  },
  datesContainer: {
    marginBottom: 10,
  },
  datesContent: {
    paddingRight: 20,
  },
  dateButton: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 60,
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  activeDateButton: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  dayText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dayNumText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  activeDateText: {
    color: '#FFF',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  activeTimeSlot: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTimeText: {
    color: '#FFF',
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6C5CE7',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  bookButton: {
    backgroundColor: '#6C5CE7',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});