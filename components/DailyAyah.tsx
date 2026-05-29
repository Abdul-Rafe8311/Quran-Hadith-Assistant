import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import ArabicText from './ArabicText';

export default function DailyAyah() {
  const [ayah, setAyah] = useState<{ content: string; metadata: any } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailyAyah();
  }, []);

  async function fetchDailyAyah() {
    try {
      const { data, error } = await supabase
        .from('islamic_knowledge')
        .select('content, metadata')
        .eq('source_type', 'quran')
        .eq('lang', 'en')
        .limit(1)
        .order('id', { ascending: false });

      if (!error && data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * Math.min(data.length, 100));
        setAyah(data[randomIndex] || data[0]);
      }
    } catch (e) {
      console.error('Daily ayah error:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color="#1a5c38" />
      </View>
    );
  }

  if (!ayah) {
    return (
      <View style={styles.card}>
        <ArabicText fontSize={20}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</ArabicText>
        <Text style={styles.translation}>In the name of Allah, the Most Gracious, the Most Merciful</Text>
        <Text style={styles.citation}>Al-Fatiha 1:1</Text>
      </View>
    );
  }

  const meta = ayah.metadata || {};
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Daily Ayah</Text>
      {meta.arabic_text ? (
        <ArabicText fontSize={20} style={styles.arabic}>{meta.arabic_text}</ArabicText>
      ) : null}
      <Text style={styles.translation}>{ayah.content}</Text>
      {meta.surah_name && (
        <Text style={styles.citation}>
          — {meta.surah_name} {meta.surah_number}:{meta.ayah_number}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#1a5c38',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a5c38',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  arabic: { marginBottom: 12 },
  translation: { fontSize: 15, lineHeight: 22, color: '#374151', marginBottom: 8 },
  citation: { fontSize: 12, color: '#6b7280', fontStyle: 'italic', textAlign: 'right' },
});
