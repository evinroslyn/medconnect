import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MedicalRecordsScreenProps {
  navigation: any;
}

export const MedicalRecordsScreen: React.FC<MedicalRecordsScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('all');

  const medicalRecords = [
    {
      id: 1,
      title: 'Blood Test Results',
      type: 'Resultat_Labo',
      date: '2024-09-01',
      doctor: 'Dr. Jennifer Smith',
      status: 'Normal',
      icon: 'flask-outline',
      color: '#4ECDC4',
      fileSize: '2.3 MB',
      hasFile: true,
    },
    {
      id: 2,
      title: 'X-Ray Chest',
      type: 'Radio',
      date: '2024-08-28',
      doctor: 'Dr. Michael Johnson',
      status: 'Review Required',
      icon: 'scan-outline',
      color: '#FFE66D',
      fileSize: '5.1 MB',
      hasFile: true,
    },
    {
      id: 3,
      title: 'Prescription - Antibiotics',
      type: 'Ordonnance',
      date: '2024-08-25',
      doctor: 'Dr. Sarah Wilson',
      status: 'Active',
      icon: 'medical-outline',
      color: '#6C5CE7',
      fileSize: '1.2 MB',
      hasFile: true,
    },
    {
      id: 4,
      title: 'Cardiology Consultation Notes',
      type: 'Notes',
      date: '2024-08-20',
      doctor: 'Dr. Robert Brown',
      status: 'Completed',
      icon: 'document-text-outline',
      color: '#FF6B6B',
      fileSize: '0.8 MB',
      hasFile: false,
    },
    {
      id: 5,
      title: 'MRI Brain Scan',
      type: 'Imagerie',
      date: '2024-08-15',
      doctor: 'Dr. Emily Davis',
      status: 'Normal',
      icon: 'scan-circle-outline',
      color: '#A8E6CF',
      fileSize: '12.5 MB',
      hasFile: true,
    },
  ];

  const categories = [
    { id: 'all', name: 'All', count: medicalRecords.length },
    { id: 'Resultat_Labo', name: 'Lab Results', count: medicalRecords.filter(r => r.type === 'Resultat_Labo').length },
    { id: 'Radio', name: 'X-Rays', count: medicalRecords.filter(r => r.type === 'Radio').length },
    { id: 'Ordonnance', name: 'Prescriptions', count: medicalRecords.filter(r => r.type === 'Ordonnance').length },
    { id: 'Imagerie', name: 'Imaging', count: medicalRecords.filter(r => r.type === 'Imagerie').length },
  ];

  const filteredRecords = activeTab === 'all' 
    ? medicalRecords 
    : medicalRecords.filter(record => record.type === activeTab);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'normal':
        return '#4ECDC4';
      case 'active':
        return '#6C5CE7';
      case 'completed':
        return '#999';
      case 'review required':
        return '#FFE66D';
      default:
        return '#999';
    }
  };

  const handleRecordPress = (record: any) => {
    navigation.navigate('MedicalRecordDetail', { recordId: record.id });
  };

  const handleUploadNew = () => {
    Alert.alert(
      'Upload New Record',
      'Choose the type of medical record you want to upload',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => navigation.navigate('CameraUpload') },
        { text: 'Choose from Gallery', onPress: () => navigation.navigate('GalleryUpload') },
        { text: 'Scan Document', onPress: () => navigation.navigate('DocumentScanner') },
      ]
    );
  };

  const renderRecordCard = ({ item: record }: { item: any }) => (
    <TouchableOpacity
      style={styles.recordCard}
      onPress={() => handleRecordPress(record)}
    >
      <View style={styles.recordHeader}>
        <View style={[styles.recordIcon, { backgroundColor: record.color + '20' }]}>
          <Ionicons name={record.icon} size={24} color={record.color} />
        </View>
        
        <View style={styles.recordInfo}>
          <Text style={styles.recordTitle}>{record.title}</Text>
          <Text style={styles.recordDoctor}>by {record.doctor}</Text>
          <Text style={styles.recordDate}>{record.date}</Text>
        </View>
        
        <View style={styles.recordActions}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(record.status) }]}>
            <Text style={styles.statusText}>{record.status}</Text>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={16} color="#CCC" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.recordFooter}>
        <View style={styles.fileInfo}>
          {record.hasFile && (
            <>
              <Ionicons name="attach-outline" size={14} color="#666" />
              <Text style={styles.fileSize}>{record.fileSize}</Text>
            </>
          )}
        </View>
        
        <View style={styles.recordButtons}>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={16} color="#6C5CE7" />
          </TouchableOpacity>
          
          {record.hasFile && (
            <TouchableOpacity style={styles.downloadButton}>
              <Ionicons name="download-outline" size={16} color="#4ECDC4" />
            </TouchableOpacity>
          )}
        </View>
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
        <Text style={styles.headerTitle}>Medical Records</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleUploadNew}
        >
          <Ionicons name="add" size={24} color="#6C5CE7" />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              activeTab === category.id && styles.activeCategoryChip
            ]}
            onPress={() => setActiveTab(category.id)}
          >
            <Text style={[
              styles.categoryChipText,
              activeTab === category.id && styles.activeCategoryChipText
            ]}>
              {category.name}
            </Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{category.count}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Records List */}
      {filteredRecords.length > 0 ? (
        <FlatList
          data={filteredRecords}
          renderItem={renderRecordCard}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.recordsList}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>No Records Found</Text>
          <Text style={styles.emptySubtitle}>
            You don't have any medical records in this category yet.
          </Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUploadNew}
          >
            <Text style={styles.uploadButtonText}>Upload First Record</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="home-outline" size={24} color="#999" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Treatment')}
        >
          <Ionicons name="medical-outline" size={24} color="#999" />
          <Text style={styles.navText}>Treatment</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Appointments')}
        >
          <Ionicons name="calendar-outline" size={24} color="#999" />
          <Text style={styles.navText}>Appointments</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <Ionicons name="document-text" size={24} color="#6C5CE7" />
          <Text style={[styles.navText, styles.activeNavText]}>Records</Text>
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
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeCategoryChip: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginRight: 6,
  },
  activeCategoryChipText: {
    color: '#FFF',
  },
  categoryBadge: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
  },
  categoryBadgeText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
  },
  recordsList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  recordCard: {
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
  recordHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  recordIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  recordDoctor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  recordDate: {
    fontSize: 12,
    color: '#999',
  },
  recordActions: {
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
  moreButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  recordButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0EFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8FFF8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
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
  uploadButton: {
    backgroundColor: '#6C5CE7',
    borderRadius: 25,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  uploadButtonText: {
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