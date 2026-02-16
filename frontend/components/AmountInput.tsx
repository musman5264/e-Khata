import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Text, Surface } from 'react-native-paper';
import { colors, spacing } from '@/theme';

interface AmountInputProps {
  value: string;
  onChangeText: (value: string) => void;
  type?: 'debit' | 'credit';
  label?: string;
}

export default function AmountInput({ value, onChangeText, type = 'debit', label }: AmountInputProps) {
  const bgColor = type === 'debit' ? '#FFEBEE' : '#E0F2F1';

  const handleChange = (text: string) => {
    // Allow only numbers and one decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    onChangeText(cleaned);
  };

  return (
    <Surface style={[styles.container, { backgroundColor: bgColor }]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        <Text style={styles.currency}>₨</Text>
        <TextInput
          value={value}
          onChangeText={handleChange}
          keyboardType="numeric"
          placeholder="0.00"
          style={styles.input}
          mode="flat"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
        />
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 12, padding: spacing.md },
  label: { fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center' },
  currency: { fontSize: 28, fontWeight: 'bold', marginRight: 8, color: colors.textPrimary },
  input: { flex: 1, fontSize: 32, backgroundColor: 'transparent', fontWeight: 'bold' },
});
