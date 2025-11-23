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

  const claimButtonText = userData?.testingMode ? '+ Claim Tokens (Test)' : '+ Claim Tokens';

  return (
    <View style={styles.container}>
        {userData?.testingMode && (
            <View style={styles.testBadge}>
                <Text style={styles.testBadgeText}>TEST MODE</Text>
            </View>
        )}
        <>
          {isTracking && stars.map(star => (
            <Star key={star.id} style={{ top: star.top, left: star.left }} />
          ))}
          
          {!isTracking && (
              <View style={styles.streakContainer}>
                  <Text style={styles.streakText}>
                      Current Streak: <Text style={styles.streakValue}>{userData?.streak || 0}</Text> days
                  </Text>
              </View>
          )}

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
            <Image source={require('../../assets/images/star.png')} style={styles.tokenIcon} />
            <Text style={styles.statText}>{userData?.tokens ?? 0}</Text>
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
                      <Text style={styles.buttonText}>{claimButtonText}</Text>
                    </TouchableOpacity>
                )}
            </View>
          </View>
        </>
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
  mascotContainer: {
    width: 350,
    height: 350,
    marginBottom: 20,
    zIndex: 1, // Ensure cat is on top of stars
  },
  mascot: {
    width: 350,
    height: 350,
    marginBottom: 20,
  },
  chatbox: {
    width: 200,
    height: 65,
    position: 'absolute',
    top: 0,
    left: -20,
  },
  trackingIndicator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#add8e6',
    fontFamily: 'Jersey25-Regular',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A1F3D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#D4BFFF',
    marginBottom: 40, // Increased bottom margin
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  tokenIcon: {
    width: 30,
    height: 30,
    marginRight: 12,
  },
  statText: {
    fontSize: 32,
    color: '#FFFFFF',
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
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 28,
    textAlign: 'center',
    fontFamily: 'Jersey25-Regular',
  },
  bottomContentContainer: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testBadge: {
    position: 'absolute',
    top: 45,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    zIndex: 100,
  },
  testBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  streakContainer: {
    marginBottom: 10,
    backgroundColor: 'rgba(42, 31, 61, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D4BFFF',
  },
  streakText: {
    fontSize: 18,
    color: '#E0E0E0',
    fontFamily: 'Jersey25-Regular',
  },
  streakValue: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: 'bold',
  },
});
