
import React from 'react';
import { Tabs } from 'expo-router';
import { useRecording } from '../context/RecordingContext';
import { View, Text } from 'react-native';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof import('@expo/vector-icons').FontAwesome>['name'];
  color: string;
  showNotification?: boolean;
}) {
  const { FontAwesome } = require('@expo/vector-icons');
  return (
    <View style={{ width: 28, height: 28, position: 'relative' }}>
      <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />
      {props.showNotification && (
        <View
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            backgroundColor: 'red',
            borderRadius: 5,
            width: 10,
            height: 10,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontSize: 8 }}>1</Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const { hasPendingWalletRequest } = useRecording();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#190e1c',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="recordings"
        options={{
          title: 'Recordings',
          tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} showNotification={hasPendingWalletRequest} />,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
