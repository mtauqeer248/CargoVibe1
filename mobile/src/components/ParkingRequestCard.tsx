import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ParkingRequest } from '../types';
import { StatusBadge } from './StatusBadge';
import { colors, spacing, radius, typography, shadows } from '../theme';

const TRUCK_ICONS: Record<string, string> = {
  solo: '🚚',
  semi: '🚛',
  tanker: '⛽',
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface Props {
  request: ParkingRequest;
  onPress: () => void;
}

export function ParkingRequestCard({ request, onPress }: Props) {
  const icon = TRUCK_ICONS[request.truckType] ?? '🚛';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.driverName} numberOfLines={1}>
            {request.driverName}
          </Text>
          <Text style={styles.plate}>{request.licensePlate}</Text>
        </View>
        <StatusBadge status={request.status} size="sm" />
      </View>

      <View style={styles.divider} />

      <View style={styles.timeRow}>
        <View style={styles.timeItem}>
          <Text style={styles.timeLabel}>CHECK-IN</Text>
          <Text style={styles.timeValue}>{formatDateTime(request.requestedFrom)}</Text>
        </View>
        <View style={styles.timeSep}>
          <Text style={styles.timeSepIcon}>→</Text>
        </View>
        <View style={[styles.timeItem, styles.timeItemRight]}>
          <Text style={styles.timeLabel}>CHECK-OUT</Text>
          <Text style={styles.timeValue}>{formatDateTime(request.requestedUntil)}</Text>
        </View>
      </View>

      {request.parkingSpotId && (
        <View style={styles.spotRow}>
          <Text style={styles.spotLabel}>📍 Spot</Text>
          <Text style={styles.spotValue}>{request.parkingSpotId}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  driverName: {
    ...typography.bodyMd,
    color: colors.text,
  },
  plate: {
    ...typography.caption,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeItem: {
    flex: 1,
    gap: 2,
  },
  timeItemRight: {
    alignItems: 'flex-end',
  },
  timeSep: {
    paddingHorizontal: spacing.sm,
  },
  timeSepIcon: {
    color: colors.textMuted,
    fontSize: 14,
  },
  timeLabel: {
    ...typography.label,
    color: colors.textMuted,
  },
  timeValue: {
    ...typography.captionMd,
    color: colors.text,
  },
  spotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  spotLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  spotValue: {
    ...typography.captionMd,
    color: colors.primary,
  },
});
