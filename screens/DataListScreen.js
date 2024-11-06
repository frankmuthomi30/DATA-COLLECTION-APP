import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const ITEMS_PER_PAGE = 10;
const STORAGE_KEY = 'households';

const DataListScreen = () => {
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  const validateHouseholdData = useCallback((data) => {
    if (!Array.isArray(data)) return [];
    
    return data.filter(item => 
      item &&
      typeof item === 'object' &&
      item.id &&
      item.headDetails &&
      typeof item.headDetails === 'object' &&
      item.headDetails.name
    );
  }, []);

  const loadData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        const validData = validateHouseholdData(parsedData);
        validData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setDataList(validData);
      } else {
        setDataList([]);
      }
    } catch (error) {
      console.error('Load data error:', error);
      setError('Failed to load household data');
      Alert.alert('Error', 'Failed to load household data');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [validateHouseholdData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData(false);
    setRefreshing(false);
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      return () => {
        // Cleanup if needed
        setCurrentPage(1);
      };
    }, [loadData])
  );

  const handleDelete = useCallback((id) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this household?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const newData = dataList.filter(item => item.id !== id);
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
              setDataList(newData);
              
              // Reset to first page if current page becomes empty
              const itemsInCurrentPage = newData.slice(
                (currentPage - 1) * ITEMS_PER_PAGE,
                currentPage * ITEMS_PER_PAGE
              );
              if (itemsInCurrentPage.length === 0 && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
              }
              
              Alert.alert('Success', 'Household deleted successfully');
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete household');
            }
          }
        }
      ]
    );
  }, [dataList, currentPage]);

  const renderItem = useCallback(({ item, index }) => {
    if (!item?.headDetails) return null;

    return (
      <TouchableOpacity 
        style={styles.itemContainer}
        onPress={() => navigation.navigate('HouseholdDetails', { household: item })}
        testID={`household-item-${index}`}
      >
        <View style={styles.mainInfo}>
          <View style={styles.textContainer}>
            <Text style={styles.nameText}>
              {item.headDetails.name || 'No Name'}
            </Text>
            <Text style={styles.locationText}>
              {item.village || 'No Village'}
            </Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.detailText}>
              ID: {item.headDetails.idNumber || 'N/A'}
            </Text>
            <Text style={styles.detailText}>
              Phone: {item.headDetails.phoneNumber || 'N/A'}
            </Text>
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              navigation.navigate('EditHousehold', { household: item });
            }}
            testID={`edit-button-${index}`}
          >
            <LinearGradient
              colors={['#3498db', '#2980b9']}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Edit</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              handleDelete(item.id);
            }}
            testID={`delete-button-${index}`}
          >
            <LinearGradient
              colors={['#e74c3c', '#c0392b']}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Delete</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }, [navigation, handleDelete]);

  const totalPages = Math.ceil(dataList.length / ITEMS_PER_PAGE);
  const paginatedData = dataList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const ListEmptyComponent = useCallback(() => (
    <Text style={styles.emptyText}>
      {error || 'No households found'}
    </Text>
  ), [error]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={paginatedData}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={ListEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3498db']}
          />
        }
        removeClippedSubviews={false}
        initialNumToRender={ITEMS_PER_PAGE}
        maxToRenderPerBatch={ITEMS_PER_PAGE}
        windowSize={5}
        contentContainerStyle={styles.listContainer}
        testID="households-list"
      />
      
      {totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity 
            disabled={currentPage === 1}
            onPress={() => setCurrentPage(prev => prev - 1)}
            testID="previous-page-button"
          >
            <LinearGradient
              colors={['#3498db', '#2980b9']}
              style={[styles.paginationButton, currentPage === 1 && styles.disabledButton]}
            >
              <Text style={styles.buttonText}>Previous</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </Text>

          <TouchableOpacity 
            disabled={currentPage === totalPages}
            onPress={() => setCurrentPage(prev => prev + 1)}
            testID="next-page-button"
          >
            <LinearGradient
              colors={['#3498db', '#2980b9']}
              style={[styles.paginationButton, currentPage === totalPages && styles.disabledButton]}
            >
              <Text style={styles.buttonText}>Next</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity 
        onPress={() => navigation.navigate('AddHousehold')}
        style={styles.addButton}
        testID="add-household-button"
      >
        <LinearGradient
          colors={['#2ecc71', '#27ae60']}
          style={styles.addButtonGradient}
        >
          <Text style={styles.addButtonText}>Add New Household</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f4f9',
  },
  listContainer: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContainer: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  mainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  textContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  detailText: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    marginVertical: 10,
  },
  paginationButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pageInfo: {
    fontSize: 16,
    color: '#2c3e50',
  },
  addButton: {
    marginVertical: 16,
  },
  addButtonGradient: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
    color: '#7f8c8d',
  },
});

export default DataListScreen;