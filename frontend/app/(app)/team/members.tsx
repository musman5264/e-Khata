import React from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, Button, Chip, IconButton, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

export default function TeamMembersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const res = await api.get('/team/members');
      return res.data.data;
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: number) => api.delete(`/team/members/${userId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-members'] }),
  });

  const handleRemove = (userId: number, name: string) => {
    Alert.alert(t('common.confirm'), `${t('team.removeConfirm')} ${name}?`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => removeMutation.mutate(userId) },
    ]);
  };

  const roleColor = (role: string) => {
    switch (role) {
      case 'owner': return '#1A237E';
      case 'manager': return '#00897B';
      case 'accountant': return '#FF9800';
      case 'viewer': return '#9E9E9E';
      default: return colors.textHint;
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item: any) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={refetch}
        renderItem={({ item }: { item: any }) => (
          <Card style={styles.card} mode="outlined">
            <Card.Content style={styles.cardContent}>
              <View style={{ flex: 1 }}>
                <Text variant="titleSmall" style={{ fontWeight: '600' }}>{item.name}</Text>
                <Text variant="bodySmall" style={{ color: colors.textSecondary }}>{item.mobile}</Text>
                <Chip
                  compact
                  style={[styles.roleChip, { backgroundColor: roleColor(item.role) + '20' }]}
                  textStyle={{ fontSize: 10, color: roleColor(item.role) }}
                >
                  {item.role}
                </Chip>
              </View>
              {item.role !== 'owner' && (
                <IconButton icon="close" size={18} onPress={() => handleRemove(item.id, item.name)} />
              )}
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('common.noData')}</Text>
        }
      />

      <Button
        mode="contained"
        icon="account-plus"
        style={styles.inviteBtn}
        buttonColor={colors.primary}
        onPress={() => router.push('/(app)/team/invite')}
      >
        {t('team.invite')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.base, paddingBottom: 80 },
  card: { marginBottom: spacing.sm, borderRadius: 10 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  roleChip: { marginTop: 4, alignSelf: 'flex-start', borderRadius: 8 },
  emptyText: { textAlign: 'center', color: colors.textHint, marginTop: spacing.xxl },
  inviteBtn: {
    position: 'absolute', bottom: spacing.base, left: spacing.base, right: spacing.base,
    borderRadius: 8,
  },
});
