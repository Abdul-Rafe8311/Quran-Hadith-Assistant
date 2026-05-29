import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, RefreshControl, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { SavedAnswer } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';

export default function SavedScreen() {
  const [saved, setSaved] = useState<SavedAnswer[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSaved();
    }, [])
  );

  async function loadSaved() {
    try {
      const { data } = await supabase
        .from('saved_answers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (data && data.length > 0) {
        setSaved(data as SavedAnswer[]);
        return;
      }
    } catch {}
    try {
      const local = await AsyncStorage.getItem('saved_answers');
      if (local) setSaved(JSON.parse(local));
    } catch {}
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete', 'Remove this saved answer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          setSaved(prev => prev.filter(s => s.id !== id));
          try {
            await supabase.from('saved_answers').delete().eq('id', id);
          } catch {}
          try {
            const local = await AsyncStorage.getItem('saved_answers');
            const list: SavedAnswer[] = local ? JSON.parse(local) : [];
            await AsyncStorage.setItem('saved_answers', JSON.stringify(list.filter(s => s.id !== id)));
          } catch {}
        }
      }
    ]);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadSaved();
    setRefreshing(false);
  }

  function renderItem({ item }: { item: SavedAnswer }) {
    const isExpanded = expanded === item.id;
    const citations = item.citations as any;
    const qCount = citations?.quran_sources?.length || 0;
    const hCount = citations?.hadith_sources?.length || 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setExpanded(isExpanded ? null : item.id)}
        onLongPress={() => handleDelete(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.question} numberOfLines={isExpanded ? undefined : 2}>
            {item.question}
          </Text>
          <View style={styles.badges}>
            {qCount > 0 && <View style={styles.qBadge}><Text style={styles.qBadgeText}>📖 {qCount}</Text></View>}
            {hCount > 0 && <View style={styles.hBadge}><Text style={styles.hBadgeText}>📜 {hCount}</Text></View>}
          </View>
        </View>
        <Text style={styles.answer} numberOfLines={isExpanded ? undefined : 3}>
          {item.answer}
        </Text>
        <Text style={styles.date}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={saved}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a5c38" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔖</Text>
            <Text style={styles.emptyText}>No saved answers yet</Text>
            <Text style={styles.emptyHint}>Tap the Save button on any answer to bookmark it</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  list: { padding: 16, flexGrow: 1 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  question: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1a5c38', marginRight: 8 },
  badges: { flexDirection: 'row', gap: 4 },
  qBadge: { backgroundColor: '#dcfce7', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  qBadgeText: { fontSize: 11, color: '#166534', fontWeight: '600' },
  hBadge: { backgroundColor: '#dbeafe', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  hBadgeText: { fontSize: 11, color: '#1e40af', fontWeight: '600' },
  answer: { fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 8 },
  date: { fontSize: 11, color: '#9ca3af' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 4 },
  emptyHint: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingHorizontal: 32 },
});
