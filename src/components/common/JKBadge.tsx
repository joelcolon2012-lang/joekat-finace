// Componente JKBadge para estados de presupuesto, pagos y metas
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { BrandColors } from '../../theme/colors';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface JKBadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export const JKBadge: React.FC<JKBadgeProps> = ({ label, variant = 'neutral', style }) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: BrandColors.successLight, text: '#065F46', dot: BrandColors.success };
      case 'warning':
        return { bg: BrandColors.warningLight, text: '#92400E', dot: BrandColors.warning };
      case 'danger':
        return { bg: BrandColors.dangerLight, text: '#991B1B', dot: BrandColors.danger };
      case 'info':
        return { bg: '#E0F2FE', text: BrandColors.deepBlue, dot: BrandColors.skyBlue };
      case 'neutral':
      default:
        return { bg: '#F1F5F9', text: BrandColors.nightBlue, dot: BrandColors.slateBlue };
    }
  };

  const colors = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <View style={[styles.dot, { backgroundColor: colors.dot }]} />
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
