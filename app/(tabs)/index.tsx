
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gyroscope } from 'expo-sensors';

// Keep data for the last 5 minutes (300 seconds)
const DATA_RETENTION_PERIOD = 300 * 1000; // 5 minutes in milliseconds

export default function App() {
  const [movementData, setMovementData] = useState<{ timestamp: number; movement: number }[]>([]);
  const [avg1min, setAvg1min] = useState(0);
  const [avg5min, setAvg5min] = useState(0);
  const [isMovingMore, setIsMovingMore] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('white');


  useEffect(() => {
    let subscription;
    const subscribe = async () => {
      await Gyroscope.isAvailableAsync();
      subscription = Gyroscope.addListener(gyroscopeData => {
        const { x, y, z } = gyroscopeData;
        const movement = Math.abs(x) + Math.abs(y) + Math.abs(z);
        const timestamp = Date.now();

        setMovementData(prevData => {
          const newData = [...prevData, { timestamp, movement }];
          // Prune data older than 5 minutes
          return newData.filter(d => timestamp - d.timestamp < DATA_RETENTION_PERIOD);
        });

        if (movement > 1) {
            const red = Math.floor(Math.random() * 256);
            const green = Math.floor(Math.random() * 256);
            const blue = Math.floor(Math.random() * 256);
            setBackgroundColor(`rgb(${red}, ${green}, ${blue})`);
        }
      });
      Gyroscope.setUpdateInterval(1000); // Once per second
    };
    subscribe();
    return () => subscription && subscription.remove();
  }, []);

  useEffect(() => {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const fiveMinutesAgo = now - 300 * 1000;

    const data1min = movementData.filter(d => d.timestamp > oneMinuteAgo);
    const data5min = movementData.filter(d => d.timestamp > fiveMinutesAgo);

    const sum1min = data1min.reduce((acc, curr) => acc + curr.movement, 0);
    const sum5min = data5min.reduce((acc, curr) => acc + curr.movement, 0);

    const newAvg1min = data1min.length > 0 ? sum1min / data1min.length : 0;
    const newAvg5min = data5min.length > 0 ? sum5min / data5min.length : 0;

    setAvg1min(newAvg1min);
    setAvg5min(newAvg5min);
    setIsMovingMore(newAvg1min > newAvg5min);
  }, [movementData]);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={styles.text}>1-min avg movement: {avg1min.toFixed(2)}</Text>
      <Text style={styles.text}>5-min avg movement: {avg5min.toFixed(2)}</Text>
      <Text style={styles.text}>
        {isMovingMore ? 'Moving more now than in the last 5 minutes' : 'Moving less now than in the last 5 minutes'}
      </Text>
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
    marginVertical: 10,
  },
});
