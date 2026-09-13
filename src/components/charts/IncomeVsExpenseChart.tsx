// Gráfico 1: Ingresos vs Gastos con react-native-svg
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { BrandColors, KathColors, JoelColors } from '../../theme/colors';
import { formatCurrency } from '../../utils/currency';
import { Spacing, BorderRadius } from '../../theme/spacing';

interface IncomeVsExpenseChartProps {
  income: number;
  expenses: number;
  currency?: string;
  palette?: 'default' | 'joel' | 'kath';
}

export const IncomeVsExpenseChart: React.FC<IncomeVsExpenseChartProps> = ({
  income,
  expenses,
  currency = 'DOP',
  palette = 'default',
}) => {
  const { theme } = useThemeStore();
  const balance = income - expenses;
  const isKath = palette === 'kath';
  const expenseColor = isKath ? KathColors.primary : BrandColors.nightBlue;
  const primaryAccent = isKath ? KathColors.primary : BrandColors.deepBlue;

  const hasData = income > 0 || expenses > 0;
  const maxVal = Math.max(income, expenses, 1);
  const chartHeight = 150;
  const barWidth = 46;

  const incomeHeight = income > 0 ? Math.max(12, (income / maxVal) * (chartHeight - 35)) : 0;
  const expenseHeight = expenses > 0 ? Math.max(12, (expenses / maxVal) * (chartHeight - 35)) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.balanceSummaryRow}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Ingresos</Text>
          <Text style={[styles.summaryValue, { color: BrandColors.success }]}>
            {formatCurrency(income, currency)}
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Gastos</Text>
          <Text style={[styles.summaryValue, { color: isKath ? KathColors.primary : '#EF4444' }]}>
            {formatCurrency(expenses, currency)}
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Balance</Text>
          <Text
            style={[
              styles.summaryValue,
              { color: balance >= 0 ? primaryAccent : '#EF4444' },
            ]}
          >
            {balance >= 0 ? '+' : ''}
            {formatCurrency(balance, currency)}
          </Text>
        </View>
      </View>

      {!hasData ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bar-chart-outline" size={28} color={theme.textMuted} style={{ marginBottom: 6 }} />
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            Aún no hay suficientes datos para generar este gráfico.
          </Text>
        </View>
      ) : (
        <Svg width="280" height={chartHeight} style={{ alignSelf: 'center' }}>
          {/* Línea base */}
          <Line
            x1="20"
            y1={chartHeight - 20}
            x2="260"
            y2={chartHeight - 20}
            stroke={theme.border}
            strokeWidth="1"
          />

          {/* Barra de Ingreso */}
          {incomeHeight > 0 && (
            <Rect
              x="70"
              y={chartHeight - 20 - incomeHeight}
              width={barWidth}
              height={incomeHeight}
              rx="6"
              fill={BrandColors.success}
            />
          )}
          <SvgText
            x="93"
            y={chartHeight - 4}
            fontSize="11"
            fontWeight="600"
            fill={theme.textPrimary}
            textAnchor="middle"
          >
            Ingresos
          </SvgText>

          {/* Barra de Gasto */}
          {expenseHeight > 0 && (
            <Rect
              x="164"
              y={chartHeight - 20 - expenseHeight}
              width={barWidth}
              height={expenseHeight}
              rx="6"
              fill={expenseColor}
            />
          )}
          <SvgText
            x="187"
            y={chartHeight - 4}
            fontSize="11"
            fontWeight="600"
            fill={theme.textPrimary}
            textAnchor="middle"
          >
            Gastos
          </SvgText>
        </Svg>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  balanceSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
