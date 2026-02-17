import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Keyboard, Platform, Pressable } from 'react-native';
import { TextInput, Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '@/theme';

export interface DropdownItem {
  label: string;
  value: string | number;
  subtitle?: string;
}

interface SearchableDropdownProps {
  label?: string;
  items?: DropdownItem[];
  value?: string | number | null;
  onSelect: ((item: DropdownItem) => void) | ((value: any) => void);
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  mode?: 'outlined' | 'flat';
  style?: any;
  // Legacy prop aliases (backward compat)
  options?: DropdownItem[];
  selectedValue?: string | number | null;
}

export default function SearchableDropdown({
  label = '',
  items: itemsProp,
  value: valueProp,
  onSelect,
  placeholder = 'Search...',
  error,
  disabled = false,
  mode = 'outlined',
  style,
  options,
  selectedValue,
}: SearchableDropdownProps) {
  // Support both old (options/selectedValue) and new (items/value) APIs
  const items = itemsProp || options || [];
  const value = valueProp !== undefined ? valueProp : (selectedValue !== undefined ? selectedValue : null);
  // Detect legacy mode: old callers pass onSelect(value) instead of onSelect(item)
  const isLegacy = !!(options || selectedValue !== undefined);
  const handleItemSelect = useCallback((item: DropdownItem) => {
    if (isLegacy) {
      (onSelect as (value: any) => void)(item.value);
    } else {
      (onSelect as (item: DropdownItem) => void)(item);
    }
  }, [onSelect, isLegacy]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<any>(null);

  // Find selected label
  const selectedItem = useMemo(
    () => items.find((i) => String(i.value) === String(value)),
    [items, value],
  );

  // Filter items by search
  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        (i.subtitle && i.subtitle.toLowerCase().includes(q)) ||
        String(i.value).includes(q),
    );
  }, [items, search]);

  const handleSelect = useCallback((item: DropdownItem) => {
    handleItemSelect(item);
    setSearch('');
    setOpen(false);
    Keyboard.dismiss();
  }, [handleItemSelect]);

  const handleFocus = () => {
    if (!disabled) {
      setOpen(true);
      setSearch('');
    }
  };

  const handleBlur = () => {
    // Delay to allow touch on list item
    setTimeout(() => setOpen(false), 250);
  };

  return (
    <View style={[styles.container, open && styles.containerOpen, style]}>
      <TextInput
        ref={inputRef}
        label={label}
        value={open ? search : selectedItem?.label || ''}
        onChangeText={setSearch}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={open ? placeholder : undefined}
        mode={mode}
        error={!!error}
        disabled={disabled}
        right={
          <TextInput.Icon
            icon={open ? 'chevron-up' : 'chevron-down'}
            onPress={() => {
              if (open) {
                setOpen(false);
              } else {
                inputRef.current?.focus();
              }
            }}
          />
        }
        style={styles.input}
      />
      {error && <Text style={styles.error}>{error}</Text>}

      {open && (
        <>
          {/* Backdrop to close dropdown when clicking outside */}
          {Platform.OS === 'web' && (
            <Pressable
              style={styles.backdrop}
              onPress={() => setOpen(false)}
            />
          )}
          <Surface style={styles.dropdown} elevation={4}>
            {filtered.length === 0 ? (
              <View style={styles.emptyRow}>
                <MaterialCommunityIcons name="magnify-close" size={18} color={colors.textHint} />
                <Text style={styles.emptyText}>No results found</Text>
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item) => String(item.value)}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                style={styles.list}
                renderItem={({ item }) => {
                  const isSelected = String(item.value) === String(value);
                  return (
                    <TouchableOpacity
                      style={[styles.item, isSelected && styles.itemSelected]}
                      onPress={() => handleSelect(item)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.itemLabel, isSelected && styles.itemLabelSelected]}>
                          {item.label}
                        </Text>
                        {item.subtitle && (
                          <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                        )}
                      </View>
                      {isSelected && (
                        <MaterialCommunityIcons name="check" size={18} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </Surface>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1,
    marginBottom: spacing.md,
  },
  containerOpen: {
    zIndex: 9999,
  },
  backdrop: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
  },
  input: {
    backgroundColor: '#fff',
  },
  error: {
    color: colors.error,
    fontSize: 12,
    marginTop: 2,
    marginLeft: 12,
  },
  dropdown: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxHeight: 220,
    zIndex: 9999,
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.15)' },
      default: { elevation: 6 },
    }),
  },
  list: {
    maxHeight: 220,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  itemSelected: {
    backgroundColor: colors.primary + '10',
  },
  itemLabel: {
    fontSize: 14,
    color: colors.text,
  },
  itemLabelSelected: {
    fontWeight: '600',
    color: colors.primary,
  },
  itemSubtitle: {
    fontSize: 11,
    color: colors.textHint,
    marginTop: 1,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  emptyText: {
    color: colors.textHint,
    fontSize: 13,
  },
});
