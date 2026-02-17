import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Card, Chip, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

/* ── helpers ── */
const ACTION_COLORS: Record<string, string> = {
  created: '#4CAF50',
  updated: '#2196F3',
  deleted: '#F44336',
};

const ACTION_ICONS: Record<string, string> = {
  created: 'plus-circle-outline',
  updated: 'pencil-outline',
  deleted: 'delete-outline',
};

const prettyKey = (k: string) =>
  k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const SKIP_KEYS = ['updated_at', 'created_at', 'id', 'tenant_id', 'remember_token', 'password'];

const formatVal = (v: any): string => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

/* ── change-diff row ── */
function DiffRow({ field, oldVal, newVal, action }: {
  field: string; oldVal?: any; newVal?: any; action: string;
}) {
  if (SKIP_KEYS.includes(field)) return null;

  return (
    <View style={s.diffRow}>
      <Text style={s.diffField}>{prettyKey(field)}</Text>
      <View style={s.diffValues}>
        {action === 'updated' ? (
          <>
            <Text style={s.diffOld} numberOfLines={2}>{formatVal(oldVal)}</Text>
            <MaterialCommunityIcons name="arrow-right" size={14} color="#8A8FA8" style={{ marginHorizontal: 4 }} />
            <Text style={s.diffNew} numberOfLines={2}>{formatVal(newVal)}</Text>
          </>
        ) : action === 'deleted' ? (
          <Text style={s.diffOld} numberOfLines={2}>{formatVal(oldVal)}</Text>
        ) : (
          <Text style={s.diffNew} numberOfLines={2}>{formatVal(newVal)}</Text>
        )}
      </View>
    </View>
  );
}

/* ── detail panel ── */
function DetailPanel({ item }: { item: any }) {
  const oldVals = item.old_values || {};
  const newVals = item.new_values || {};
  const fields = [...new Set([...Object.keys(oldVals), ...Object.keys(newVals)])];

  if (fields.length === 0) {
    return (
      <View style={s.detailPanel}>
        <Text style={{ color: colors.textHint, fontSize: 12, fontStyle: 'italic' }}>No change details recorded</Text>
      </View>
    );
  }

  const headerLabel = item.action === 'created' ? 'New Values'
    : item.action === 'deleted' ? 'Deleted Values'
    : 'Changes';

  return (
    <View style={s.detailPanel}>
      <Text style={s.detailHeader}>{headerLabel}</Text>
      {item.action === 'updated' && (
        <View style={s.diffHeaderRow}>
          <Text style={[s.diffHeaderText, { flex: 1 }]}>Field</Text>
          <Text style={[s.diffHeaderText, { flex: 1.5, textAlign: 'center' }]}>Before → After</Text>
        </View>
      )}
      {fields.map((f) => (
        <DiffRow
          key={f}
          field={f}
          oldVal={oldVals[f]}
          newVal={newVals[f]}
          action={item.action}
        />
      ))}
    </View>
  );
}

/* ── main screen ── */
export default function ActivityLogScreen() {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      const res = await api.get('/logs/activity');
      return res.data.data;
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((item: any) =>
      (item.description || '').toLowerCase().includes(q) ||
      (item.action || '').toLowerCase().includes(q) ||
      (item.model_type || '').toLowerCase().includes(q) ||
      (item.user_name || '').toLowerCase().includes(q)
    );
  }, [data, search]);

  const toggle = (id: number) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <View style={s.container}>
      <Searchbar
        placeholder="Search activity logs..."
        value={search}
        onChangeText={setSearch}
        style={s.searchbar}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item: any, index: number) => item.id?.toString() || index.toString()}
        contentContainerStyle={s.list}
        refreshing={isLoading}
        onRefresh={refetch}
        renderItem={({ item }: { item: any }) => {
          const acColor = ACTION_COLORS[item.action] || colors.textHint;
          const acIcon = ACTION_ICONS[item.action] || 'information-outline';
          const isExpanded = expandedId === item.id;
          const hasDetails = (item.old_values && Object.keys(item.old_values).length > 0) ||
                             (item.new_values && Object.keys(item.new_values).length > 0);

          return (
            <Card style={s.card} mode="outlined">
              <TouchableOpacity activeOpacity={0.7} onPress={() => toggle(item.id)}>
                <Card.Content>
                  {/* Row 1: action icon + description + action chip */}
                  <View style={s.headerRow}>
                    <MaterialCommunityIcons name={acIcon as any} size={18} color={acColor} style={{ marginRight: 6 }} />
                    <Text variant="bodyMedium" style={{ fontWeight: '600', flex: 1 }} numberOfLines={2}>
                      {item.description || item.action}
                    </Text>
                    <Chip compact style={{ backgroundColor: acColor + '20' }}
                      textStyle={{ fontSize: 10, color: acColor, fontWeight: '700' }}>
                      {item.action.toUpperCase()}
                    </Chip>
                  </View>

                  {/* Row 2: model type + user + time */}
                  <View style={s.metaRow}>
                    <MaterialCommunityIcons name="database-outline" size={13} color="#8A8FA8" />
                    <Text style={s.metaText}>{item.model_type?.split('\\').pop()} #{item.model_id}</Text>
                    <MaterialCommunityIcons name="account-outline" size={13} color="#8A8FA8" style={{ marginLeft: 10 }} />
                    <Text style={s.metaText}>{item.user?.name || item.user_name || 'System'}</Text>
                    <MaterialCommunityIcons name="clock-outline" size={13} color="#8A8FA8" style={{ marginLeft: 10 }} />
                    <Text style={s.metaText}>{item.created_at}</Text>
                  </View>

                  {/* Expand hint */}
                  {hasDetails && (
                    <View style={s.expandHint}>
                      <MaterialCommunityIcons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={colors.primary}
                      />
                      <Text style={{ fontSize: 11, color: colors.primary, marginLeft: 2 }}>
                        {isExpanded ? 'Hide details' : 'View details'}
                      </Text>
                    </View>
                  )}
                </Card.Content>
              </TouchableOpacity>

              {/* Expanded detail panel */}
              {isExpanded && hasDetails && <DetailPanel item={item} />}
            </Card>
          );
        }}
        ListEmptyComponent={
          <Text style={s.emptyText}>{t('common.noData')}</Text>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchbar: { margin: spacing.base, marginBottom: 0, borderRadius: 10, elevation: 1 },
  list: { padding: spacing.base, paddingBottom: 20 },
  card: { marginBottom: spacing.sm, borderRadius: 10, overflow: 'hidden' },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  metaText: { fontSize: 11, color: '#8A8FA8', marginLeft: 3 },
  expandHint: { flexDirection: 'row', alignItems: 'center', marginTop: 8, alignSelf: 'center' },
  emptyText: { textAlign: 'center', color: colors.textHint, marginTop: spacing.xxl },

  /* detail panel */
  detailPanel: {
    backgroundColor: '#F8F9FD',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8EAF0',
  },
  detailHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  diffHeaderRow: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E3EC',
  },
  diffHeaderText: { fontSize: 10, fontWeight: '700', color: '#8A8FA8', textTransform: 'uppercase' },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8EAF0',
  },
  diffField: { flex: 1, fontSize: 12, fontWeight: '600', color: colors.text },
  diffValues: { flex: 1.5, flexDirection: 'row', alignItems: 'center' },
  diffOld: {
    flex: 1,
    fontSize: 12,
    color: '#D32F2F',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textDecorationLine: 'line-through',
  },
  diffNew: {
    flex: 1,
    fontSize: 12,
    color: '#2E7D32',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
