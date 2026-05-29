import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Topic } from '../constants/topics';

interface TopicButtonProps {
  topic: Topic;
  onPress: (query: string) => void;
}

export default function TopicButton({ topic, onPress }: TopicButtonProps) {
  return (
    <TouchableOpacity style={styles.pill} onPress={() => onPress(topic.query)}>
      <Text style={styles.emoji}>{topic.emoji}</Text>
      <Text style={styles.label}>{topic.label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  emoji: { fontSize: 14, marginRight: 4 },
  label: { fontSize: 13, color: '#166534', fontWeight: '600' },
});
