
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Button, Modal, Switch, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gyroscope } from 'expo-sensors';
import { SleepData } from '@/types/sleep';
import { UserData } from '@/types/user';

const SLEEP_STORAGE_KEY = '@sleepData';
const USER_STORAGE_KEY = '@userData';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

export default function App() {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [movementData, setMovementData] = useState<{ timestamp: number; movement: number }[]>([]);
  const [userData, setUserData] = useState<UserData>({ streak: 0, lastSleepDate: null, tokens: 0, lastClaimDate: null, testingMode: false });
  const [canClaimTokens, setCanClaimTokens] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (storedUserData) {
          const parsedUserData = JSON.parse(storedUserData);
          setUserData({ ...{ streak: 0, lastSleepDate: null, tokens: 0, lastClaimDate: null, testingMode: false }, ...parsedUserData });
        } else {
          await saveUserData({ streak: 0, lastSleepDate: null, tokens: 0, lastClaimDate: null, testingMode: false });
        }
      } catch (error) {
        console.error('Failed to load data.', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const today = getTodayDateString();
    if (userData.testingMode) {
        setCanClaimTokens(true);
        return;
    }

    if (userData.lastSleepDate && userData.lastSleepDate !== today && userData.lastClaimDate !== today) {
      setCanClaimTokens(true);
    } else {
      setCanClaimTokens(false);
    }
  }, [userData]);

  useEffect(() => {
    let subscription;
    if (isTracking) {
      Gyroscope.isAvailableAsync().then(isAvailable => {
        if (isAvailable) {
          subscription = Gyroscope.addListener(gyroscopeData => {
            const { x, y, z } = gyroscopeData;
            const movement = Math.abs(x) + Math.abs(y) + Math.abs(z);
            setMovementData(prevData => [...prevData, { timestamp: Date.now(), movement }]);
          });
          Gyroscope.setUpdateInterval(1000);
        }
      });
    }
    return () => subscription?.remove();
  }, [isTracking]);

  const saveSleepData = async (data: SleepData[]) => {
    try {
      await AsyncStorage.setItem(SLEEP_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save sleep data.', error);
    }
  };

  const saveUserData = async (data: UserData) => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
      setUserData(data);
    } catch (error) {
      console.error('Failed to save user data.', error);
    }
  };

  const updateStreak = async () => {
    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0];

    const storedSleepData = await AsyncStorage.getItem(SLEEP_STORAGE_KEY);
    const sleepData = storedSleepData ? JSON.parse(storedSleepData) : [];

    if (userData.lastSleepDate) {
      const lastSleep = new Date(userData.lastSleepDate);
      const diffTime = today.getTime() - lastSleep.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        await saveUserData({ ...userData, streak: userData.streak + 1, lastSleepDate: todayDateString });
      } else if (diffDays > 1) {
        await saveUserData({ ...userData, streak: 1, lastSleepDate: todayDateString });
      }
    } else {
      await saveUserData({ ...userData, streak: 1, lastSleepDate: todayDateString });
    }
  };

  const toggleTracking = async () => {
    if (isTracking) {
      setIsTracking(false);
      const endTime = Date.now();
      if (startTime) {
        const duration = endTime - startTime;
        const newSleepEntry: SleepData = { startTime, endTime, duration, movementData };
        
        const storedSleepData = await AsyncStorage.getItem(SLEEP_STORAGE_KEY);
    	const sleepData = storedSleepData ? JSON.parse(storedSleepData) : [];
        const updatedSleepData = [...sleepData, newSleepEntry];
        
        await saveSleepData(updatedSleepData);
        await updateStreak();
      }
      setStartTime(null);
      setMovementData([]);
    } else {
      setIsTracking(true);
      setStartTime(Date.now());
    }
  };
  
  const clearData = async () => {
    try {
      await AsyncStorage.multiRemove([SLEEP_STORAGE_KEY, USER_STORAGE_KEY]);
      const initialUserData = { streak: 0, lastSleepDate: null, tokens: 0, lastClaimDate: null, testingMode: false };
      setUserData(initialUserData);
      await saveUserData(initialUserData);
    } catch (error) {
      console.error('Failed to clear data.', error);
    }
  };

  const claimTokens = () => {
    if (canClaimTokens) {
      const tokensToClaim = 10 + userData.streak;
      const today = getTodayDateString();
      
      if (userData.testingMode) {
        saveUserData({ ...userData, tokens: userData.tokens + tokensToClaim });
      } else {
        saveUserData({ ...userData, tokens: userData.tokens + tokensToClaim, lastClaimDate: today });
        setCanClaimTokens(false);
      }
    }
  };

  const toggleTestingMode = () => {
    const newTestingMode = !userData.testingMode;
    saveUserData({ ...userData, testingMode: newTestingMode });
  };

  return (
    <View style={[styles.container, userData.testingMode && styles.testingContainer]}>
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

      <Image 
        source={isTracking ? require('../../assets/images/sleeping_cat.png') : require('../../assets/images/awake_cat.png')}
        style={styles.mascot}
      />

      {isTracking && <Text style={styles.trackingIndicator}>Recording Sleep...</Text>}
      <View style={styles.statsContainer}>
        <Text style={styles.statText}>Tokens: {userData.tokens}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={toggleTracking}>
          <Text style={styles.buttonText}>{isTracking ? 'Stop Tracking' : 'Start Tracking'}</Text>
        </TouchableOpacity>
        {!isTracking && canClaimTokens && <Button title="Claim Tokens" onPress={claimTokens} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 80, // Increased top padding
  },
  header: {
    width: '100%',
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1, // Ensure header is on top
  },
  testingContainer: {
    backgroundColor: '#d4edda', // Light green for testing mode
  },
  mascot: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  trackingIndicator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000080',
    marginBottom: 10,
  },
  statsContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  statText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonContainer: {
    width: '100%',
    padding: 10, 
    alignItems: 'center',
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
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent background
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
  },
});
