// Gráfico 5: Comparativa Mes Actual vs Mes Anterior con react-native-svg
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { BrandColors, KathColors, JoelColors } from '../../theme/colors';
import { formatCurrency } from '../../utils/currency';
import { Spacing } from '../../theme/spacing';

interface MonthComparisonProps {
  currentExpenses: number;
  prevExpenses: number;
  currentIncome: number;
  prevIncome: number;
  currentMonthName?: string;
  prevMonthName?: string;
  currency?: string;
  palette?: 'default' | 'joel' | 'kath';
}

export const MonthOverMonthComparisonChart: React.FC<MonthComparisonProps> = ({
  currentExpenses,
  prevExpenses,
  currentIncome,
  prevIncome,
  currentMonthName = 'Mes Actual',
  prevMonthName = 'Mes Anterior',
  currency = 'DOP',
  palette = 'default',
}) => {
  const { theme } = useThemeStore();

  const isKath = palette === 'kath';
  const expenseColor = isKath ? KathColors.primary : BrandColors.deepBlue;

  const hasData =
    currentExpenses > 0 || prevExpenses > 0 || currentIncome > 0 || prevIncome > 0;

  if (!hasData) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="swap-vertical-outline" size={32} color={theme.textMuted} style={{ marginBottom: 6 }} />
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
          Aún no hay suficientes datos para generar este gráfico.
        </Text>
      </View>
    );
  }

  const metrics = [
    { label: 'Ingresos', curr: currentIncome, prev: prevIncome, color: BrandColors.success },
    { label: 'Gastos', curr: currentExpenses, prev: prevExpenses, color: expenseColor },
  ];

  return (
    <View style={styles.container}>
      {metrics.map((m, idx) => {
        const diff = m.curr - m.prev;
        const percent = m.prev > 0 ? Math.round(Math.abs(diff / m.prev) * 100) : 0;
        const isUp = diff > 0;

        return (
          <View key={idx} style={styles.metricBlock}>
            <View style={styles.metricHeader}>
              <Text style={[styles.metricLabel, { color: theme.textPrimary }]}>{m.label}</Text>
              {m.prev > 0 ? (
                <Text
                  style={[
                    styles.metricDiff,
                    {
                      color:
                        m.label === 'Gastos'
                          ? isUp
                            ? BrandColors.danger
                            : BrandColors.success
                          : isUp
                          ? BrandColors.success
                          : BrandColors.danger,
                    },
                  ]}
                >
                  {isUp ? '▲ +' : '▼ -'}
                  {percent}%
                </Text>
              ) : (
                <Text style={[styles.metricDiff, { color: theme.textMuted }]}>
                  Primer registro
                </Text>
              )}
            </View>

            <View style={styles.barsRow}>
              {/* Barra Mes Anterior */}
              <View style={styles.barItem}>
                <Text style={[styles.monthLabel, { color: theme.textMuted }]}>{prevMonthName}</Text>
                <View style={[styles.barTrack, { backgroundColor: theme.surfaceCardAlt }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        backgroundColor: isKath ? KathColors.soft : BrandColors.slateBlue,
                        width: `${Math.min(100, Math.max(10, (m.prev / Math.max(m.curr, m.prev, 1)) * 100))}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barAmount, { color: theme.textSecondary }]}>
                  {formatCurrency(m.prev, currency)}
                </Text>
              </View>

              {/* Barra Mes Actual */}
              <View style={styles.barItem}>
                <Text style={[styles.monthLabel, { color: theme.textPrimary, fontWeight: '700' }]}>
                  {currentMonthName}
                </Text>
                <View style={[styles.barTrack, { backgroundColor: theme.surfaceCardAlt }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        backgroundColor: m.color,
                        width: `${Math.min(100, Math.max(10, (m.curr / Math.max(m.curr, m.prev, 1)) * 100))}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barAmount, { color: theme.textPrimary, fontWeight: '700' }]}>
                  {formatCurrency(m.curr, currency)}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  metricBlock: {
    marginBottom: Spacing.md,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  metricDiff: {
    fontSize: 12,
    fontWeight: '700',
  },
  barsRow: {
    gap: 6,
  },
  barItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthLabel: {
    fontSize: 12,
    width: 30,
  },
  barTrack: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  barAmount: {
    fontSize: 11,
    width: 95,
    textAlign: 'right',
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
