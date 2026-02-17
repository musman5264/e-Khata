import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { DataTable, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type SortOrder = 'asc' | 'desc';

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSort: string;
  currentOrder: SortOrder;
  onSort: (key: string) => void;
  numeric?: boolean;
  style?: any;
}

/**
 * A DataTable.Title wrapper that shows sort indicators and toggles sort on press.
 */
export default function SortableHeader({
  label,
  sortKey,
  currentSort,
  currentOrder,
  onSort,
  numeric,
  style,
}: SortableHeaderProps) {
  const isActive = currentSort === sortKey;
  const icon = isActive
    ? currentOrder === 'asc'
      ? 'arrow-up'
      : 'arrow-down'
    : 'unfold-more-horizontal';

  return (
    <DataTable.Title numeric={numeric} style={style}>
      <Pressable
        onPress={() => onSort(sortKey)}
        style={styles.pressable}
      >
        <Text style={[styles.label, isActive && styles.activeLabel]}>{label}</Text>
        <MaterialCommunityIcons
          name={icon}
          size={12}
          color={isActive ? '#1B2B65' : '#aaa'}
          style={{ marginLeft: 2 }}
        />
      </Pressable>
    </DataTable.Title>
  );
}

/** Helper: toggle sort state. Returns new { sortBy, sortOrder } */
export function toggleSort(
  currentSortBy: string,
  currentOrder: SortOrder,
  newKey: string
): { sortBy: string; sortOrder: SortOrder } {
  if (currentSortBy === newKey) {
    return { sortBy: newKey, sortOrder: currentOrder === 'asc' ? 'desc' : 'asc' };
  }
  return { sortBy: newKey, sortOrder: 'asc' };
}

/** Helper: sort an array by a key */
export function sortData<T>(data: T[], sortBy: string, sortOrder: SortOrder): T[] {
  if (!sortBy || !data?.length) return data;
  return [...data].sort((a: any, b: any) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    // Handle nulls
    if (aVal == null) aVal = '';
    if (bVal == null) bVal = '';
    // Numeric comparison
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }
    // String comparison
    const cmp = String(aVal).localeCompare(String(bVal), 'en', { sensitivity: 'base' });
    return sortOrder === 'asc' ? cmp : -cmp;
  });
}

const styles = StyleSheet.create({
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  label: {
    fontWeight: '700',
    fontSize: 12,
    color: '#333',
  },
  activeLabel: {
    color: '#1B2B65',
  },
});
