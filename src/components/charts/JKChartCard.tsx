// Componente JKChartCard para agrupar gráficos con título, subtítulo e insight automatizado
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { BrandColors } from '../../theme/colors';
import { BorderRadius, Spacing } from '../../theme/spacing';

interface JKChartCardProps {
  title: string;
  subtitle?: string;
  insight?: string;
  children: React.ReactNode;
}

export const JKChartCard: React.FC<JKChartCardProps> = ({
  title,
  subtitle,
  insight,
  children,
}) => {
  const { theme } = useThemeStore();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surfaceCard,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
      </View>

      <View style={styles.chartArea}>{children}</View>

      {insight && (
        <View style={[styles.insightBox, { backgroundColor: theme.surfaceCardAlt }]}>
          <Ionicons name="bulb-outline" size={16} color={BrandColors.deepBlue} style={{ marginRight: 6 }} />
          <Text style={[styles.insightText, { color: theme.textPrimary }]}>{insight}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    marginVertical: Spacing.sm,
  },
  header: {
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  chartArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  insightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  insightText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
});
