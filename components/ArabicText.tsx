import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';

interface ArabicTextProps {
  children: string;
  fontSize?: number;
  style?: TextStyle;
  bold?: boolean;
}

export default function ArabicText({ children, fontSize = 18, style, bold }: ArabicTextProps) {
  return (
    <Text
      style={[
        styles.arabic,
        { fontSize },
        bold && { fontFamily: 'Amiri_700Bold' },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  arabic: {
    fontFamily: 'Amiri_400Regular',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 32,
    color: '#1a1a2e',
  },
});
