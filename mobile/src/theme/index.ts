export const colors = {
  // Brand
  primary: '#1A56DB',
  primaryDark: '#1245B0',
  primaryLight: '#E8F0FE',

  // Status colors
  pending: '#F59E0B',
  pendingBg: '#FEF3C7',
  approved: '#10B981',
  approvedBg: '#D1FAE5',
  rejected: '#EF4444',
  rejectedBg: '#FEE2E2',
  checked_in: '#3B82F6',
  checked_inBg: '#DBEAFE',
  checked_out: '#6B7280',
  checked_outBg: '#F3F4F6',

  // Neutrals
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',

  // Feedback
  error: '#EF4444',
  errorBg: '#FEF2F2',
  success: '#10B981',
  successBg: '#ECFDF5',

  // AI accent
  ai: '#7C3AED',
  aiBg: '#F5F3FF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyMd: { fontSize: 15, fontWeight: '500' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  captionMd: { fontSize: 13, fontWeight: '500' as const },
  label: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5 },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
};
