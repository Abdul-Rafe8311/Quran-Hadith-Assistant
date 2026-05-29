import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import DailyAyah from '../../components/DailyAyah';
import TopicButton from '../../components/TopicButton';
import ArabicText from '../../components/ArabicText';
import { TOPICS } from '../../constants/topics';

export default function HomeScreen() {
  const router = useRouter();

  function handleTopicPress(query: string) {
    router.push({ pathname: '/(tabs)/chat', params: { prefill: query } });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ArabicText fontSize={28} style={styles.bismillah} bold>
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </ArabicText>
          <Text style={styles.subtitle}>Quran & Hadith Assistant</Text>
          <Text style={styles.tagline}>Grounded in authentic sources only</Text>
        </View>

        <DailyAyah />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore Topics</Text>
          <View style={styles.topicsGrid}>
            {TOPICS.map(topic => (
              <TopicButton key={topic.id} topic={topic} onPress={handleTopicPress} />
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.askBtn}
          onPress={() => router.push('/(tabs)/chat')}
        >
          <Text style={styles.askBtnText}>Ask a Question →</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Answers sourced from Quran and authenticated Hadith collections. Not a fatwa service.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0fdf4' },
  scroll: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#1a5c38',
  },
  bismillah: { color: '#f0e68c', marginBottom: 8, textAlign: 'center' },
  subtitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  tagline: { color: '#86efac', fontSize: 12, fontStyle: 'italic' },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a5c38',
    marginBottom: 12,
  },
  topicsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  askBtn: {
    backgroundColor: '#1a5c38',
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  askBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { paddingHorizontal: 16, paddingVertical: 20, alignItems: 'center' },
  footerText: { fontSize: 11, color: '#6b7280', textAlign: 'center', lineHeight: 16 },
});
