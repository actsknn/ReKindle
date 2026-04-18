import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        tabBarActiveTintColor: '#4CAF50',
        // Set this to false to see if the error clears
        headerShown: false, 
      }}
    >
      {/* Ensure 'index' actually exists as index.tsx in your (tabs) folder */}
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Scanner', 
          tabBarIcon: ({ color }) => <Ionicons name="camera" size={26} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="impact" 
        options={{ 
          title: 'Impact', 
          tabBarIcon: ({ color }) => <Ionicons name="leaf" size={26} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="map" 
        options={{ 
          title: 'Map', 
          tabBarIcon: ({ color }) => <Ionicons name="map" size={26} color={color} /> 
        }} 
      />
      {/* If you don't have a profile.tsx yet, comment this out! */}
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile', 
          tabBarIcon: ({ color }) => <Ionicons name="person" size={26} color={color} /> 
        }} 
      />
    </Tabs>
  );
}