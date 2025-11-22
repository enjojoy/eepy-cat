
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SleepData } from '@/types/sleep';

const SLEEP_STORAGE_KEY = '@sleepData';

export default function RecordingsScreen() {
  const [sleepData, setSleepData] = useState<SleepData[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedSleepData = await AsyncStorage.getItem(SLEEP_STORAGE_KEY);
        if (storedSleepData) setSleepData(JSON.parse(storedSleepData));
      } catch (error) {
        console.error('Failed to load sleep data.', error);
      }
    };

    loadData();
  }, []);

  const renderItem = ({ item }: { item: SleepData }) => {
    const totalMovement = item.movementData.reduce((acc, curr) => acc + curr.movement, 0);
    return (
      <View style={styles.sleepItem}>
        <Text>Start: {new Date(item.startTime).toLocaleString()}</Text>
        <Text>End: {new Date(item.endTime).toLocaleString()}</Text>
        <Text>Duration: {(item.duration / 1000 / 60).toFixed(2)} minutes</Text>
        <Text>Total Movement: {totalMovement.toFixed(2)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={sleepData}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  list: {
    width: '100%',
  },
  sleepItem: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderColor: '#ccc',
    borderWidth: 1,
  },
});
