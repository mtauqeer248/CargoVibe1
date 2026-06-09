import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParkingRequest, ParkingStatus, RootStackParamList } from '../types';
import { ParkingRequestCard } from '../components/ParkingRequestCard';
import { AiChatPanel } from '../components/AiChatPanel';
import { useParkingRequests } from '../hooks/useParkingRequests';
import { colors, spacing, radius, typography, shadows } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'RequestList'>;
};

const FILTER_TABS: { label: string; value: ParkingStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Active', value: 'checked_in' },
  { label: 'Done', value: 'checked_out' },
];

const STATUS_COLORS: Record<string, string> = {
  all: colors.primary,
  pending: colors.pending,
  approved: colors.approved,
  checked_in: colors.checked_in,
  checked_out: colors.checked_out,
};

export function RequestListScreen({ navigation }: Props) {
  const { requests, loading, error, refresh } = useParkingRequests();
  const [activeFilter, setActiveFilter] = useState<ParkingStatus | 'all'>('all');
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = activeFilter === 'all'
    ? requests
    : requests.filter((r) => r.status === activeFilter);

  const counts = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const renderItem = useCallback(({ item }: { item: ParkingRequest }) => (
    <ParkingRequestCard
      request={item}
      onPress={() => navigation.navigate('RequestDetail', { requestId: item.id })}
    />
  ), [navigation]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🚚 CargoVibe</Text>
          <Text style={styles.headerSub}>
            {requests.length} request{requests.length !== 1 ? 's' : ''}
            {counts.pending ? ` · ${counts.pending} pending` : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.aiBtn}
          onPress={() => setShowAI(true)}
        >
          <Text style={styles.aiBtnIcon}>✦</Text>
          <Text style={styles.aiBtnLabel}>AI</Text>
        </TouchableOpacity>
      </View>

      {/* ── Filter Tabs ── */}
      <View style={styles.tabsWrapper}>
        <FlatList
          horizontal
          data={FILTER_TABS}
          keyExtractor={(t) => t.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
          renderItem={({ item: tab }) => {
            const isActive = activeFilter === tab.value;
            const count = tab.value === 'all' ? requests.length : (counts[tab.value] ?? 0);
            return (
              <TouchableOpacity
                style={[
                  styles.tab,
                  isActive && { backgroundColor: STATUS_COLORS[tab.value] },
                ]}
                onPress={() => setActiveFilter(tab.value)}
              >
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View style={[
                    styles.tabCount,
                    isActive ? styles.tabCountActive : {},
                  ]}>
                    <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* ── List ── */}
      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />
          }
          contentContainerStyle={filtered.length === 0 ? styles.empty : styles.listContent}
          ListEmptyComponent={
            loading ? null : (
              <View style={styles.center}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>No requests</Text>
                <Text style={styles.emptyBody}>
                  {activeFilter === 'all'
                    ? 'No parking requests yet.'
                    : `No ${activeFilter.replace('_', ' ')} requests.`}
                </Text>
              </View>
            )
          }
        />
      )}

      {/* ── AI Chat Modal ── */}
      <Modal
        visible={showAI}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAI(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAI(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <AiChatPanel />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'android' ? spacing.lg : spacing.sm,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
  },
  headerSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.aiBg,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.ai + '40',
  },
  aiBtnIcon: {
    color: colors.ai,
    fontSize: 14,
  },
  aiBtnLabel: {
    ...typography.captionMd,
    color: colors.ai,
  },
  tabsWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabs: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 1,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabLabel: {
    ...typography.captionMd,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: '#fff',
  },
  tabCount: {
    backgroundColor: colors.borderLight,
    borderRadius: radius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabCountActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabCountText: {
    ...typography.label,
    color: colors.textSecondary,
    fontSize: 10,
  },
  tabCountTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingVertical: spacing.md,
  },
  empty: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xxxl,
  },
  errorIcon: { fontSize: 36 },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: {
    ...typography.bodyMd,
    color: '#fff',
  },
  emptyIcon: { fontSize: 44 },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
  },
  emptyBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalSafe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
