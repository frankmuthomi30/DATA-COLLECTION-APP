import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import AddHouseholdScreen from '../screens/AddHouseholdScreen';
import DataListScreen from '../screens/DataListScreen';
import HouseholdDetails from '../screens/HouseholdDetails';
import EditHouseholdScreen from '../screens/EditHouseholdScreen';
import SyncDataScreen from '../screens/SyncDataScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#3498db',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Home', // You can add custom title if necessary
          }}
        />

        <Stack.Screen
          name="DataList"
          component={DataListScreen}
          options={{
            title: 'Households',
          }}
        />

        <Stack.Screen
          name="AddHousehold"
          component={AddHouseholdScreen}
          options={{
            title: 'Add Household',
          }}
        />

        <Stack.Screen
          name="HouseholdDetails"
          component={HouseholdDetails}
          options={{
            title: 'Household Details',
          }}
        />

        <Stack.Screen
          name="EditHousehold"
          component={EditHouseholdScreen}
          options={{
            title: 'Edit Household',
          }}
        />

        <Stack.Screen
          name="Sync"
          component={SyncDataScreen}
          options={{
            title: 'Sync Data', // This can be customized if needed
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
