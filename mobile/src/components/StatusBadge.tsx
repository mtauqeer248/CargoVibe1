import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ParkingStatus } from '../types';
import { colors, radius, typography } from '../theme';

const STATUS_LABELS: Record<ParkingStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  checked_in: 'Checked In',
  checked_out: 'Checked Out',
};

const STATUS_STYLES: Record<ParkingStatus, { bg: string; text: string }> = {
  pending:     { bg: colors.pendingBg,     text: colors.pending     },
  approved:    { bg: colors.approvedBg,    text: colors.approved    },
  rejected:    { bg: colors.rejectedBg,    text: colors.rejected    },
  checked_in:  { bg: colors.checked_inBg,  text: colors.checked_in  },
  checked_out: { bg: colors.checked_outBg, text: colors.checked_out },
};

interface Props {
  status: ParkingStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const style = STATUS_STYLES[status];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: style.bg },
        isSmall && styles.small,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: style.text }]} />
      <Text
        style={[
          styles.label,
          { color: style.text },
          isSmall && styles.labelSmall,
        ]}
      >
        {STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    ...typography.captionMd,
  },
  labelSmall: {
    fontSize: 11,
  },
});
