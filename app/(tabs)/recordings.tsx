
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Modal, Switch, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useRecording } from '../context/RecordingContext';
import { SleepData } from '@/types/sleep';

const LiveRecording = () => {
    const { startTime, movementData } = useRecording();
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (startTime) {
            timer = setInterval(() => {
                setDuration(Date.now() - startTime);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [startTime]);

    const totalMovement = movementData.reduce((acc, curr) => acc + curr.movement, 0);

    return (
        <View style={styles.liveRecordingContainer}>
            <Text style={styles.liveRecordingTitle}>Live Recording</Text>
            <Text style={styles.baseText}>Duration: {(duration / 1000).toFixed(0)} seconds</Text>
            <Text style={styles.baseText}>Current Movement: {totalMovement.toFixed(2)}</Text>
        </View>
    );
};

export default function RecordingsScreen() {
  const { 
    isTracking,
    allRecordings, 
    userData, 
    clearData, 
    toggleTestingMode,
    loadAllRecordings,
  } = useRecording();

  const [showSettings, setShowSettings] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadAllRecordings();
    }, [loadAllRecordings])
  );

  const renderItem = ({ item }: { item: SleepData }) => {
    const totalMovement = item.movementData.reduce((acc, curr) => acc + curr.movement, 0);
    return (
      <View style={styles.sleepItem}>
        <Text style={styles.baseText}>Start: {new Date(item.startTime).toLocaleString()}</Text>
        <Text style={styles.baseText}>End: {new Date(item.endTime).toLocaleString()}</Text>
        <Text style={styles.baseText}>Duration: {(item.duration / 1000 / 60).toFixed(2)} minutes</Text>
        <Text style={styles.baseText}>Total Movement: {totalMovement.toFixed(2)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowSettings(true)}>
          <Text style={{fontSize: 24}}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showSettings}
        onRequestClose={() => {
          setShowSettings(!showSettings);
        }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {userData &&
              <View style={styles.settingRow}>
                  <Text style={styles.settingText}>Testing Mode</Text>
                  <Switch
                      trackColor={{ false: '#767577', true: '#81b0ff' }}
                      thumbColor={userData.testingMode ? '#f5dd4b' : '#f4f3f4'}
                      ios_backgroundColor="#3e3e3e"
                      onValueChange={toggleTestingMode}
                      value={userData.testingMode}
                  />
              </View>
            }
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                clearData();
                setShowSettings(false);
              }}>
              <Text style={styles.buttonText}>Clear All Data</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{...styles.button, marginTop: 15, backgroundColor: '#6c757d'}}
              onPress={() => setShowSettings(!showSettings)}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {isTracking && <LiveRecording />}
      
      {userData && <Text style={styles.streakText}>Sleep Streak: {userData.streak}</Text>}
      
      <FlatList
        data={allRecordings}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.startTime.toString()}
        style={styles.list}
        contentContainerStyle={{ paddingTop: isTracking ? 0 : 60 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  baseText: {
    fontFamily: 'Jersey25-Regular',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    width: '100%',
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1, 
  },
  list: {
    width: '100%',
  },
  sleepItem: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  streakText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    marginTop: 60, // Adjust margin to not be overlapped by header
    fontFamily: 'Jersey25-Regular',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', 
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  settingText: {
    fontSize: 18,
    fontFamily: 'Jersey25-Regular',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    width: '80%',
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    fontFamily: 'Jersey25-Regular',
  },
  liveRecordingContainer: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#e0f7fa',
    marginBottom: 15,
    marginTop: 60,
    alignItems: 'center',
  },
  liveRecordingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    fontFamily: 'Jersey25-Regular',
  },
});
