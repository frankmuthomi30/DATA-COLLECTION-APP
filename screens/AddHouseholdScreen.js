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
import { useNavigation } from '@react-navigation/native';
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

// Poverty assessment questions
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

const AddHouseholdScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState(null);
  
  // Location states
  const [subLocation, setSubLocation] = useState('');
  const [village, setVillage] = useState('');
  
  // Household head details
  const [headDetails, setHeadDetails] = useState({
    name: '',
    age: '',
    gender: '',
    idNumber: '',
    phoneNumber: '',
    maritalStatus: '',
  });
  
  // Household details (without total members field)
  const [householdDetails, setHouseholdDetails] = useState({
    children: '',
    elderly: '',
    disabled: '',
  });
  
  // Assessment answers
  const [assessmentAnswers, setAssessmentAnswers] = useState({});

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

  const getGeoCoordinates = async () => {
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
    // Simple scoring system (can be made more sophisticated)
    let score = 0;
    const answers = assessmentAnswers;
    
    // Example scoring logic
    if (answers.housing === 'Temporary') score += 3;
    if (answers.water === 'River/Stream') score += 3;
    if (answers.income === 'None') score += 3;
    if (answers.education === 'None in School') score += 3;
    if (answers.meals === 'One') score += 3;
    
    return score;
  };

  const handleSave = async () => {
    // Validation
    if (!subLocation || !village || !headDetails.name || !headDetails.idNumber || !photo) {
      Alert.alert('Error', 'Please fill in all required fields and take a photo');
      return;
    }

    setLoading(true);

    try {
      const geoCoordinates = await getGeoCoordinates();
      if (!geoCoordinates) {
        setLoading(false);
        return;
      }

      const povertyScore = calculatePovertyScore();

      const household = {
        id: Date.now().toString(),
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

      const existingHouseholds = await AsyncStorage.getItem('households');
      let households = existingHouseholds ? JSON.parse(existingHouseholds) : [];
      households.push(household);
      await AsyncStorage.setItem('households', JSON.stringify(households));

      Alert.alert('Success', 'Household data saved successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save household data');
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
      <View style={styles.formSection}>
        <TextInput
          style={styles.input}
          placeholder="Number of Children (Under 18)"
          keyboardType="numeric"
          value={householdDetails.children}
          onChangeText={(text) => setHouseholdDetails({...householdDetails, children: text})}
        />
        <TextInput
          style={styles.input}
          placeholder="Number of Elderly (Over 65)"
          keyboardType="numeric"
          value={householdDetails.elderly}
          onChangeText={(text) => setHouseholdDetails({...householdDetails, elderly: text})}
        />
        <TextInput
          style={styles.input}
          placeholder="Number of Disabled Members"
          keyboardType="numeric"
          value={householdDetails.disabled}
          onChangeText={(text) => setHouseholdDetails({...householdDetails, disabled: text})}
        />
      </View>

      <Text style={styles.sectionTitle}>Poverty Assessment</Text>
      
      {/* Poverty Assessment Questions */}
      {ASSESSMENT_QUESTIONS.map((item) => (
        <View key={item.id} style={styles.formSection}>
          <Text>{item.question}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={assessmentAnswers[item.id]}
              onValueChange={(value) => setAssessmentAnswers({...assessmentAnswers, [item.id]: value})}
              style={styles.picker}>
              {item.options.map((option) => (
                <Picker.Item key={option} label={option} value={option} />
              ))}
            </Picker>
          </View>
        </View>
      ))}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={takePhoto}>
          <Text style={styles.buttonText}>Take Household Photo</Text>
        </TouchableOpacity>
        {photo && (
          <Image source={{ uri: photo }} style={styles.photo} />
        )}
      </View>

      <LinearGradient colors={['#4c669f', '#3b5998', '#192f5d']} style={styles.gradient}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Save Household</Text>
          )}
        </TouchableOpacity>
      </LinearGradient>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 12,
    borderRadius: 4,
  },
  formSection: {
    marginBottom: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 12,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2C3E50',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  photo: {
    width: 200,
    height: 200,
    marginTop: 16,
  },
  gradient: {
    marginTop: 16,
    borderRadius: 5,
  },
  submitButton: {
    padding: 16,
    backgroundColor: '#3498db',
    borderRadius: 5,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default AddHouseholdScreen;
