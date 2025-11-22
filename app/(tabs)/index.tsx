
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gyroscope } from 'expo-sensors';

export default function App() {
  const [data, setData] = useState({ x: 0, y: 0, z: 0 });
  const [backgroundColor, setBackgroundColor] = useState('white');

  useEffect(() => {
    let subscription;
    const subscribe = async () => {
      await Gyroscope.isAvailableAsync();
      subscription = Gyroscope.addListener(gyroscopeData => {
        setData(gyroscopeData);
      });
      Gyroscope.setUpdateInterval(100);
    };
    subscribe();
    return () => subscription && subscription.remove();
  }, []);

  useEffect(() => {
    const { x, y, z } = data;
    const movement = Math.abs(x) + Math.abs(y) + Math.abs(z);
    if (movement > 1) {
      const red = Math.floor(Math.random() * 256);
      const green = Math.floor(Math.random() * 256);
      const blue = Math.floor(Math.random() * 256);
      setBackgroundColor(`rgb(${red}, ${green}, ${blue})`);
    }
  }, [data]);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={styles.text}>Move your phone to change the background color</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
});
