import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import {
  ParkingStatus,
  RootStackParamList,
  STATUS_TRANSITIONS,
  isFinalState,
} from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { useParkingRequest } from '../hooks/useParkingRequests';
import { colors, spacing, radius, typography, shadows } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'RequestDetail'>;
  route: RouteProp<RootStackParamList, 'RequestDetail'>;
};

const STATUS_ACTION_LABELS: Partial<Record<ParkingStatus, string>> = {
  approved: '✅ Approve',
  rejected: '❌ Reject',
  checked_in: '🔑 Check In',
  checked_out: '🏁 Check Out',
};

const TRUCK_ICONS: Record<string, string> = {
  solo: '🚚',
  semi: '🚛',
  tanker: '⛽',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={[infoStyles.value, mono && infoStyles.mono]}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  label: {
    ...typography.captionMd,
    color: colors.textSecondary,
    flex: 1,
  },
  value: {
    ...typography.bodyMd,
    color: colors.text,
    flex: 2,
    textAlign: 'right',
  },
  mono: {
    fontFamily: 'monospace',
  },
});

export function RequestDetailScreen({ navigation, route }: Props) {
  const { requestId } = route.params;
  const { request, loading, updating, error, load, updateStatus } = useParkingRequest(requestId);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ParkingStatus | null>(null);
  const [spotId, setSpotId] = useState('');

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (request) {
      navigation.setOptions({ title: request.driverName });
    }
  }, [request, navigation]);

  const availableTransitions = request
    ? STATUS_TRANSITIONS[request.status]
    : [];

  const handleStatusPress = (status: ParkingStatus) => {
    setSelectedStatus(status);
    setSpotId('');
    setShowUpdateModal(true);
  };

  const handleConfirm = async () => {
    if (!selectedStatus) return;

    const success = await updateStatus({
      status: selectedStatus,
      parkingSpotId: spotId.trim() || undefined,
    });

    if (success) {
      setShowUpdateModal(false);
      setSelectedStatus(null);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !request) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error ?? 'Request not found'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Detail view ────────────────────────────────────────────────────────────

  const icon = TRUCK_ICONS[request.truckType] ?? '🚛';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero card ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroIconText}>{icon}</Text>
          </View>
          <Text style={styles.heroName}>{request.driverName}</Text>
          <Text style={styles.heroPlate}>{request.licensePlate}</Text>
          <StatusBadge status={request.status} size="md" />
        </View>

        {/* ── Details ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.card}>
            <InfoRow label="Truck Type" value={`${icon} ${request.truckType}`} />
            <InfoRow label="Check-in" value={formatDateTime(request.requestedFrom)} />
            <InfoRow label="Check-out" value={formatDateTime(request.requestedUntil)} />
            {request.parkingSpotId && (
              <InfoRow label="Parking Spot" value={request.parkingSpotId} mono />
            )}
            <InfoRow label="Request ID" value={request.id} mono />
          </View>
        </View>

        {/* ── Timestamps ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.card}>
            <InfoRow label="Created" value={formatDateTime(request.createdAt)} />
            <InfoRow label="Last Updated" value={formatDateTime(request.updatedAt)} />
          </View>
        </View>

        {/* ── Status Actions ── */}
        {!isFinalState(request.status) && availableTransitions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Update Status</Text>
            <View style={styles.actionsRow}>
              {availableTransitions.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.actionBtn,
                    status === 'rejected' && styles.actionBtnDanger,
                  ]}
                  onPress={() => handleStatusPress(status)}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.actionBtnText}>
                      {STATUS_ACTION_LABELS[status] ?? status}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {isFinalState(request.status) && (
          <View style={styles.finalStateBanner}>
            <Text style={styles.finalStateText}>
              🔒 This request is in a final state and cannot be modified.
            </Text>
          </View>
        )}

      </ScrollView>

      {/* ── Status Update Modal ── */}
      <Modal
        visible={showUpdateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUpdateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {selectedStatus ? STATUS_ACTION_LABELS[selectedStatus] ?? selectedStatus : ''}
            </Text>
            <Text style={styles.modalSub}>
              Update status for <Text style={styles.bold}>{request.driverName}</Text>
            </Text>

            {selectedStatus === 'approved' && (
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Parking Spot ID (optional)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={spotId}
                  onChangeText={setSpotId}
                  placeholder="e.g. SPOT-A3"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                />
              </View>
            )}

            {error && (
              <View style={styles.modalError}>
                <Text style={styles.modalErrorText}>{error}</Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowUpdateModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  selectedStatus === 'rejected' && styles.confirmBtnDanger,
                  updating && styles.confirmBtnDisabled,
                ]}
                onPress={handleConfirm}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  heroIconText: { fontSize: 36 },
  heroName: {
    ...typography.h2,
    color: colors.text,
  },
  heroPlate: {
    ...typography.body,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textMuted,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    ...shadows.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  actionBtnDanger: {
    backgroundColor: colors.error,
  },
  actionBtnText: {
    ...typography.bodyMd,
    color: '#fff',
  },
  finalStateBanner: {
    backgroundColor: colors.borderLight,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  finalStateText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xxxl,
  },
  errorIcon: { fontSize: 44 },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: {
    ...typography.bodyMd,
    color: '#fff',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 400,
    gap: spacing.md,
    ...shadows.md,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  modalSub: {
    ...typography.body,
    color: colors.textSecondary,
  },
  bold: { fontWeight: '600', color: colors.text },
  modalField: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  modalFieldLabel: {
    ...typography.captionMd,
    color: colors.textSecondary,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.background,
  },
  modalError: {
    backgroundColor: colors.errorBg,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  modalErrorText: {
    ...typography.caption,
    color: colors.error,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelBtnText: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  confirmBtnDanger: {
    backgroundColor: colors.error,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    ...typography.bodyMd,
    color: '#fff',
  },
});
