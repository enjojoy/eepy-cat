
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gyroscope } from 'expo-sensors';
import { SleepData } from '@/types/sleep';
import { UserData } from '@/types/user';

const SLEEP_STORAGE_KEY = '@sleepData';
const USER_STORAGE_KEY = '@userData';

interface RecordingContextType {
  isTracking: boolean;
  startTime: number | null;
  movementData: { timestamp: number; movement: number }[];
  lastRecording: SleepData | null;
  allRecordings: SleepData[];
  toggleTracking: () => void;
  userData: UserData | null;
  loadData: () => void;
  clearData: () => void;
  canClaimTokens: boolean;
  claimTokens: () => void;
  toggleTestingMode: () => void;
  loadAllRecordings: () => void;
  showWalletModal: boolean;
  setShowWalletModal: (visible: boolean) => void;
  walletAddress: string;
  setWalletAddress: (address: string) => void;
  saveWalletAddress: (address: string) => void;
  hasPendingWalletRequest: boolean;
  setHasPendingWalletRequest: (pending: boolean) => void;
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

export const useRecording = () => {
  const context = useContext(RecordingContext);
  if (!context) {
    throw new Error('useRecording must be used within a RecordingProvider');
  }
  return context;
};

interface RecordingProviderProps {
  children: ReactNode;
}

export const RecordingProvider = ({ children }: RecordingProviderProps) => {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [movementData, setMovementData] = useState<{ timestamp: number; movement: number }[]>([]);
  const [lastRecording, setLastRecording] = useState<SleepData | null>(null);
  const [allRecordings, setAllRecordings] = useState<SleepData[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [canClaimTokens, setCanClaimTokens] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [hasPendingWalletRequest, setHasPendingWalletRequest] = useState(false);

  const getTodayDateString = () => new Date().toISOString().split('T')[0];

  const loadAllRecordings = async () => {
    try {
        const storedSleepData = await AsyncStorage.getItem(SLEEP_STORAGE_KEY);
        if (storedSleepData) {
            const parsedData = JSON.parse(storedSleepData);
            const sortedData = parsedData.sort((a: SleepData, b: SleepData) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
            setAllRecordings(sortedData);
        }
    } catch (error) {
        console.error('Failed to load all recordings.', error);
    }
  };

  const loadData = async () => {
    try {
      const storedUserData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (storedUserData) {
        const parsedUserData = JSON.parse(storedUserData);
        setUserData({ ...{ streak: 0, lastSleepDate: null, tokens: 0, lastClaimDate: null, testingMode: false }, ...parsedUserData });
      } else {
        const initialUserData = { streak: 0, lastSleepDate: null, tokens: 0, lastClaimDate: null, testingMode: false };
        setUserData(initialUserData);
        await saveUserData(initialUserData);
      }
      
      loadAllRecordings();

    } catch (error) {
      console.error('Failed to load data.', error);
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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!userData) return;
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
    let subscription: any;
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

  const updateStreak = async () => {
      if (!userData) return;
    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0];

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
        const totalMovement = movementData.reduce((acc, data) => acc + data.movement, 0);
        if (duration > 15000 && totalMovement < 1) {
          setHasPendingWalletRequest(true);
        }
        const newSleepEntry: SleepData = { startTime, endTime, duration, movementData };
        setLastRecording(newSleepEntry);
        
        const storedSleepData = await AsyncStorage.getItem(SLEEP_STORAGE_KEY);
        const sleepData = storedSleepData ? JSON.parse(storedSleepData) : [];
        const updatedSleepData = [...sleepData, newSleepEntry];
        
        await saveSleepData(updatedSleepData);
        await updateStreak();
        loadAllRecordings();
      }
      setStartTime(null);
      setMovementData([]);
    } else {
      setIsTracking(true);
      setStartTime(Date.now());
      setMovementData([]);
      setLastRecording(null);
    }
  };

  const clearData = async () => {
    try {
      await AsyncStorage.multiRemove([SLEEP_STORAGE_KEY, USER_STORAGE_KEY]);
      const initialUserData = { streak: 0, lastSleepDate: null, tokens: 0, lastClaimDate: null, testingMode: false };
      setUserData(initialUserData);
      setLastRecording(null);
      setAllRecordings([]);
      await saveUserData(initialUserData);
      loadData();
    } catch (error) {
      console.error('Failed to clear data.', error);
    }
  };

  const claimTokens = () => {
    if (canClaimTokens && userData) {
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
    if (userData) {
      const newTestingMode = !userData.testingMode;
      saveUserData({ ...userData, testingMode: newTestingMode });
    }
  };

  const saveWalletAddress = async (address: string) => {
    if (userData) {
      await saveUserData({ ...userData, walletAddress: address });
      setHasPendingWalletRequest(false);
    }
  };
  
  return (
    <RecordingContext.Provider value={{
      isTracking,
      startTime,
      movementData,
      lastRecording,
      allRecordings,
      toggleTracking,
      userData,
      loadData,
      clearData,
      canClaimTokens,
      claimTokens,
      toggleTestingMode,
      loadAllRecordings,
      showWalletModal,
      setShowWalletModal,
      walletAddress,
      setWalletAddress,
      saveWalletAddress,
      hasPendingWalletRequest,
      setHasPendingWalletRequest,
    }}>
      {children}
    </RecordingContext.Provider>
  );
};
