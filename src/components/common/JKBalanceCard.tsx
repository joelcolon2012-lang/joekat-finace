// =====================================================================
// COMPONENTE JKBalanceCard - FINTECH GLASSMORPHISM HERO
// Encabezado JOEKAT, Balance Disponible, Comparativa % y 4 Indicadores
// =====================================================================
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '../../theme/designTokens';
import { formatCurrency } from '../../utils/currency';
import { Spacing } from '../../theme/spacing';

import { useThemeStore } from '../../store/themeStore';

interface JKBalanceCardProps {
  greeting?: string;
  periodLabel: string;
  availableBalance: number;
  totalIncome: number;
  totalExpenses: number;
  monthlySavings: number;
  savingsRate?: number;
  comparisonText?: string;
  comparisonPercentage?: number;
  isComparisonPositive?: boolean;
  onPressPeriod?: () => void;
  onPressDetails?: () => void;
}

export const JKBalanceCard: React.FC<JKBalanceCardProps> = ({
  periodLabel,
  availableBalance,
  totalIncome,
  totalExpenses,
  monthlySavings,
  savingsRate,
  comparisonText,
  comparisonPercentage = 0,
  isComparisonPositive = true,
  onPressPeriod,
}) => {
  const { isDarkMode } = useThemeStore();

  // Cálculo de tasa de ahorro si no viene provista
  const calculatedSavingsRate =
    savingsRate !== undefined
      ? savingsRate
      : totalIncome > 0
      ? Math.max(0, Math.round(((totalIncome - totalExpenses) / totalIncome) * 100))
      : 0;

  return (
    <View style={styles.outerContainer}>
      {/* Encabezado Fintech: JOEKAT y selector de mes */}
      <View style={styles.topBrandRow}>
        <View>
          <Text style={[styles.brandTitle, !isDarkMode && { color: '#071827' }]}>JOEKAT</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPressPeriod}
            style={styles.periodSelectorBtn}
          >
            <Text style={styles.periodSelectorText}>{periodLabel}</Text>
            <Ionicons name="chevron-down" size={14} color={Colors.secondaryGreen} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        <View style={styles.liveIndicatorPill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>EN VIVO</Text>
        </View>
      </View>

      {/* Tarjeta Hero Glassmorphic / Dark Navy */}
      <View
        style={[
          styles.heroCard,
          !isDarkMode && styles.heroCardLight,
          Platform.OS === 'web' ? ({
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          } as any) : null,
        ]}
      >
        {/* Balance Disponible */}
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>BALANCE DISPONIBLE</Text>
          <Text style={styles.balanceAmount}>
            {formatCurrency(availableBalance, 'DOP')}
          </Text>
        </View>

        {/* Comparativa Porcentual vs Mes Anterior */}
        <View style={styles.comparisonRow}>
          <View style={[styles.comparisonPill, isComparisonPositive ? styles.pillPositive : styles.pillNeutral]}>
            <Ionicons
              name={isComparisonPositive ? 'arrow-up' : 'arrow-down'}
              size={12}
              color={isComparisonPositive ? Colors.secondaryGreen : '#F87171'}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.comparisonText,
                { color: isComparisonPositive ? Colors.secondaryGreen : '#F87171' },
              ]}
            >
              {comparisonPercentage > 0 ? `${comparisonPercentage}%` : '0%'} vs. mes anterior
            </Text>
          </View>
          {comparisonText ? (
            <Text style={styles.comparisonSubtext} numberOfLines={1}>
              {comparisonText}
            </Text>
          ) : null}
        </View>

        {/* Cuatro Indicadores Clave en Grid 2x2 */}
        <View style={styles.indicatorsGrid}>
          {/* 1. Ingresos */}
          <View style={styles.indicatorCard}>
            <View style={styles.indicatorHeader}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(20, 184, 166, 0.18)' }]}>
                <Ionicons name="arrow-down-outline" size={14} color={Colors.secondaryGreen} />
              </View>
              <Text style={styles.indicatorLabel}>Ingresos</Text>
            </View>
            <Text style={[styles.indicatorValue, { color: Colors.secondaryGreen }]} numberOfLines={1}>
              {formatCurrency(totalIncome, 'DOP')}
            </Text>
          </View>

          {/* 2. Gastos */}
          <View style={styles.indicatorCard}>
            <View style={styles.indicatorHeader}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(248, 113, 113, 0.18)' }]}>
                <Ionicons name="arrow-up-outline" size={14} color="#F87171" />
              </View>
              <Text style={styles.indicatorLabel}>Gastos</Text>
            </View>
            <Text style={[styles.indicatorValue, { color: '#F87171' }]} numberOfLines={1}>
              {formatCurrency(totalExpenses, 'DOP')}
            </Text>
          </View>

          {/* 3. Ahorro */}
          <View style={styles.indicatorCard}>
            <View style={styles.indicatorHeader}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.18)' }]}>
                <Ionicons name="wallet-outline" size={14} color="#10B981" />
              </View>
              <Text style={styles.indicatorLabel}>Ahorro</Text>
            </View>
            <Text style={[styles.indicatorValue, { color: Colors.ivoryWhite }]} numberOfLines={1}>
              {formatCurrency(monthlySavings, 'DOP')}
            </Text>
          </View>

          {/* 4. Tasa de Ahorro */}
          <View style={styles.indicatorCard}>
            <View style={styles.indicatorHeader}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(15, 118, 110, 0.3)' }]}>
                <Ionicons name="trending-up-outline" size={14} color={Colors.secondaryGreen} />
              </View>
              <Text style={styles.indicatorLabel}>Tasa Ahorro</Text>
            </View>
            <Text style={[styles.indicatorValue, { color: Colors.secondaryGreen }]} numberOfLines={1}>
              {calculatedSavingsRate}%
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  topBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.ivoryWhite,
    letterSpacing: -0.5,
  },
  periodSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  periodSelectorText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondaryGreen,
    letterSpacing: 0.2,
  },
  liveIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 184, 166, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryGreen,
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryGreen,
    letterSpacing: 0.8,
  },
  heroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 6,
  },
  heroCardLight: {
    backgroundColor: '#071827',
    borderColor: 'rgba(20, 184, 166, 0.25)',
    shadowColor: '#0F766E',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 6,
  },
  balanceHeader: {
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.ivoryTranslucent,
    letterSpacing: 1.2,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.ivoryWhite,
    letterSpacing: -0.8,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  comparisonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  pillPositive: {
    backgroundColor: 'rgba(20, 184, 166, 0.15)',
  },
  pillNeutral: {
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
  },
  comparisonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  comparisonSubtext: {
    fontSize: 11,
    color: Colors.ivoryMuted,
    fontWeight: '500',
  },
  indicatorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  indicatorCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  indicatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  indicatorLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.ivoryTranslucent,
    letterSpacing: 0.2,
  },
  indicatorValue: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
