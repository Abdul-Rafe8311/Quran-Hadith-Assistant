import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';

export default function SkeletonLoader() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.card, { opacity }]}>
        <Text style={styles.label}>Searching your Islamic books...</Text>
        <View style={styles.line} />
        <View style={[styles.line, { width: '80%' }]} />
        <View style={[styles.line, { width: '60%' }]} />
        <View style={styles.chipRow}>
          <View style={[styles.chip, { backgroundColor: '#bbf7d0' }]} />
          <View style={[styles.chip, { backgroundColor: '#bfdbfe' }]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  label: { color: '#6b7280', fontSize: 13, marginBottom: 12, fontStyle: 'italic' },
  line: { backgroundColor: '#e5e7eb', borderRadius: 4, height: 12, width: '100%', marginBottom: 8 },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  chip: { height: 24, width: 80, borderRadius: 12 },
});
