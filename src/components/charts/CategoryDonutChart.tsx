// Gráfico 3: Distribución de gastos por categoría en forma de Donut con react-native-svg
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { formatCurrency } from '../../utils/currency';
import { Spacing } from '../../theme/spacing';

interface CategoryShare {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

interface CategoryDonutChartProps {
  categories: CategoryShare[];
  currency?: string;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  categories,
  currency = 'DOP',
}) => {
  const { theme } = useThemeStore();

  const radius = 60;
  const strokeWidth = 24;
  const size = (radius + strokeWidth) * 2;
  const circumference = 2 * Math.PI * radius;

  const total = categories.reduce((sum, c) => sum + c.amount, 0);

  let cumulativePercent = 0;

  if (categories.length === 0 || total === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="pie-chart-outline" size={32} color={theme.textMuted} style={{ marginBottom: 6 }} />
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
          Aún no hay suficientes datos para generar este gráfico.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Gráfico Donut */}
      <View style={styles.chartWrapper}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            {categories.map((cat, i) => {
              const strokeDashoffset = circumference - (circumference * cat.percentage) / 100;
              const angle = (cumulativePercent * 360) / 100;
              cumulativePercent += cat.percentage;

              return (
                <Circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={cat.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  rotation={angle}
                  origin={`${size / 2}, ${size / 2}`}
                  fill="none"
                />
              );
            })}
          </G>
        </Svg>
        <View style={styles.centerTextContainer}>
          <Text style={[styles.centerSub, { color: theme.textMuted }]}>Total Gastado</Text>
          <Text style={[styles.centerVal, { color: theme.textPrimary }]} numberOfLines={1}>
            {formatCurrency(total, currency)}
          </Text>
        </View>
      </View>

      {/* Lista de Categorías con porcentaje */}
      <View style={styles.categoriesList}>
        {categories.slice(0, 6).map((cat, idx) => (
          <View key={idx} style={styles.catItemRow}>
            <View style={styles.catNameRow}>
              <View style={[styles.catColorDot, { backgroundColor: cat.color }]} />
              <Text style={[styles.catName, { color: theme.textPrimary }]}>{cat.name}</Text>
            </View>
            <View style={styles.catValuesRow}>
              <Text style={[styles.catAmount, { color: theme.textSecondary }]}>
                {formatCurrency(cat.amount, currency)}
              </Text>
              <Text style={[styles.catPercent, { color: theme.textPrimary }]}>
                {cat.percentage}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xs,
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
  },
  centerSub: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  centerVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  categoriesList: {
    width: '100%',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  catItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  catNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
  },
  catValuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catAmount: {
    fontSize: 12,
    marginRight: 8,
  },
  catPercent: {
    fontSize: 13,
    fontWeight: '700',
    width: 32,
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
