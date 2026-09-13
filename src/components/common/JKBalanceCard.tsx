// Componente JKBalanceCard para el hero principal del Dashboard
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { BrandColors } from '../../theme/colors';
import { formatCurrency } from '../../utils/currency';
import { BorderRadius, Spacing } from '../../theme/spacing';

interface JKBalanceCardProps {
  greeting: string;
  periodLabel: string;
  availableBalance: number;
  totalIncome: number;
  totalExpenses: number;
  monthlySavings: number;
  comparisonText: string;
  isComparisonPositive: boolean;
  onPressDetails?: () => void;
}

export const JKBalanceCard: React.FC<JKBalanceCardProps> = ({
  greeting,
  periodLabel,
  availableBalance,
  totalIncome,
  totalExpenses,
  monthlySavings,
  comparisonText,
  isComparisonPositive,
  onPressDetails,
}) => {
  const { currency, isDarkMode } = useThemeStore();

  return (
    <View style={styles.outerContainer}>
      {/* Tarjeta Principal Hero Azul Noche Profundo */}
      <View style={styles.heroCard}>
        {/* Encabezado: Saludo y Periodo */}
        <View style={styles.headerRow}>
          <Text style={styles.greetingText}>{greeting}</Text>
          <View style={styles.periodPill}>
            <Text style={styles.periodText}>{periodLabel}</Text>
          </View>
        </View>

        {/* Balance Disponible */}
        <View style={styles.balanceBlock}>
          <Text style={styles.balanceLabel}>BALANCE DISPONIBLE</Text>
          <Text style={styles.balanceAmount}>
            {formatCurrency(availableBalance, currency)}
          </Text>
        </View>

        {/* Comparativa Mensual Asistida */}
        {comparisonText ? (
          <View style={styles.comparisonBadge}>
            <Ionicons
              name={isComparisonPositive ? 'trending-down-outline' : 'trending-up-outline'}
              size={15}
              color={BrandColors.skyBlue}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.comparisonText}>{comparisonText}</Text>
          </View>
        ) : null}

        {/* 3 Tarjetas: Ingresos, Gastos, Ahorro */}
        <View style={styles.triCardsGrid}>
          {/* Ingresos */}
          <View style={styles.miniCard}>
            <View style={styles.miniCardHeader}>
              <View style={[styles.miniDot, { backgroundColor: BrandColors.success }]} />
              <Text style={styles.miniCardLabel}>INGRESOS</Text>
            </View>
            <Text style={styles.miniCardValue} numberOfLines={1}>
              {formatCurrency(totalIncome, currency)}
            </Text>
          </View>

          {/* Gastos */}
          <View style={styles.miniCard}>
            <View style={styles.miniCardHeader}>
              <View style={[styles.miniDot, { backgroundColor: '#F87171' }]} />
              <Text style={styles.miniCardLabel}>GASTOS</Text>
            </View>
            <Text style={styles.miniCardValue} numberOfLines={1}>
              {formatCurrency(totalExpenses, currency)}
            </Text>
          </View>

          {/* Ahorro */}
          <View style={[styles.miniCard, styles.miniCardAhorro]}>
            <View style={styles.miniCardHeader}>
              <View style={[styles.miniDot, { backgroundColor: BrandColors.skyBlue }]} />
              <Text style={styles.miniCardLabel}>AHORRO</Text>
            </View>
            <Text style={[styles.miniCardValue, { color: BrandColors.skyBlue }]} numberOfLines={1}>
              {formatCurrency(monthlySavings, currency)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  heroCard: {
    backgroundColor: BrandColors.nightBlue,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: '#001D39',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  greetingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  periodPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  periodText: {
    color: BrandColors.skyBlue,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  balanceBlock: {
    marginBottom: Spacing.md,
  },
  balanceLabel: {
    color: BrandColors.slateBlue,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  comparisonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 65, 116, 0.55)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  comparisonText: {
    color: '#E0F2FE',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  triCardsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  miniCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: BorderRadius.md,
    padding: 10,
  },
  miniCardAhorro: {
    backgroundColor: 'rgba(123, 189, 232, 0.12)',
  },
  miniCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  miniCardLabel: {
    color: BrandColors.slateBlue,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  miniCardValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
