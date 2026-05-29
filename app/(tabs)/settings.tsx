import React, { useState, useEffect } from 'react';
import {
  View, Text, Switch, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

export default function SettingsScreen() {
  const [language, setLanguage] = useState<'en' | 'ur'>('en');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [sourceBooks, setSourceBooks] = useState<string[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('settings').then(val => {
      if (val) {
        const s = JSON.parse(val);
        setLanguage(s.language || 'en');
        setFontSize(s.fontSize || 'medium');
      }
    });
    loadSourceBooks();
  }, []);

  async function loadSourceBooks() {
    setBooksLoading(true);
    try {
      const { data, error } = await supabase
        .from('islamic_knowledge')
        .select('metadata')
        .not('metadata->book', 'is', null)
        .limit(1000);

      if (!error && data) {
        const books = new Set<string>();
        for (const row of data) {
          const book = (row.metadata as any)?.book;
          if (book) books.add(book);
        }
        setSourceBooks(Array.from(books).sort());
      }
    } catch {
      setSourceBooks([]);
    } finally {
      setBooksLoading(false);
    }
  }

  async function saveSettings(updates: Partial<{ language: 'en' | 'ur'; fontSize: 'small' | 'medium' | 'large' }>) {
    const current = { language, fontSize, ...updates };
    await AsyncStorage.setItem('settings', JSON.stringify(current));
  }

  async function clearHistory() {
    Alert.alert('Clear History', 'This will delete your chat history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive', onPress: async () => {
          await AsyncStorage.removeItem('chat_history');
          Alert.alert('Done', 'Chat history cleared.');
        }
      }
    ]);
  }

  async function clearSaved() {
    Alert.alert('Clear Saved Answers', 'This will delete all saved answers.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive', onPress: async () => {
          await AsyncStorage.removeItem('saved_answers');
          try {
            await supabase.from('saved_answers').delete().neq('id', '');
          } catch {}
          Alert.alert('Done', 'Saved answers cleared.');
        }
      }
    ]);
  }

  function FontSizeBtn({ size, label }: { size: 'small' | 'medium' | 'large'; label: string }) {
    const active = fontSize === size;
    return (
      <TouchableOpacity
        style={[styles.fsBtn, active && styles.fsBtnActive]}
        onPress={() => {
          setFontSize(size);
          saveSettings({ fontSize: size });
        }}
      >
        <Text style={[styles.fsBtnText, active && styles.fsBtnTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>English / Urdu</Text>
            <Switch
              value={language === 'ur'}
              onValueChange={val => {
                const l = val ? 'ur' : 'en';
                setLanguage(l);
                saveSettings({ language: l });
              }}
              trackColor={{ false: '#d1d5db', true: '#1a5c38' }}
              thumbColor="#fff"
            />
          </View>
          <Text style={styles.hint}>{language === 'ur' ? 'اردو فعال ہے' : 'English active'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Font Size</Text>
          <View style={styles.fsRow}>
            <FontSizeBtn size="small" label="Small" />
            <FontSizeBtn size="medium" label="Medium" />
            <FontSizeBtn size="large" label="Large" />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Source Books</Text>
            <TouchableOpacity onPress={loadSourceBooks}>
              <Text style={styles.refreshBtn}>↺ Refresh</Text>
            </TouchableOpacity>
          </View>
          {booksLoading ? (
            <ActivityIndicator color="#1a5c38" style={{ marginTop: 8 }} />
          ) : sourceBooks.length === 0 ? (
            <Text style={styles.noBooksText}>
              No books ingested yet. Run{' '}
              <Text style={styles.code}>npm run ingest</Text>
              {' '}after placing PDFs in scripts/pdfs/.
            </Text>
          ) : (
            sourceBooks.map(book => (
              <View key={book} style={styles.bookRow}>
                <Text style={styles.bookIcon}>
                  {book.toLowerCase().includes('quran') ? '📖' : '📜'}
                </Text>
                <Text style={styles.bookName}>{book}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <TouchableOpacity style={styles.dangerBtn} onPress={clearHistory}>
            <Text style={styles.dangerBtnText}>Clear Chat History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dangerBtn} onPress={clearSaved}>
            <Text style={styles.dangerBtnText}>Clear Saved Answers</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>Quran & Hadith Assistant</Text>
            <Text style={styles.aboutText}>
              Answers are sourced exclusively from authentic Islamic PDF books that you provide. No external APIs or internet sources are used for content.
            </Text>
            <Text style={styles.disclaimer}>
              ⚠️ Not a fatwa service. For religious rulings, please consult a qualified Islamic scholar (Mufti).
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.8 },
  refreshBtn: { fontSize: 13, color: '#1a5c38', fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 15, color: '#111827' },
  hint: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  fsRow: { flexDirection: 'row', gap: 8 },
  fsBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1,
    borderColor: '#d1d5db', alignItems: 'center',
  },
  fsBtnActive: { backgroundColor: '#1a5c38', borderColor: '#1a5c38' },
  fsBtnText: { fontSize: 14, color: '#374151', fontWeight: '600' },
  fsBtnTextActive: { color: '#fff' },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  bookIcon: { fontSize: 16, marginRight: 10 },
  bookName: { fontSize: 14, color: '#111827', flex: 1 },
  noBooksText: { fontSize: 13, color: '#6b7280', lineHeight: 20, marginTop: 4 },
  code: { fontFamily: 'monospace', backgroundColor: '#f3f4f6', color: '#374151' },
  dangerBtn: {
    borderWidth: 1, borderColor: '#fecaca', borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 14, marginBottom: 8,
    backgroundColor: '#fef2f2',
  },
  dangerBtnText: { color: '#dc2626', fontWeight: '600' },
  aboutCard: { gap: 8 },
  aboutTitle: { fontSize: 16, fontWeight: '700', color: '#1a5c38' },
  aboutText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  disclaimer: { fontSize: 12, color: '#92400e', lineHeight: 18, backgroundColor: '#fffbeb', padding: 10, borderRadius: 8 },
});
