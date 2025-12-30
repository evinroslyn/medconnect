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
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMedecin } from '../../hooks/useMedecin';
import { useNotifications } from '../../contexts/NotificationContext';

const { width } = Dimensions.get('window');

interface DoctorProfileScreenProps {
  navigation: any;
  route: any;
}

export const DoctorProfileScreen: React.FC<DoctorProfileScreenProps> = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState('about');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const medecinService = useMedecin();
  const { showNotification } = useNotifications();
  // Use doctor passed via navigation params if available
  const paramDoctor = route.params?.doctor;
  const doctor = paramDoctor ?? {
    id: 1,
    name: 'Dr. Jennifer Smith',
    specialty: 'Orthopedic Surgeon',
    hospital: 'City General Hospital',
    experience: '8 years experience',
    rating: 4.8,
    reviews: 127,
    patients: '1.2k',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
    about: 'Dr. Jennifer Smith is a highly experienced orthopedic surgeon specializing in foot and ankle procedures. She has been practicing for over 8 years and has successfully treated thousands of patients.',
    education: [
      'MD - Harvard Medical School (2015)',
      'Residency - Johns Hopkins Hospital (2019)',
      'Fellowship - Mayo Clinic (2020)',
    ],
    specializations: [
      'Foot & Ankle Surgery',
      'Sports Medicine',
      'Trauma Surgery',
      'Joint Replacement',
    ],
    workingHours: [
      { day: 'Monday', hours: '9:00 AM - 5:00 PM' },
      { day: 'Tuesday', hours: '9:00 AM - 5:00 PM' },
      { day: 'Wednesday', hours: '9:00 AM - 5:00 PM' },
      { day: 'Thursday', hours: '9:00 AM - 5:00 PM' },
      { day: 'Friday', hours: '9:00 AM - 3:00 PM' },
      { day: 'Saturday', hours: 'Closed' },
      { day: 'Sunday', hours: 'Closed' },
    ],
  };

  const handleConnectionRequest = () => {
    setConfirmModalVisible(true);
  };

  const sendConnexionRequest = async () => {
    setSendingRequest(true);
    try {
      const result = await medecinService.sendConnexionRequest(doctor.id);
      if (result.ok) {
        showNotification({
          type: 'success',
          title: 'Demande envoyée',
          message: 'Votre demande de connexion a été envoyée avec succès',
          autoClose: true,
          autoCloseDelay: 4000,
        });
        setConfirmModalVisible(false);
      } else {
        showNotification({
          type: 'error',
          title: 'Erreur',
          message: result.error || 'Impossible d\'envoyer la demande',
        });
      }
    } catch (e) {
      showNotification({ type: 'error', title: 'Erreur', message: 'Erreur réseau' });
    } finally {
      setSendingRequest(false);
    }
  };

  const reviews = [
    {
      id: 1,
      name: 'Sarah Johnson',
      rating: 5,
      date: '2 days ago',
      comment: 'Excellent doctor! Very professional and caring. Highly recommend.',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
    },
    {
      id: 2,
      name: 'Mike Wilson',
      rating: 4,
      date: '1 week ago',
      comment: 'Great experience. Dr. Smith explained everything clearly and the treatment was effective.',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
    },
  ];

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={14}
          color="#FFD700"
        />
      );
    }
    return stars;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'about':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.aboutText}>{doctor.about}</Text>
            
            <Text style={styles.subSectionTitle}>Education</Text>
            {doctor.education.map((edu, index) => (
              <Text key={index} style={styles.listItem}>• {edu}</Text>
            ))}
            
            <Text style={styles.subSectionTitle}>Specializations</Text>
            {doctor.specializations.map((spec, index) => (
              <Text key={index} style={styles.listItem}>• {spec}</Text>
            ))}
          </View>
        );
      
      case 'reviews':
        return (
          <View style={styles.tabContent}>
            {reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} />
                  <View style={styles.reviewInfo}>
                    <Text style={styles.reviewName}>{review.name}</Text>
                    <View style={styles.reviewRating}>
                      {renderStars(review.rating)}
                      <Text style={styles.reviewDate}>{review.date}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))}
          </View>
        );
      
      case 'schedule':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.subSectionTitle}>Working Hours</Text>
            {doctor.workingHours.map((schedule, index) => (
              <View key={index} style={styles.scheduleRow}>
                <Text style={styles.scheduleDay}>{schedule.day}</Text>
                <Text style={[
                  styles.scheduleHours,
                  schedule.hours === 'Closed' && styles.closedText
                ]}>
                  {schedule.hours}
                </Text>
              </View>
            ))}
          </View>
        );
      
      default:
        return null;
    }
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
        <Text style={styles.headerTitle}>Doctor Profile</Text>
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          {/* Hero */}
          <View style={styles.hero}>
            <Image source={{ uri: doctor.avatar }} style={styles.heroImage} />
            <View style={styles.heroOverlay}>
              <Text style={styles.heroName}>{doctor.name}</Text>
              <Text style={styles.heroSubtitle}>{doctor.specialty}</Text>
            </View>
          </View>

          {/* Doctor Info Card */}
          <View style={styles.doctorCard}>
            <View style={styles.doctorHeader}>
              <Image source={{ uri: doctor.avatar }} style={styles.doctorAvatar} />
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{doctor.name}</Text>
                <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
                <Text style={styles.doctorHospital}>{doctor.hospital}</Text>
                <Text style={styles.doctorExperience}>{doctor.experience}</Text>
              </View>
            </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="star" size={20} color="#FFD700" />
              </View>
              <Text style={styles.statValue}>{doctor.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="chatbubble" size={20} color="#6C5CE7" />
              </View>
              <Text style={styles.statValue}>{doctor.reviews}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="people" size={20} color="#4ECDC4" />
              </View>
              <Text style={styles.statValue}>{doctor.patients}</Text>
              <Text style={styles.statLabel}>Patients</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'about' && styles.activeTab]}
            onPress={() => setActiveTab('about')}
          >
            <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>
              About
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
              Reviews
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'schedule' && styles.activeTab]}
            onPress={() => setActiveTab('schedule')}
          >
            <Text style={[styles.tabText, activeTab === 'schedule' && styles.activeTabText]}>
              Schedule
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.callButton}
          onPress={() => {/* Handle call */}}
        >
          <Ionicons name="call" size={24} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.connectButton}
          onPress={handleConnectionRequest}
        >
          <Text style={styles.connectButtonText}>Demande de connexion</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => navigation.navigate('BookAppointment', { doctorId: doctor.id })}
        >
          <Text style={styles.bookButtonText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>

      {/* Confirmation Modal for sending connexion request */}
      <Modal
        visible={confirmModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Demande de connexion</Text>
              <TouchableOpacity
                onPress={() => setConfirmModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBodyInner}>
              <Text style={styles.modalMessage}>
                Voulez-vous envoyer une demande de connexion à {doctor.name} ?
              </Text>
            </View>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#E5E7EB' }]}
                onPress={() => setConfirmModalVisible(false)}
                disabled={sendingRequest}
              >
                <Text style={[styles.modalButtonText, { color: '#374151' }]}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#1E3A8A' }]}
                onPress={sendConnexionRequest}
                disabled={sendingRequest}
              >
                {sendingRequest ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Envoyer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  favoriteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  hero: {
    width: '100%',
    height: width * 0.45,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.95,
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroName: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroSubtitle: {
    color: '#F0F0F0',
    fontSize: 14,
    marginTop: 6,
  },
  doctorCard: {
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
  doctorHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  doctorAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  doctorInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 16,
    color: '#6C5CE7',
    marginBottom: 2,
  },
  doctorHospital: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  doctorExperience: {
    fontSize: 14,
    color: '#999',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#6C5CE7',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFF',
  },
  tabContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 100,
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  listItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  reviewCard: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  reviewComment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  scheduleDay: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  scheduleHours: {
    fontSize: 14,
    color: '#666',
  },
  closedText: {
    color: '#FF6B6B',
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  callButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  connectButton: {
    flex: 1,
    backgroundColor: '#4ECDC4',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    marginRight: 15,
  },
  connectButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bookButton: {
    flex: 1,
    backgroundColor: '#6C5CE7',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalBodyInner: {
    paddingVertical: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});