import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const HouseholdDetails = ({ route }) => {
  const { household } = route.params;
  const navigation = useNavigation();

  const getVulnerabilityLevel = (score) => {
    if (score >= 12) return { level: 'High', color: '#e74c3c' };
    if (score >= 6) return { level: 'Medium', color: '#f39c12' };
    return { level: 'Low', color: '#27ae60' };
  };

  const vulnerability = getVulnerabilityLevel(household?.povertyScore);

  return (
    <ScrollView style={styles.container}>
      {household?.photo && (
        <Image source={{ uri: household.photo }} style={styles.photo} />
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location Information</Text>
        <Text style={styles.detailText}>Sub-location: {household?.subLocation || 'N/A'}</Text>
        <Text style={styles.detailText}>Village: {household?.village || 'N/A'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Household Head Details</Text>
        <Text style={styles.detailText}>Name: {household?.headDetails?.name || 'N/A'}</Text>
        <Text style={styles.detailText}>Age: {household?.headDetails?.age || 'N/A'}</Text>
        <Text style={styles.detailText}>Gender: {household?.headDetails?.gender || 'N/A'}</Text>
        <Text style={styles.detailText}>ID Number: {household?.headDetails?.idNumber || 'N/A'}</Text>
        <Text style={styles.detailText}>Phone: {household?.headDetails?.phoneNumber || 'N/A'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Household Members</Text>
        <Text style={styles.detailText}>Children: {household?.householdDetails?.children || 'N/A'}</Text>
        <Text style={styles.detailText}>Elderly: {household?.householdDetails?.elderly || 'N/A'}</Text>
        <Text style={styles.detailText}>Disabled Members: {household?.householdDetails?.disabled || 'N/A'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vulnerability Assessment</Text>
        <View style={[styles.vulnerabilityTag, { backgroundColor: vulnerability.color }]}>
          <Text style={styles.vulnerabilityText}>
            {vulnerability.level} Vulnerability
          </Text>
        </View>
        
        {Object.entries(household?.assessmentAnswers || {}).map(([key, value]) => (
          <Text key={key} style={styles.detailText}>
            {key.charAt(0).toUpperCase() + key.slice(1)}: {value}
          </Text>
        ))}
      </View>

      {household?.geoCoordinates && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GPS Location</Text>
          <Text style={styles.detailText}>
            Latitude: {household?.geoCoordinates?.latitude || 'N/A'}
          </Text>
          <Text style={styles.detailText}>
            Longitude: {household?.geoCoordinates?.longitude || 'N/A'}
          </Text>
        </View>
      )}

      <TouchableOpacity 
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <LinearGradient
          colors={['#3498db', '#2980b9']}
          style={styles.backButtonGradient}
        >
          <Text style={styles.backButtonText}>Back to List</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f9',
    padding: 16,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 8,
  },
  vulnerabilityTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 12,
  },
  vulnerabilityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  backButton: {
    marginVertical: 16,
  },
  backButtonGradient: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default HouseholdDetails;
