import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export function useShimmer(active: boolean): Animated.Value {
  const shimmer = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    if (!active) {
      shimmer.setValue(0.35);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [active, shimmer]);

  return shimmer;
}
