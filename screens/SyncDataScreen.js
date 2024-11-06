// SyncDataScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { db } from '../firebase'; // Adjust the import path based on your file structure

const SyncDataScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [progress, setProgress] = useState('');

  const syncDataToFirestore = async () => {
    setLoading(true);
    setSyncStatus(null);
    setProgress('');

    try {
      // Retrieve data from AsyncStorage
      const storedData = await AsyncStorage.getItem('households');
      if (!storedData) {
        Alert.alert('No Data', 'No household data found to sync.');
        setLoading(false);
        return;
      }

      const households = JSON.parse(storedData);
      const householdsRef = collection(db, 'households');

      // Add each household as a separate document with progress feedback
      const uploadPromises = households.map((household, index) =>
        addDoc(householdsRef, {
          ...household,
          createdAt: serverTimestamp(),
          syncedAt: serverTimestamp()
        }).then(() => setProgress(`Syncing item ${index + 1} of ${households.length}`))
      );

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      // Clear local storage after successful sync
      await AsyncStorage.removeItem('households');

      const successMessage = 'Successfully synced all data to Firestore!';
      setSyncStatus(successMessage);
      await AsyncStorage.setItem('syncStatus', successMessage);
      Alert.alert('Sync Successful', 'All household data has been uploaded to Firestore.');

    } catch (error) {
      console.error('Sync failed:', error);
      let errorMessage = 'There was an error while syncing data. Please try again.';

      if (error.code === 'permission-denied') {
        errorMessage = 'Firestore permission denied. Please check database rules.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Network unavailable. Please check your internet connection.';
      }

      Alert.alert('Sync Failed', errorMessage);
      setSyncStatus('Sync failed: ' + errorMessage);

    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  useEffect(() => {
    const getSyncStatus = async () => {
      try {
        const status = await AsyncStorage.getItem('syncStatus');
        setSyncStatus(status);
      } catch (error) {
        console.error('Error getting sync status:', error);
      }
    };
    getSyncStatus();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sync Household Data</Text>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Syncing data...</Text>
          {progress ? <Text style={styles.progressText}>{progress}</Text> : null}
        </View>
      ) : (
        <View style={styles.syncStatusContainer}>
          {syncStatus && (
            <Text
              style={[
                styles.syncStatus,
                { color: syncStatus.includes('failed') ? '#e74c3c' : '#2ecc71' }
              ]}
            >
              {syncStatus}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.syncButton, loading && styles.syncButtonDisabled]}
            onPress={syncDataToFirestore}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Sync Data</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#7f8c8d',
    fontSize: 16,
  },
  progressText: {
    marginTop: 5,
    color: '#3498db',
    fontSize: 14,
  },
  syncStatusContainer: {
    alignItems: 'center',
    width: '100%',
  },
  syncStatus: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  syncButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  syncButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default SyncDataScreen;
