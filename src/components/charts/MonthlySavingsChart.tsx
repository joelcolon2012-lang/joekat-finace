// Gráfico 4: Ahorro mensual con react-native-svg
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { BrandColors, KathColors, JoelColors } from '../../theme/colors';
import { formatCurrency } from '../../utils/currency';
import { Spacing } from '../../theme/spacing';

export interface MonthlySavingPoint {
  month: string;
  savings: number;
}

interface MonthlySavingsChartProps {
  data?: MonthlySavingPoint[];
  currency?: string;
  palette?: 'default' | 'joel' | 'kath';
}

export const MonthlySavingsChart: React.FC<MonthlySavingsChartProps> = ({
  data = [],
  currency = 'DOP',
  palette = 'default',
}) => {
  const { theme } = useThemeStore();

  const isKath = palette === 'kath';
  const barColor = isKath ? KathColors.medium : BrandColors.skyBlue;

  const hasData = data.length > 0 && data.some((d) => d.savings > 0);

  if (!hasData) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="wallet-outline" size={32} color={theme.textMuted} style={{ marginBottom: 6 }} />
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
          Aún no hay suficientes datos para generar este gráfico.
        </Text>
      </View>
    );
  }

  const width = 300;
  const height = 150;
  const paddingX = 20;
  const paddingBottom = 25;

  const maxVal = Math.max(...data.map((d) => d.savings), 1);
  const barWidth = 28;
  const stepX = (width - paddingX * 2) / Math.max(data.length, 1);

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        <Line
          x1={paddingX}
          y1={height - paddingBottom}
          x2={width - paddingX}
          y2={height - paddingBottom}
          stroke={theme.border}
          strokeWidth="1"
        />

        {data.map((d, i) => {
          const barHeight = Math.max(6, (d.savings / maxVal) * (height - paddingBottom - 25));
          const x = paddingX + i * stepX + (stepX - barWidth) / 2;
          const y = height - paddingBottom - barHeight;

          return (
            <React.Fragment key={i}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="5"
                fill={barColor}
              />
              <SvgText
                x={x + barWidth / 2}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
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
