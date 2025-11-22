
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Button, Image } from 'react-native';
import { useRecording } from '../context/RecordingContext';

export default function App() {
  const { isTracking, toggleTracking, userData, canClaimTokens, claimTokens } = useRecording();

  return (
    <View style={[styles.container, userData?.testingMode && styles.testingContainer]}>
      <Image 
        source={isTracking ? require('../../assets/images/sleeping_cat.png') : require('../../assets/images/awake_cat.png')}
        style={styles.mascot}
      />

      <View style={styles.statsContainer}>
        <Text style={styles.statText}>Tokens: {userData?.tokens ?? 0}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={toggleTracking}>
          <Text style={styles.buttonText}>{isTracking ? 'Stop Tracking' : 'Start Tracking'}</Text>
        </TouchableOpacity>
        <View style={styles.bottomContentContainer}>
            {isTracking ? (
                <Text style={styles.trackingIndicator}>Recording Sleep...</Text>
            ) : (
                canClaimTokens && <Button title="Claim Tokens" onPress={claimTokens} />
            )}
        </View>
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
    color: '#add8e6',
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
    position: 'absolute',
    bottom: 50,
    width: '100%',
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
  buttonText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  bottomContentContainer: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
