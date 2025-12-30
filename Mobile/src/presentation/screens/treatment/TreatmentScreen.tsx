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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TreatmentScreenProps {
  navigation: any;
}

export const TreatmentScreen: React.FC<TreatmentScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('schedule');

  const patientInfo = {
    name: 'Esther Howard',
    gender: 'Female, 23y.o',
    height: 'Height: 5.4"',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    treatmentPlans: 3,
  };

  const checkupSchedule = [
    {
      id: 1,
      date: 'Sep 07',
      type: 'Clinic Visit',
      subtype: 'Appointment',
      doctor: 'Dr. Jennifer',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=40&h=40&fit=crop&crop=face',
      time: '10:30 AM',
    },
    {
      id: 2,
      date: 'Sep 07',
      type: 'Video',
      subtype: 'Consulting',
      doctor: 'Dr. Jaffaer',
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=40&h=40&fit=crop&crop=face',
      time: '2:00 PM',
    },
  ];

  const recommendedDoctors = [
    {
      id: 1,
      name: 'Dr. Roman Novara',
      specialty: 'Pulmonologist',
      experience: '5 years experience',
      avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=80&h=80&fit=crop&crop=face',
      rating: 4.8,
    },
    {
      id: 2,
      name: 'Dr. Sarah Wilson',
      specialty: 'Cardiologist',
      experience: '8 years experience',
      avatar: 'https://images.unsplash.com/photo-1594824388853-d0c2d8e8e8e8?w=80&h=80&fit=crop&crop=face',
      rating: 4.9,
    },
  ];

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
        <Text style={styles.headerTitle}>My Treatment</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Patient Info Card */}
        <View style={styles.patientCard}>
          <View style={styles.patientInfo}>
            <View style={styles.patientDetails}>
              <Text style={styles.patientName}>{patientInfo.name}</Text>
              <Text style={styles.patientMeta}>{patientInfo.gender}</Text>
              <Text style={styles.patientMeta}>{patientInfo.height}</Text>
            </View>
            <Image
              source={{ uri: patientInfo.avatar }}
              style={styles.patientAvatar}
            />
          </View>
          
          <TouchableOpacity style={styles.treatmentPlansButton}>
            <Text style={styles.treatmentPlansText}>
              {patientInfo.treatmentPlans} Treatment Plans
            </Text>
          </TouchableOpacity>
        </View>

        {/* My Checkup Schedule */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Checkup Schedule</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scheduleContainer}>
          {checkupSchedule.map((appointment) => (
            <TouchableOpacity
              key={appointment.id}
              style={styles.scheduleCard}
              onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: appointment.id })}
            >
              <View style={styles.scheduleDate}>
                <Ionicons name="calendar-outline" size={20} color="#6C5CE7" />
                <Text style={styles.scheduleDateText}>{appointment.date}</Text>
              </View>
              
              <View style={styles.scheduleContent}>
                <View style={styles.scheduleInfo}>
                  <Text style={styles.scheduleType}>{appointment.type}</Text>
                  <Text style={styles.scheduleSubtype}>{appointment.subtype}</Text>
                </View>
                
                <View style={styles.scheduleDoctorInfo}>
                  <Image
                    source={{ uri: appointment.avatar }}
                    style={styles.scheduleDoctorAvatar}
                  />
                  <Text style={styles.scheduleDoctorName}>{appointment.doctor}</Text>
                </View>
              </View>
              
              {appointment.type === 'Video' && (
                <TouchableOpacity style={styles.videoCallButton}>
                  <Ionicons name="videocam" size={16} color="#FFF" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Recommend Doctor */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommend Doctor</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.doctorsGrid}>
          {recommendedDoctors.map((doctor) => (
            <TouchableOpacity
              key={doctor.id}
              style={styles.doctorRecommendCard}
              onPress={() => navigation.navigate('DoctorProfile', { doctorId: doctor.id })}
            >
              <Image
                source={{ uri: doctor.avatar }}
                style={styles.doctorRecommendAvatar}
              />
              <Text style={styles.doctorRecommendName}>{doctor.name}</Text>
              <Text style={styles.doctorRecommendSpecialty}>{doctor.specialty}</Text>
              <Text style={styles.doctorRecommendExperience}>{doctor.experience}</Text>
              
              <View style={styles.doctorRecommendFooter}>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.ratingText}>{doctor.rating}</Text>
                </View>
                <TouchableOpacity style={styles.visitNowButton}>
                  <Text style={styles.visitNowText}>Visit Now</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="home-outline" size={24} color="#999" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <Ionicons name="medical" size={24} color="#6C5CE7" />
          <Text style={[styles.navText, styles.activeNavText]}>Treatment</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Appointments')}
        >
          <Ionicons name="calendar-outline" size={24} color="#999" />
          <Text style={styles.navText}>Appointments</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('MedicalRecords')}
        >
          <Ionicons name="document-text-outline" size={24} color="#999" />
          <Text style={styles.navText}>Records</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person-outline" size={24} color="#999" />
          <Text style={styles.navText}>Profile</Text>
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
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  patientCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  patientMeta: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  patientAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  treatmentPlansButton: {
    backgroundColor: '#6C5CE7',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  treatmentPlansText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#6C5CE7',
    fontWeight: '500',
  },
  scheduleContainer: {
    marginBottom: 30,
  },
  scheduleCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  scheduleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  scheduleSubtype: {
    fontSize: 14,
    color: '#666',
  },
  scheduleDoctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleDoctorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  scheduleDoctorName: {
    fontSize: 14,
    color: '#666',
  },
  videoCallButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#6C5CE7',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 100,
  },
  doctorRecommendCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  doctorRecommendAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
  },
  doctorRecommendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  doctorRecommendSpecialty: {
    fontSize: 14,
    color: '#6C5CE7',
    marginBottom: 2,
  },
  doctorRecommendExperience: {
    fontSize: 12,
    color: '#999',
    marginBottom: 15,
  },
  doctorRecommendFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  visitNowButton: {
    backgroundColor: '#6C5CE7',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  visitNowText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeNavItem: {
    backgroundColor: '#F0EFFF',
    borderRadius: 12,
  },
  navText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  activeNavText: {
    color: '#6C5CE7',
    fontWeight: '500',
  },
});