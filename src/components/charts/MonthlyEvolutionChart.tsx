// Gráfico 2: Evolución financiera mensual con react-native-svg
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { BrandColors, KathColors, JoelColors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';

export interface MonthlyDataPoint {
  month: string; // 'Ene', 'Feb', 'Mar', ...
  income: number;
  expenses: number;
}

interface MonthlyEvolutionChartProps {
  data?: MonthlyDataPoint[];
  palette?: 'default' | 'joel' | 'kath';
}

export const MonthlyEvolutionChart: React.FC<MonthlyEvolutionChartProps> = ({
  data = [],
  palette = 'default',
}) => {
  const { theme } = useThemeStore();

  const isKath = palette === 'kath';
  const expenseColor = isKath ? KathColors.primary : BrandColors.deepBlue;

  const hasData = data.length > 1 && data.some((d) => d.income > 0 || d.expenses > 0);

  if (!hasData) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="trending-up-outline" size={32} color={theme.textMuted} style={{ marginBottom: 6 }} />
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
          Aún no hay suficientes datos para generar este gráfico.
        </Text>
      </View>
    );
  }

  const width = 310;
  const height = 160;
  const paddingX = 35;
  const paddingBottom = 25;
  const paddingTop = 15;

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.income, d.expenses)),
    1
  );

  const stepX = (width - paddingX * 2) / Math.max(data.length - 1, 1);
  const plotHeight = height - paddingBottom - paddingTop;

  const getY = (val: number) => {
    return paddingTop + plotHeight - (val / maxVal) * plotHeight;
  };

  // Construir caminos de línea
  let incomePath = '';
  let expensePath = '';

  data.forEach((d, i) => {
    const x = paddingX + i * stepX;
    const yInc = getY(d.income);
    const yExp = getY(d.expenses);

    if (i === 0) {
      incomePath += `M ${x} ${yInc}`;
      expensePath += `M ${x} ${yExp}`;
    } else {
      incomePath += ` L ${x} ${yInc}`;
      expensePath += ` L ${x} ${yExp}`;
    }
  });

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {/* Línea horizontal de referencia */}
        <Line
          x1={paddingX}
          y1={height - paddingBottom}
          x2={width - paddingX}
          y2={height - paddingBottom}
          stroke={theme.border}
          strokeWidth="1"
        />

        {/* Líneas de tendencia */}
        <Path d={incomePath} fill="none" stroke={BrandColors.success} strokeWidth="3" />
        <Path d={expensePath} fill="none" stroke={expenseColor} strokeWidth="3" />

        {/* Puntos y etiquetas */}
        {data.map((d, i) => {
          const x = paddingX + i * stepX;
          const yInc = getY(d.income);
          const yExp = getY(d.expenses);

          return (
            <React.Fragment key={i}>
              <Circle cx={x} cy={yInc} r="4" fill={BrandColors.success} stroke="#FFFFFF" strokeWidth="2" />
              <Circle cx={x} cy={yExp} r="4" fill={expenseColor} stroke="#FFFFFF" strokeWidth="2" />
              <SvgText
                x={x}
                y={height - 6}
                fontSize="11"
                fontWeight="600"
                fill={theme.textMuted}
                textAnchor="middle"
              >
                {d.month}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: BrandColors.success }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>Ingresos</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: expenseColor }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>Gastos</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
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
