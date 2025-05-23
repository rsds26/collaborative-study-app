import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import SignUpScreen from './lib/screens/SignUpScreen';
import LoginScreen from './lib/screens/LoginScreen';
import HomeScreen from './lib/screens/HomeScreen';
import FriendsScreen from './lib/screens/FriendsScreen';
import FriendsTasksScreen from './lib/screens/FriendsTasksScreen';
import HomePageScreen from './lib/screens/HomePageScreen';
import LibraryScreen from './lib/screens/LibraryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Tasks') {
            iconName = 'document-text-outline';
          } else if (route.name === 'Friends') {
            iconName = 'people';
          } else if (route.name === 'Home Page') {
            iconName = 'home';
          } else if (route.name === 'Friends Tasks') {
            iconName = 'library-outline';
          } else if (route.name === 'Library') {
            iconName = 'map-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2f95dc',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home Page" component={HomePageScreen} />
      <Tab.Screen name="Tasks" component={HomeScreen} />
      <Tab.Screen name="Friends" component={FriendsScreen} />
      <Tab.Screen name="Friends Tasks" component={FriendsTasksScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SignUp">
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
