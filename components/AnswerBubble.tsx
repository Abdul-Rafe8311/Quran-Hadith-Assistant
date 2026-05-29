import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Share, Clipboard, TouchableOpacity, Alert
} from 'react-native';
import CitationChip from './CitationChip';
import ArabicText from './ArabicText';
import { QuranSource, HadithSource } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

interface AnswerBubbleProps {
  question: string;
  answer: string;
  quranSources: QuranSource[];
  hadithSources: HadithSource[];
}

function containsArabic(text: string) {
  return /[؀-ۿ]/.test(text);
}

export default function AnswerBubble({ question, answer, quranSources, hadithSources }: AnswerBubbleProps) {
  const handleCopy = () => {
    Clipboard.setString(answer);
    Alert.alert('Copied', 'Answer copied to clipboard.');
  };

  const handleShare = async () => {
    await Share.share({ message: `Q: ${question}\n\nA: ${answer}` });
  };

  const handleBookmark = async () => {
    const saved = {
      id: Date.now().toString(),
      question,
      answer,
      citations: { quran_sources: quranSources, hadith_sources: hadithSources },
      created_at: new Date().toISOString(),
    };
    try {
      const existing = await AsyncStorage.getItem('saved_answers');
      const list = existing ? JSON.parse(existing) : [];
      list.unshift(saved);
      await AsyncStorage.setItem('saved_answers', JSON.stringify(list.slice(0, 50)));
      await supabase.from('saved_answers').insert({
        question,
        answer,
        citations: saved.citations,
      });
      Alert.alert('Saved', 'Answer bookmarked successfully.');
    } catch {
      Alert.alert('Saved locally', 'Bookmarked to local storage.');
    }
  };

  const lines = answer.split('\n');

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <ScrollView nestedScrollEnabled>
          {lines.map((line, i) => {
            if (line.startsWith('[') && line.endsWith(']')) {
              return (
                <Text key={i} style={styles.sectionHeader}>{line}</Text>
              );
            }
            if (containsArabic(line)) {
              return <ArabicText key={i} fontSize={18} style={styles.arabicLine}>{line}</ArabicText>;
            }
            return line.trim() ? <Text key={i} style={styles.answerText}>{line}</Text> : <View key={i} style={styles.spacer} />;
          })}

          {(quranSources.length > 0 || hadithSources.length > 0) && (
            <View style={styles.chipsSection}>
              <Text style={styles.chipsLabel}>Sources:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {quranSources.map((src, i) => (
                  <CitationChip
                    key={`q${i}`}
                    type="quran"
                    label={`${src.surah_name} ${src.chapter}:${src.verse}`}
                    fullText={src.text}
                    arabicText={src.arabic_text}
                  />
                ))}
                {hadithSources.map((src, i) => (
                  <CitationChip
                    key={`h${i}`}
                    type="hadith"
                    label={`${src.book} #${src.number}`}
                    fullText={src.text}
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>

        <View style={styles.actionRow}>
          <TouchableOpacity onPress={handleCopy} style={styles.actionBtn}>
            <Text style={styles.actionText}>📋 Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.actionBtn}>
            <Text style={styles.actionText}>📤 Share</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleBookmark} style={styles.actionBtn}>
            <Text style={styles.actionText}>🔖 Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 4 },
  bubble: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 16,
    maxWidth: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    fontWeight: '700',
    color: '#1a5c38',
    fontSize: 13,
    marginTop: 10,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  answerText: { fontSize: 15, lineHeight: 23, color: '#1f2937', marginBottom: 2 },
  arabicLine: { marginVertical: 6 },
  spacer: { height: 6 },
  chipsSection: { marginTop: 12 },
  chipsLabel: { fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: '600' },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginTop: 12,
    paddingTop: 8,
    gap: 4,
  },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  actionText: { fontSize: 12, color: '#6b7280' },
});
