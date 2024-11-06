import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';

const SUB_LOCATIONS = {
  'Karundu': ['Village 1', 'Village 2', 'Village 3'],
  'Gaaki': ['Village A', 'Village B', 'Village C'],
  'Thegenge': ['Upper Thegenge', 'Lower Thegenge', 'Central Thegenge'],
  'Aguuthi': ['East Aguuthi', 'West Aguuthi', 'South Aguuthi']
};

const ASSESSMENT_QUESTIONS = [
  {
    id: 'housing',
    question: 'Type of Housing',
    options: ['Permanent', 'Semi-Permanent', 'Temporary']
  },
  {
    id: 'water',
    question: 'Access to Clean Water',
    options: ['Piped Water', 'Well/Borehole', 'River/Stream']
  },
  {
    id: 'income',
    question: 'Main Source of Income',
    options: ['Formal Employment', 'Casual Labor', 'Small Business', 'None']
  },
  {
    id: 'education',
    question: 'Children\'s Education',
    options: ['All in School', 'Some in School', 'None in School', 'No Children']
  },
  {
    id: 'meals',
    question: 'Number of Meals per Day',
    options: ['Three or More', 'Two', 'One']
  }
];

const EditHouseholdScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { household } = route.params;
  
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState(household.photo || null);
  
  // Location states
  const [subLocation, setSubLocation] = useState(household.subLocation || '');
  const [village, setVillage] = useState(household.village || '');
  
  // Household head details
  const [headDetails, setHeadDetails] = useState({
    name: household.headDetails.name || '',
    age: household.headDetails.age || '',
    gender: household.headDetails.gender || '',
    idNumber: household.headDetails.idNumber || '',
    phoneNumber: household.headDetails.phoneNumber || '',
    maritalStatus: household.headDetails.maritalStatus || '',
  });
  
  // Household details
  const [householdDetails, setHouseholdDetails] = useState({
    children: household.householdDetails?.children || '',
    elderly: household.householdDetails?.elderly || '',
    disabled: household.householdDetails?.disabled || '',
  });
  
  // Assessment answers
  const [assessmentAnswers, setAssessmentAnswers] = useState(
    household.assessmentAnswers || {}
  );

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });

      if (!result.canceled) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const updateGeoCoordinates = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({});
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  };

  const calculatePovertyScore = () => {
    let score = 0;
    const answers = assessmentAnswers;
    
    if (answers.housing === 'Temporary') score += 3;
    if (answers.water === 'River/Stream') score += 3;
    if (answers.income === 'None') score += 3;
    if (answers.education === 'None in School') score += 3;
    if (answers.meals === 'One') score += 3;
    
    return score;
  };

  const handleUpdate = async () => {
    // Validation
    if (!subLocation || !village || !headDetails.name || !headDetails.idNumber || !photo) {
      Alert.alert('Error', 'Please fill in all required fields and include a photo');
      return;
    }

    setLoading(true);

    try {
      const geoCoordinates = await updateGeoCoordinates() || household.geoCoordinates;
      const povertyScore = calculatePovertyScore();

      const updatedHousehold = {
        ...household,
        subLocation,
        village,
        headDetails,
        householdDetails,
        assessmentAnswers,
        povertyScore,
        photo,
        geoCoordinates,
        timestamp: new Date().toISOString(),
      };

      const storedData = await AsyncStorage.getItem('households');
      const households = JSON.parse(storedData);
      
      const updatedHouseholds = households.map(item => 
        item.id === household.id ? updatedHousehold : item
      );

      await AsyncStorage.setItem('households', JSON.stringify(updatedHouseholds));

      Alert.alert('Success', 'Household data updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update household data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Location Information</Text>
      
      {/* Sub-location Picker */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={subLocation}
          onValueChange={(value) => {
            setSubLocation(value);
            setVillage('');
          }}
          style={styles.picker}>
          <Picker.Item label="Select Sub-location" value="" />
          {Object.keys(SUB_LOCATIONS).map(loc => (
            <Picker.Item key={loc} label={loc} value={loc} />
          ))}
        </Picker>
      </View>

      {/* Village Picker */}
      {subLocation && (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={village}
            onValueChange={setVillage}
            style={styles.picker}>
            <Picker.Item label="Select Village" value="" />
            {SUB_LOCATIONS[subLocation].map(vil => (
              <Picker.Item key={vil} label={vil} value={vil} />
            ))}
          </Picker>
        </View>
      )}

      <Text style={styles.sectionTitle}>Household Head Details</Text>
      
      {/* Head Details Form */}
      <View style={styles.formSection}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={headDetails.name}
          onChangeText={(text) => setHeadDetails({...headDetails, name: text})}
        />
        <TextInput
          style={styles.input}
          placeholder="Age"
          keyboardType="numeric"
          value={headDetails.age}
          onChangeText={(text) => setHeadDetails({...headDetails, age: text})}
        />
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={headDetails.gender}
            onValueChange={(value) => setHeadDetails({...headDetails, gender: value})}
            style={styles.picker}>
            <Picker.Item label="Select Gender" value="" />
            <Picker.Item label="Male" value="male" />
            <Picker.Item label="Female" value="female" />
          </Picker>
        </View>
        <TextInput
          style={styles.input}
          placeholder="ID Number"
          value={headDetails.idNumber}
          onChangeText={(text) => setHeadDetails({...headDetails, idNumber: text})}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          keyboardType="phone-pad"
          value={headDetails.phoneNumber}
          onChangeText={(text) => setHeadDetails({...headDetails, phoneNumber: text})}
        />
      </View>

      <Text style={styles.sectionTitle}>Household Members</Text>
      
      {/* Household Details */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Children</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter number of children"
          value={householdDetails.children}
          onChangeText={(text) => setHouseholdDetails({ ...householdDetails, children: text })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Elderly</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter number of elderly"
          value={householdDetails.elderly}
          onChangeText={(text) => setHouseholdDetails({ ...householdDetails, elderly: text })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Disabled</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter number of disabled"
          value={householdDetails.disabled}
          onChangeText={(text) => setHouseholdDetails({ ...householdDetails, disabled: text })}
        />
      </View>

      <Text style={styles.sectionTitle}>Assessment</Text>
      
      {/* Assessment Questions */}
      {ASSESSMENT_QUESTIONS.map((question) => (
        <View key={question.id} style={styles.inputGroup}>
          <Text style={styles.label}>{question.question}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={assessmentAnswers[question.id]}
              onValueChange={(value) =>
                setAssessmentAnswers({ ...assessmentAnswers, [question.id]: value })
              }
              style={styles.picker}>
              {question.options.map((option, index) => (
                <Picker.Item key={index} label={option} value={option} />
              ))}
            </Picker>
          </View>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Photo</Text>
      <TouchableOpacity style={styles.imagePicker} onPress={takePhoto}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} />
        ) : (
          <Text style={styles.photoText}>Tap to take a photo</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.updateButton}
        onPress={handleUpdate}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.updateButtonText}>Update Household</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 8,
  },
  picker: {
    height: 40,
    width: '100%',
  },
  formSection: {
    marginBottom: 16,
  },
  updateButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 16,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  imagePicker: {
    marginVertical: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    alignItems: 'center',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoText: {
    color: '#4CAF50',
    fontSize: 16,
  },
});

export default EditHouseholdScreen;
