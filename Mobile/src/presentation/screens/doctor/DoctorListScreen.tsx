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
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DoctorListScreenProps {
  navigation: any;
  route: any;
}

export const DoctorListScreen: React.FC<DoctorListScreenProps> = ({ navigation, route }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(route.params?.specialty || 'All');
  const [sortBy, setSortBy] = useState('rating');

  const specialties = [
    'All', 'Cardiologist', 'Neurologist', 'Orthopedist', 
    'Dermatologist', 'Pediatrician', 'Pulmonologist'
  ];

  const doctors = [
    {
      id: 1,
      name: 'Dr. Jennifer Smith',
      specialty: 'Orthopedic Surgeon',
      hospital: 'City General Hospital',
      experience: '8 years',
      rating: 4.8,
      reviews: 127,
      consultationFee: 150,
      nextAvailable: 'Today, 2:00 PM',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=80&h=80&fit=crop&crop=face',
      isOnline: true,
    },
    {
      id: 2,
      name: 'Dr. Michael Johnson',
      specialty: 'Cardiologist',
      hospital: 'Heart Care Center',
      experience: '12 years',
      rating: 4.9,
      reviews: 203,
      consultationFee: 200,
      nextAvailable: 'Tomorrow, 10:00 AM',
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=80&h=80&fit=crop&crop=face',
      isOnline: false,
    },
    {
      id: 3,
      name: 'Dr. Sarah Wilson',
      specialty: 'Dermatologist',
      hospital: 'Skin Care Clinic',
      experience: '6 years',
      rating: 4.7,
      reviews: 89,
      consultationFee: 120,
      nextAvailable: 'Today, 4:30 PM',
      avatar: 'https://images.unsplash.com/photo-1594824388853-d0c2d8e8e8e8?w=80&h=80&fit=crop&crop=face',
      isOnline: true,
    },
    {
      id: 4,
      name: 'Dr. Robert Brown',
      specialty: 'Neurologist',
      hospital: 'Brain & Spine Center',
      experience: '15 years',
      rating: 4.9,
      reviews: 156,
      consultationFee: 250,
      nextAvailable: 'Monday, 9:00 AM',
      avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=80&h=80&fit=crop&crop=face',
      isOnline: false,
    },
  ];

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All' || 
                            doctor.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase());
    return matchesSearch && matchesSpecialty;
  });

  const sortedDoctors = [...filteredDoctors].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'experience':
        return parseInt(b.experience) - parseInt(a.experience);
      case 'fee':
        return a.consultationFee - b.consultationFee;
      default:
        return 0;
    }
  });

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={12}
          color="#FFD700"
        />
      );
    }
    return stars;
  };

  const renderDoctorCard = ({ item: doctor }: { item: any }) => (
    <TouchableOpacity
      style={styles.doctorCard}
      onPress={() => navigation.navigate('DoctorProfile', { doctor })}
    >
      <View style={styles.doctorHeader}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: doctor.avatar }} style={styles.doctorAvatar} />
          {doctor.isOnline && <View style={styles.onlineIndicator} />}
        </View>
        
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{doctor.name}</Text>
          <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
          <Text style={styles.doctorHospital}>{doctor.hospital}</Text>
          <Text style={styles.doctorExperience}>{doctor.experience} experience</Text>
        </View>
        
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={20} color="#CCC" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.doctorStats}>
        <View style={styles.ratingContainer}>
          <View style={styles.stars}>
            {renderStars(doctor.rating)}
          </View>
          <Text style={styles.ratingText}>{doctor.rating}</Text>
          <Text style={styles.reviewsText}>({doctor.reviews} reviews)</Text>
        </View>
        
        <Text style={styles.consultationFee}>${doctor.consultationFee}</Text>
      </View>
      
      <View style={styles.doctorFooter}>
        <View style={styles.availabilityContainer}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.availabilityText}>{doctor.nextAvailable}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => navigation.navigate('BookAppointmentScreen', { doctor: doctor })}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>Find Doctors</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search doctors, specialties..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Specialties Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.specialtiesContainer}
        contentContainerStyle={styles.specialtiesContent}
      >
        {specialties.map((specialty) => (
          <TouchableOpacity
            key={specialty}
            style={[
              styles.specialtyChip,
              selectedSpecialty === specialty && styles.activeSpecialtyChip
            ]}
            onPress={() => setSelectedSpecialty(specialty)}
          >
            <Text style={[
              styles.specialtyChipText,
              selectedSpecialty === specialty && styles.activeSpecialtyChipText
            ]}>
              {specialty}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.resultsCount}>
          {sortedDoctors.length} doctors found
        </Text>
        
        <View style={styles.sortButtons}>
          {['rating', 'experience', 'fee'].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.sortButton,
                sortBy === option && styles.activeSortButton
              ]}
              onPress={() => setSortBy(option)}
            >
              <Text style={[
                styles.sortButtonText,
                sortBy === option && styles.activeSortButtonText
              ]}>
                {option === 'rating' ? 'Rating' : 
                 option === 'experience' ? 'Experience' : 'Fee'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Doctors List */}
      <FlatList
        data={sortedDoctors}
        renderItem={renderDoctorCard}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.doctorsList}
      />
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
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 20,
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
    marginBottom: 20,
  },
  specialtiesContent: {
    paddingHorizontal: 20,
  },
  specialtyChip: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeSpecialtyChip: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  specialtyChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeSpecialtyChipText: {
    color: '#FFF',
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
  },
  sortButtons: {
    flexDirection: 'row',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  activeSortButton: {
    backgroundColor: '#F0EFFF',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeSortButtonText: {
    color: '#6C5CE7',
  },
  doctorsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  doctorCard: {
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
  doctorHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  doctorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4ECDC4',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#6C5CE7',
    marginBottom: 2,
  },
  doctorHospital: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  doctorExperience: {
    fontSize: 12,
    color: '#999',
  },
  favoriteButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginRight: 6,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 4,
  },
  reviewsText: {
    fontSize: 12,
    color: '#666',
  },
  consultationFee: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C5CE7',
  },
  doctorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  availabilityText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  bookButton: {
    backgroundColor: '#6C5CE7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});