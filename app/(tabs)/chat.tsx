import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, Alert
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnswerBubble from '../../components/AnswerBubble';
import SkeletonLoader from '../../components/SkeletonLoader';
import { runRAGPipeline, detectLanguage, GeminiResponse } from '../../lib/rag';

interface Message {
  id: string;
  type: 'user' | 'answer' | 'error';
  text?: string;
  response?: GeminiResponse;
}

export default function ChatScreen() {
  const params = useLocalSearchParams<{ prefill?: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (params.prefill) {
      setInput(params.prefill);
    }
    loadHistory();
  }, [params.prefill]);

  async function loadHistory() {
    try {
      const stored = await AsyncStorage.getItem('chat_history');
      if (stored) {
        const history: Message[] = JSON.parse(stored);
        setMessages(history.slice(0, 40));
      }
    } catch {}
  }

  async function saveHistory(msgs: Message[]) {
    try {
      await AsyncStorage.setItem('chat_history', JSON.stringify(msgs.slice(0, 40)));
    } catch {}
  }

  const sendMessage = useCallback(async () => {
    const q = input.trim();
    if (!q || loading) return;

    const userMsg: Message = { id: Date.now().toString(), type: 'user', text: q };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const lang = detectLanguage(q);
      const response = await runRAGPipeline(q, lang);
      const answerMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'answer',
        response,
      };
      const updated = [...newMessages, answerMsg];
      setMessages(updated);
      saveHistory(updated);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'error',
        text: err.message?.includes('429') || err.message?.includes('Too many')
          ? 'Rate limit reached. Please wait a moment and try again.'
          : err.message || 'Failed to get answer. Please try again.',
      };
      const updated = [...newMessages, errorMsg];
      setMessages(updated);
      saveHistory(updated);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  function renderItem({ item }: { item: Message }) {
    if (item.type === 'user') {
      return (
        <View style={styles.userBubbleRow}>
          <View style={styles.userBubble}>
            <Text style={styles.userText}>{item.text}</Text>
          </View>
        </View>
      );
    }
    if (item.type === 'error') {
      return (
        <View style={styles.errorRow}>
          <View style={styles.errorBubble}>
            <Text style={styles.errorText}>⚠️ {item.text}</Text>
          </View>
        </View>
      );
    }
    if (item.type === 'answer' && item.response) {
      const msg = messages.find(m => m.id === item.id);
      const questionMsg = messages[messages.indexOf(msg!) - 1];
      return (
        <AnswerBubble
          question={questionMsg?.text || ''}
          answer={item.response.answer}
          quranSources={item.response.quran_sources}
          hadithSources={item.response.hadith_sources}
        />
      );
    }
    return null;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={88}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyArabic}>سبحان الله</Text>
              <Text style={styles.emptyText}>Ask a question about the Quran or Hadith</Text>
              <Text style={styles.emptyHint}>in English or اردو میں</Text>
            </View>
          }
          ListFooterComponent={loading ? <SkeletonLoader /> : null}
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask in English or اردو میں پوچھیں..."
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendBtnText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  flex: { flex: 1 },
  listContent: { paddingVertical: 16, paddingBottom: 8, flexGrow: 1 },
  userBubbleRow: { alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 4 },
  userBubble: {
    backgroundColor: '#1a5c38',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '78%',
  },
  userText: { color: '#fff', fontSize: 15, lineHeight: 21 },
  errorRow: { alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 4 },
  errorBubble: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 12,
    maxWidth: '88%',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: { color: '#991b1b', fontSize: 14, lineHeight: 20 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyArabic: {
    fontFamily: 'Amiri_400Regular',
    fontSize: 36,
    color: '#1a5c38',
    marginBottom: 16,
  },
  emptyText: { fontSize: 16, color: '#6b7280', marginBottom: 4 },
  emptyHint: { fontSize: 14, color: '#9ca3af' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#f9fafb',
    maxHeight: 120,
  },
  sendBtn: {
    backgroundColor: '#1a5c38',
    borderRadius: 24,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#d1d5db' },
  sendBtnText: { color: '#fff', fontSize: 18 },
});
