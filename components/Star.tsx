
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet } from 'react-native';

const Star = ({ style }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const wiggleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotate = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000 + Math.random() * 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 2000 + Math.random() * 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );

    const wiggle = Animated.loop(
      Animated.sequence([
        Animated.timing(wiggleAnim, {
          toValue: 1, 
          duration: 500 + Math.random() * 500,
          easing: Easing.easeInOut, 
          useNativeDriver: true,
        }),
        Animated.timing(wiggleAnim, {
          toValue: -1, 
          duration: 500 + Math.random() * 500,
          easing: Easing.easeInOut, 
          useNativeDriver: true,
        }),
        Animated.timing(wiggleAnim, {
          toValue: 0,
          duration: 500 + Math.random() * 500,
          easing: Easing.easeInOut,
          useNativeDriver: true,
        }),
      ])
    );

    rotate.start();
    wiggle.start();

    return () => {
      rotate.stop();
      wiggle.stop();
    };
  }, []);

  const rotateInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '15deg'],
  });

  const wiggleInterpolation = wiggleAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-2, 2],
  })

  return (
    <Animated.Image
      source={require('../assets/images/star.png')}
      style={[
        styles.star,
        style,
        {
          transform: [
            { rotate: rotateInterpolation }, 
            { translateX: wiggleInterpolation },
            { translateY: wiggleInterpolation },
          ],
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
    width: 50,
    height: 50,
  },
});

export default Star;
