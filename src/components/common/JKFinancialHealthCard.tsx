// Componente JKFinancialHealthCard para el indicador de salud financiera familiar
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FinancialHealthResult } from '../../types';
import { useThemeStore } from '../../store/themeStore';
import { BrandColors } from '../../theme/colors';
import { BorderRadius, Spacing } from '../../theme/spacing';
import { JKProgressBar } from './JKProgressBar';

interface JKFinancialHealthCardProps {
  health: FinancialHealthResult;
  onPressDetails?: () => void;
}

export const JKFinancialHealthCard: React.FC<JKFinancialHealthCardProps> = ({
  health,
  onPressDetails,
}) => {
  const { theme, isDarkMode } = useThemeStore();

  const getRatingColor = () => {
    switch (health.rating) {
      case 'EXCELENTE':
      case 'MUY BUENA':
        return BrandColors.success;
      case 'BUENA':
        return BrandColors.deepBlue;
      case 'REGULAR':
        return BrandColors.warning;
      case 'ATENCIÓN':
      default:
        return BrandColors.danger;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPressDetails}
      style={[
        styles.container,
        {
          backgroundColor: theme.surfaceCard,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View style={[styles.iconCircle, { backgroundColor: `${BrandColors.deepBlue}15` }]}>
            <Ionicons name="pulse" size={18} color={BrandColors.deepBlue} />
          </View>
          <View>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Salud Financiera</Text>
            <Text style={[styles.ratingLabel, { color: getRatingColor() }]}>{health.rating}</Text>
          </View>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreNumber, { color: getRatingColor() }]}>{health.score}</Text>
          <Text style={[styles.scoreTotal, { color: theme.textMuted }]}>/100</Text>
        </View>
      </View>

      <Text style={[styles.summaryText, { color: theme.textSecondary }]}>{health.summary}</Text>

      {/* Factores que influyen */}
      <View style={styles.factorsList}>
        {health.factors.map((factor, index) => (
          <View key={index} style={styles.factorItem}>
            <View style={styles.factorHeader}>
              <Text style={[styles.factorLabel, { color: theme.textPrimary }]}>
                {factor.label}
              </Text>
              <Text style={[styles.factorScore, { color: theme.textMuted }]}>
                {factor.score}%
              </Text>
            </View>
            <JKProgressBar
              progress={factor.score}
              height={5}
              autoColor={false}
              color={
                factor.status === 'good'
                  ? BrandColors.success
                  : factor.status === 'warning'
                  ? BrandColors.warning
                  : BrandColors.danger
              }
            />
            <Text style={[styles.factorNote, { color: theme.textMuted }]}>{factor.note}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    marginVertical: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  ratingLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: '800',
  },
  scoreTotal: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  factorsList: {
    marginTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: Spacing.sm,
  },
  factorItem: {
    marginBottom: Spacing.sm,
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  factorLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  factorScore: {
    fontSize: 11,
    fontWeight: '600',
  },
  factorNote: {
    fontSize: 11,
    marginTop: 3,
  },
});
