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
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AppointmentsScreenProps {
  navigation: any;
}

export const AppointmentsScreen: React.FC<AppointmentsScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  const upcomingAppointments = [
    {
      id: 1,
      doctor: 'Dr. Jennifer Smith',
      specialty: 'Orthopedic Surgeon',
      date: '2024-09-07',
      time: '10:30 AM',
      type: 'Clinic Visit',
      status: 'confirmed',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=60&h=60&fit=crop&crop=face',
    },
    {
      id: 2,
      doctor: 'Dr. Michael Johnson',
      specialty: 'Cardiologist',
      date: '2024-09-10',
      time: '2:00 PM',
      type: 'Video Call',
      status: 'pending',
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=60&h=60&fit=crop&crop=face',
    },
    {
      id: 3,
      doctor: 'Dr. Sarah Wilson',
      specialty: 'Dermatologist',
      date: '2024-09-15',
      time: '11:00 AM',
      type: 'Clinic Visit',
      status: 'confirmed',
      avatar: 'https://images.unsplash.com/photo-1594824388853-d0c2d8e8e8e8?w=60&h=60&fit=crop&crop=face',
    },
  ];

  const pastAppointments = [
    {
      id: 4,
      doctor: 'Dr. Robert Brown',
      specialty: 'Neurologist',
      date: '2024-08-25',
      time: '9:00 AM',
      type: 'Clinic Visit',
      status: 'completed',
      avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=60&h=60&fit=crop&crop=face',
    },
    {
      id: 5,
      doctor: 'Dr. Emily Davis',
      specialty: 'Pediatrician',
      date: '2024-08-20',
      time: '3:30 PM',
      type: 'Video Call',
      status: 'completed',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=60&h=60&fit=crop&crop=face',
    },
  ];

  const cancelledAppointments = [
    {
      id: 6,
      doctor: 'Dr. James Wilson',
      specialty: 'Orthopedic Surgeon',
      date: '2024-08-18',
      time: '1:00 PM',
      type: 'Clinic Visit',
      status: 'cancelled',
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=60&h=60&fit=crop&crop=face',
    },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#4ECDC4';
      case 'pending':
        return '#FFE66D';
      case 'completed':
        return '#6C5CE7';
      case 'cancelled':
        return '#FF6B6B';
      default:
        return '#999';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'pending':
        return 'Pending';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getCurrentAppointments = () => {
    switch (activeTab) {
      case 'upcoming':
        return upcomingAppointments;
      case 'past':
        return pastAppointments;
      case 'cancelled':
        return cancelledAppointments;
      default:
        return [];
    }
  };

  const renderAppointmentCard = (appointment: any) => (
    <TouchableOpacity
      key={appointment.id}
      style={styles.appointmentCard}
      onPress={() => {
        // navigation.navigate('AppointmentDetails', { appointmentId: appointment.id })
      }}
    >
      <View style={styles.appointmentHeader}>
        <Image source={{ uri: appointment.avatar }} style={styles.doctorAvatar} />
        <View style={styles.appointmentInfo}>
          <Text style={styles.doctorName}>{appointment.doctor}</Text>
          <Text style={styles.doctorSpecialty}>{appointment.specialty}</Text>
          <View style={styles.appointmentMeta}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text style={styles.appointmentDate}>{appointment.date}</Text>
            <Ionicons name="time-outline" size={14} color="#666" style={styles.timeIcon} />
            <Text style={styles.appointmentTime}>{appointment.time}</Text>
          </View>
        </View>
        <View style={styles.appointmentActions}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
            <Text style={styles.statusText}>{getStatusText(appointment.status)}</Text>
          </View>
          {appointment.type === 'Video Call' && (
            <TouchableOpacity style={styles.videoButton}>
              <Ionicons name="videocam" size={16} color="#6C5CE7" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View style={styles.appointmentFooter}>
        <View style={styles.appointmentType}>
          <Ionicons
            name={appointment.type === 'Video Call' ? 'videocam-outline' : 'business-outline'}
            size={16}
            color="#666"
          />
          <Text style={styles.appointmentTypeText}>{appointment.type}</Text>
        </View>
        
        {activeTab === 'upcoming' && (
          <View style={styles.appointmentButtons}>
            <TouchableOpacity style={styles.rescheduleButton}>
              <Text style={styles.rescheduleText}>Reschedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
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
        <Text style={styles.headerTitle}>My Appointments</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('doctors')}
        >
          <Ionicons name="add" size={24} color="#6C5CE7" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            Upcoming
          </Text>
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{upcomingAppointments.length}</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
            Past
          </Text>
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{pastAppointments.length}</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cancelled' && styles.activeTab]}
          onPress={() => setActiveTab('cancelled')}
        >
          <Text style={[styles.tabText, activeTab === 'cancelled' && styles.activeTabText]}>
            Cancelled
          </Text>
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{cancelledAppointments.length}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Appointments List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {getCurrentAppointments().length > 0 ? (
          getCurrentAppointments().map(renderAppointmentCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No Appointments</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'upcoming' 
                ? "You don't have any upcoming appointments"
                : activeTab === 'past'
                ? "No past appointments found"
                : "No cancelled appointments"
              }
            </Text>
            {activeTab === 'upcoming' && (
              <TouchableOpacity
                style={styles.bookNowButton}
                onPress={() => navigation.navigate('doctors')}
              >
                <Text style={styles.bookNowText}>Book Now</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('index')}
        >
          <Ionicons name="home-outline" size={24} color="#999" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            // navigation.navigate('Treatment')
          }}
        >
          <Ionicons name="medical-outline" size={24} color="#999" />
          <Text style={styles.navText}>Treatment</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <Ionicons name="calendar" size={24} color="#6C5CE7" />
          <Text style={[styles.navText, styles.activeNavText]}>Appointments</Text>
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
          onPress={() => {
            // navigation.navigate('Profile')
          }}
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
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#6C5CE7',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginRight: 6,
  },
  activeTabText: {
    color: '#FFF',
  },
  tabBadge: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  appointmentCard: {
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
  appointmentHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  doctorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  appointmentInfo: {
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
    marginBottom: 6,
  },
  appointmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  timeIcon: {
    marginLeft: 12,
  },
  appointmentTime: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  appointmentActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
  },
  videoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0EFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  appointmentType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentTypeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  appointmentButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  rescheduleButton: {
    backgroundColor: '#F0EFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  rescheduleText: {
    fontSize: 12,
    color: '#6C5CE7',
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#FFE8E8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  bookNowButton: {
    backgroundColor: '#6C5CE7',
    borderRadius: 25,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  bookNowText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
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