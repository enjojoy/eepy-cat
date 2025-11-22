
import { Tabs } from 'expo-router';
import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { RecordingProvider } from '../context/RecordingContext';

export default function TabLayout() {
  return (
    <RecordingProvider>
      <Tabs>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="home" size={size} color={color} />
            ),
            tabBarLabelStyle: {
              fontFamily: 'Jersey25-Regular',
            },
          }}
        />
        <Tabs.Screen
          name="recordings"
          options={{
            title: 'Recordings',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="book" size={size} color={color} />
            ),
            tabBarLabelStyle: {
              fontFamily: 'Jersey25-Regular',
            },
          }}
        />
      </Tabs>
    </RecordingProvider>
  );
}
