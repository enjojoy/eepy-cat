
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ImageBackground, Animated, Dimensions } from 'react-native';
import { useRecording } from '../context/RecordingContext';
import Star from '../../components/Star';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const STAR_SIZE = 50;
const MIN_DISTANCE = 50;
const NUM_STARS = 8;

// Function to check for overlap
const checkOverlap = (newStar, existingStars) => {
  for (let otherStar of existingStars) {
    const dx = newStar.left - otherStar.left;
    const dy = newStar.top - otherStar.top;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < STAR_SIZE + MIN_DISTANCE) {
      return true; // Overlap detected
    }
  }
  return false; // No overlap
};

// Function to generate star positions
const generateStars = () => {
  const stars = [];
  let attempts = 0;
  for (let i = 0; i < NUM_STARS; i++) {
    let newStar;
    let overlap;
    do {
      newStar = {
        id: i,
        top: Math.random() * (screenHeight * 0.4), // Upper 40% of the screen
        left: Math.random() * (screenWidth - STAR_SIZE),
      };
      overlap = checkOverlap(newStar, stars);
      attempts++;
      if(attempts > 1000) { // a safety break to avoid infinite loops
          console.log("Could not place all stars without overlap after 1000 attempts");
          break;
      }
    } while (overlap);
    if (attempts <= 1000) {
        stars.push(newStar);
    }
  }
  return stars;
};

export default function App() {
  const { isTracking, toggleTracking, userData, canClaimTokens, claimTokens } = useRecording();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [stars, setStars] = useState([]);

  useEffect(() => {
    if (isTracking) {
      setStars(generateStars());
    } else {
        setStars([]);
    }
  }, [isTracking]);


  const handleStartTracking = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        toggleTracking();
        fadeAnim.setValue(0);
      }, 2000);
    });
  };

  return (
    <View style={[styles.container, userData?.testingMode && styles.testingContainer]}>
       {isTracking && stars.map(star => (
        <Star key={star.id} style={{ top: star.top, left: star.left }} />
      ))}
      {isTracking ? (
        <View style={styles.mascotContainer}>
          <Image
            source={require('../../assets/images/sleeping_cat.png')}
            style={styles.mascot}
          />
        </View>
      ) : (
        <ImageBackground
          source={require('../../assets/images/awake_cat.png')}
          style={styles.mascot}
        >
          <Animated.Image
            source={require('../../assets/images/chatbox.png')}
            style={[styles.chatbox, { opacity: fadeAnim }]}
          />
        </ImageBackground>
      )}

      <View style={styles.statsContainer}>
        <Text style={styles.statText}>Tokens: {userData?.tokens ?? 0}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={isTracking ? toggleTracking : handleStartTracking}>
          <Text style={styles.buttonText}>{isTracking ? 'Stop Tracking' : 'Start Tracking'}</Text>
        </TouchableOpacity>
        <View style={styles.bottomContentContainer}>
            {isTracking ? (
                <Text style={styles.trackingIndicator}>Recording Sleep...</Text>
            ) : (
                canClaimTokens &&
                <TouchableOpacity style={styles.button} onPress={claimTokens}>
                  <Text style={styles.buttonText}>Claim Tokens</Text>
                </TouchableOpacity>
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
    backgroundColor: '#190e1c',
  },
  testingContainer: {
    backgroundColor: '#d4edda', // Light green for testing mode
  },
  mascotContainer: {
    width: 260,
    height: 260,
    marginBottom: 20,
    zIndex: 1, // Ensure cat is on top of stars
  },
  mascot: {
    width: 260,
    height: 260,
    marginBottom: 20,
  },
  chatbox: {
    width: 200,
    height: 65,
    position: 'absolute',
    top: -35,
    left: -80,
  },
  trackingIndicator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#add8e6',
    fontFamily: 'Jersey25-Regular',
  },
  statsContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  statText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Jersey25-Regular',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#D4BFFF',
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
    fontFamily: 'Jersey25-Regular',
  },
  bottomContentContainer: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
