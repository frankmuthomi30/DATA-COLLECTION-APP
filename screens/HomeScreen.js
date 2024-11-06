import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons'; // Make sure to install expo/vector-icons

const { width, height } = Dimensions.get('window');

// Define your local images
const backgroundImage = require('../assets/images/background.jpg');
const addIcon = <Feather name="plus-circle" size={24} color="#FFFFFF" />;
const viewIcon = <Feather name="list" size={24} color="#FFFFFF" />;
const syncIcon = <Feather name="refresh-cw" size={24} color="#FFFFFF" />;

const HomeScreen = () => {
  const navigation = useNavigation();
  const [totalHouseholds, setTotalHouseholds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Animation values
  const fadeIn = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(-width)).current;
  const statsScale = useRef(new Animated.Value(0.3)).current;
  const buttonSlideLeft = useRef(new Animated.Value(-width)).current;
  const buttonSlideRight = useRef(new Animated.Value(width)).current;

  const fetchHouseholds = async () => {
    try {
      const households = await AsyncStorage.getItem('households');
      if (households) {
        const parsedHouseholds = JSON.parse(households);
        setTotalHouseholds(parsedHouseholds.length);
      } else {
        setTotalHouseholds(0);
      }
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Failed to load households:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchHouseholds();
    }, [])
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchHouseholds();
  }, []);

  useEffect(() => {
    const startEntranceAnimations = () => {
      Animated.parallel([
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(titleSlide, {
          toValue: 0,
          duration: 1000,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.spring(statsScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(400),
          Animated.parallel([
            Animated.timing(buttonSlideLeft, {
              toValue: 0,
              duration: 800,
              easing: Easing.out(Easing.back(1)),
              useNativeDriver: true,
            }),
            Animated.timing(buttonSlideRight, {
              toValue: 0,
              duration: 800,
              easing: Easing.out(Easing.back(1)),
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    };

    startEntranceAnimations();
  }, []);

  const ActionButton = ({ title, icon, color, onPress, style }) => (
    <Animated.View style={[styles.actionButtonContainer, style]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
          colors={[color, color + 'DD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.actionButton}>
          <BlurView intensity={20} style={styles.buttonBlur}>
            <View style={styles.buttonIconContainer}>{icon}</View>
            <Text style={styles.actionButtonText}>{title}</Text>
          </BlurView>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading households...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.backgroundImage}
      resizeMode="cover">
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0)']}
          style={styles.headerGradient}>
          <Animated.Text
            style={[
              styles.title,
              {
                opacity: fadeIn,
                transform: [{ translateX: titleSlide }],
              },
            ]}>
            Vulnerable Households
          </Animated.Text>
        </LinearGradient>

        <Animated.View
          style={[
            styles.statsCard,
            {
              opacity: fadeIn,
              transform: [{ scale: statsScale }],
            },
          ]}>
          <BlurView intensity={80} tint="light" style={styles.statsBlurView}>
            <Text style={styles.statsLabel}>Total Households</Text>
            <Text style={styles.statsValue}>{totalHouseholds}</Text>
            <View style={styles.statsIndicator} />
            {lastUpdated && (
              <Text style={styles.lastUpdated}>Last updated: {lastUpdated}</Text>
            )}
          </BlurView>
        </Animated.View>

        <View style={styles.actionButtonsGrid}>
          <ActionButton
            title="Add Household"
            icon={addIcon}
            color="#3498db"
            onPress={() => navigation.navigate('AddHousehold')}
            style={{
              opacity: fadeIn,
              transform: [{ translateX: buttonSlideLeft }],
            }}
          />
          <ActionButton
            title="View Data"
            icon={viewIcon}
            color="#2ecc71"
            onPress={() => navigation.navigate('DataList')}
            style={{
              opacity: fadeIn,
              transform: [{ translateX: buttonSlideRight }],
            }}
          />
          <ActionButton
            title="Sync Data"
            icon={syncIcon}
            color="#e74c3c"
            onPress={() => navigation.navigate('Sync')}
            style={{
              opacity: fadeIn,
              transform: [{ translateX: buttonSlideLeft }],
            }}
          />
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight + 40,
    paddingBottom: 40,
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 40,
    marginBottom: 20,
    borderRadius: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statsCard: {
    borderRadius: 20,
    marginBottom: 40,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  statsBlurView: {
    padding: 25,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  statsLabel: {
    fontSize: 18,
    color: '#2c3e50',
    marginBottom: 10,
    fontWeight: '600',
  },
  statsValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statsIndicator: {
    height: 4,
    width: 40,
    backgroundColor: '#3498db',
    borderRadius: 2,
    marginTop: 15,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 10,
  },
  actionButtonsGrid: {
    width: '100%',
    gap: 15,
  },
  actionButtonContainer: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  actionButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  buttonBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  buttonIconContainer: {
    marginRight: 10,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f9',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
});

export default HomeScreen;