import React, { useCallback, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ScrollView } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import ArabicText from './ArabicText';

interface CitationChipProps {
  type: 'quran' | 'hadith';
  label: string;
  fullText: string;
  arabicText?: string;
}

export default function CitationChip({ type, label, fullText, arabicText }: CitationChipProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);

  const handlePress = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const bgColor = type === 'quran' ? '#dcfce7' : '#dbeafe';
  const textColor = type === 'quran' ? '#166534' : '#1e40af';
  const borderColor = type === 'quran' ? '#86efac' : '#93c5fd';

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        style={[styles.chip, { backgroundColor: bgColor, borderColor }]}
      >
        <Text style={[styles.label, { color: textColor }]}>
          {type === 'quran' ? '📖 ' : '📜 '}{label}
        </Text>
      </TouchableOpacity>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['50%', '75%']}
        enablePanDownToClose
        style={styles.sheet}
      >
        <BottomSheetView style={styles.sheetContent}>
          <View style={[styles.badge, { backgroundColor: bgColor }]}>
            <Text style={[styles.badgeText, { color: textColor }]}>
              {type === 'quran' ? 'Quran' : 'Hadith'} — {label}
            </Text>
          </View>
          <ScrollView>
            {arabicText ? (
              <ArabicText fontSize={20} style={styles.arabicBlock}>{arabicText}</ArabicText>
            ) : null}
            <Text style={styles.sourceText}>{fullText}</Text>
          </ScrollView>
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 4,
  },
  label: { fontSize: 12, fontWeight: '600' },
  sheet: { zIndex: 100 },
  sheetContent: { padding: 20, flex: 1 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: { fontWeight: '700', fontSize: 13 },
  arabicBlock: { marginBottom: 16, padding: 12, backgroundColor: '#fafaf0', borderRadius: 8 },
  sourceText: { fontSize: 15, lineHeight: 24, color: '#374151' },
});
