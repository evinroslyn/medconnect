import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '../../../application/services/AuthService';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const userData = await AuthService.getUser();
    setUser(userData);
  };

  const specialties = [
    { id: 1, name: 'Neurologist', icon: '🧠', color: '#FF6B6B' },
    { id: 2, name: 'Cardiologist', icon: '❤️', color: '#4ECDC4' },
    { id: 3, name: 'Orthopedist', icon: '🦴', color: '#FFE66D' },
    { id: 4, name: 'Pulmonologist', icon: '🫁', color: '#A8E6CF' },
  ];

  const upcomingAppointment = {
    doctor: 'Dr. Jennifer Smith',
    specialty: 'Orthopedic Consultation (Foot & Ankle)',
    date: 'Wed, 7 Sep 2024',
    time: '10:30 - 11:30 AM',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face',
  };

  const recentDoctors = [
    {
      id: 1,
      name: 'Dr. Warner',
      specialty: 'Neurology',
      experience: '5 years experience',
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face',
    },
    {
      id: 2,
      name: 'Dr. Martin',
      specialty: 'Cardiology',
      experience: '8 years experience',
      avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=100&h=100&fit=crop&crop=face',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>{user?.nom || 'User'}!</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face' }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Doctor"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        {/* Specialties */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.specialtiesContainer}
          contentContainerStyle={styles.specialtiesContent}
        >
          {specialties.map((specialty) => (
            <TouchableOpacity
              key={specialty.id}
              style={styles.specialtyCard}
              onPress={() => navigation.navigate('doctors', { specialty: specialty.name })}
            >
              <View style={[styles.specialtyIcon, { backgroundColor: specialty.color }]}>
                <Text style={styles.specialtyEmoji}>{specialty.icon}</Text>
              </View>
              <Text style={styles.specialtyName}>{specialty.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Upcoming Appointment */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Appointment</Text>
        </View>

        <TouchableOpacity
          style={styles.appointmentCard}
          onPress={() => { /* navigation.navigate('AppointmentDetails') */ }}
        >
          <View style={styles.appointmentHeader}>
            <Image
              source={{ uri: upcomingAppointment.avatar }}
              style={styles.doctorAvatar}
            />
            <View style={styles.appointmentInfo}>
              <Text style={styles.doctorName}>{upcomingAppointment.doctor}</Text>
              <Text style={styles.appointmentSpecialty}>{upcomingAppointment.specialty}</Text>
            </View>
          </View>
          
          <View style={styles.appointmentDetails}>
            <View style={styles.appointmentTime}>
              <Ionicons name="calendar-outline" size={16} color="#FFF" />
              <Text style={styles.appointmentDate}>{upcomingAppointment.date}</Text>
            </View>
            <View style={styles.appointmentTime}>
              <Ionicons name="time-outline" size={16} color="#FFF" />
              <Text style={styles.appointmentTimeText}>{upcomingAppointment.time}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Recent Visits */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Recent Visit</Text>
          <TouchableOpacity onPress={() => { /* navigation.navigate('VisitHistory') */ }}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.doctorsContainer}
          contentContainerStyle={styles.doctorsContent}
        >
          {recentDoctors.map((doctor) => (
            <TouchableOpacity
              key={doctor.id}
              style={styles.doctorCard}
              onPress={() => { /* navigation.navigate('DoctorProfile', { doctorId: doctor.id }) */ }}
            >
              <Image source={{ uri: doctor.avatar }} style={styles.doctorCardAvatar} />
              <Text style={styles.doctorCardName}>{doctor.name}</Text>
              <Text style={styles.doctorCardSpecialty}>{doctor.specialty}</Text>
              <Text style={styles.doctorCardExperience}>{doctor.experience}</Text>
              
              <View style={styles.doctorCardActions}>
                <TouchableOpacity style={styles.bookButton}>
                  <Ionicons name="calendar-outline" size={16} color="#6C5CE7" />
                  <Text style={styles.bookButtonText}>Book Now</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.callButton}>
                  <Ionicons name="call-outline" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <Ionicons name="home" size={24} color="#6C5CE7" />
          <Text style={[styles.navText, styles.activeNavText]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => { /* navigation.navigate('Treatment') */ }}
        >
          <Ionicons name="medical-outline" size={24} color="#999" />
          <Text style={styles.navText}>Treatment</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('appointments')}
        >
          <Ionicons name="calendar-outline" size={24} color="#999" />
          <Text style={styles.navText}>Appointments</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('records')}
        >
          <Ionicons name="document-text-outline" size={24} color="#999" />
          <Text style={styles.navText}>Records</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => { /* navigation.navigate('Profile') */ }}
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
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    marginRight: 15,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  specialtiesContainer: {
    marginBottom: 30,
  },
  specialtiesContent: {
    paddingRight: 20,
  },
  specialtyCard: {
    alignItems: 'center',
    marginRight: 20,
    width: 80,
  },
  specialtyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  specialtyEmoji: {
    fontSize: 24,
  },
  specialtyName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
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
  appointmentCard: {
    backgroundColor: '#6C5CE7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  doctorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  appointmentInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  appointmentSpecialty: {
    fontSize: 14,
    color: '#E8E8FF',
  },
  appointmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentDate: {
    fontSize: 14,
    color: '#FFF',
    marginLeft: 8,
  },
  appointmentTimeText: {
    fontSize: 14,
    color: '#FFF',
    marginLeft: 8,
  },
  doctorsContainer: {
    marginBottom: 100,
  },
  doctorsContent: {
    paddingRight: 20,
  },
  doctorCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 15,
    marginRight: 15,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  doctorCardAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
  },
  doctorCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  doctorCardSpecialty: {
    fontSize: 14,
    color: '#6C5CE7',
    marginBottom: 2,
  },
  doctorCardExperience: {
    fontSize: 12,
    color: '#999',
    marginBottom: 15,
  },
  doctorCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  bookButtonText: {
    fontSize: 12,
    color: '#6C5CE7',
    marginLeft: 4,
    fontWeight: '500',
  },
  callButton: {
    backgroundColor: '#6C5CE7',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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