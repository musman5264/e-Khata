import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform, TextInput as RNTextInput } from 'react-native';
import { TextInput, Text } from 'react-native-paper';
import { colors } from '@/theme';

interface DateInputProps {
  label?: string;
  value: string;
  onChangeText: (val: string) => void;
  placeholder?: string;
  style?: any;
}

/**
 * Date input that uses native HTML date picker on web,
 * and a formatted text input on mobile.
 */
export default function DateInput({ label, value, onChangeText, placeholder, style }: DateInputProps) {
  const webRef = useRef<HTMLInputElement | null>(null);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.webContainer, style]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View style={styles.webInputWrap}>
          <input
            ref={webRef}
            type="date"
            value={value || ''}
            onChange={(e) => onChangeText(e.target.value)}
            placeholder={placeholder || 'Select date'}
            style={{
              width: '100%',
              height: 40,
              border: '1px solid #C4C6CF',
              borderRadius: 8,
              paddingLeft: 12,
              paddingRight: 12,
              fontSize: 13,
              fontFamily: 'inherit',
              color: '#333',
              backgroundColor: '#fff',
              outline: 'none',
              cursor: 'pointer',
              boxSizing: 'border-box' as any,
            }}
          />
        </View>
      </View>
    );
  }

  // Mobile fallback — text input with mask hint
  return (
    <View style={style}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        mode="outlined"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || 'YYYY-MM-DD'}
        dense
        style={{ backgroundColor: '#fff', fontSize: 13 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  webContainer: {},
  label: {
    fontSize: 11,
    color: '#8A8FA8',
    fontWeight: '600',
    marginBottom: 4,
  },
  webInputWrap: {
    minHeight: 40,
  },
});
