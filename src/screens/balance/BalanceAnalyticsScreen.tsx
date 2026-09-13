// Pantalla de Balance y Analítica Financiera para JOEKAT FINACE
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../../store/financeStore';
import { useThemeStore } from '../../store/themeStore';
import { BrandColors, KathColors, JoelColors } from '../../theme/colors';
import { JKChartCard } from '../../components/charts/JKChartCard';
import { IncomeVsExpenseChart } from '../../components/charts/IncomeVsExpenseChart';
import { MonthlyEvolutionChart, MonthlyDataPoint } from '../../components/charts/MonthlyEvolutionChart';
import { CategoryDonutChart } from '../../components/charts/CategoryDonutChart';
import { MonthlySavingsChart } from '../../components/charts/MonthlySavingsChart';
import { MonthOverMonthComparisonChart } from '../../components/charts/MonthOverMonthComparisonChart';
import { JKFinancialHealthCard } from '../../components/common/JKFinancialHealthCard';
import { calculateMonthlyTotals, calculateCategoryBreakdown, getMonthComparisonText } from '../../utils/calculations';
import { calculateFinancialHealth } from '../../utils/financialHealth';
import { formatCurrency, roundCurrency } from '../../utils/currency';
import { getTodayDateString } from '../../utils/date';
import { Spacing, BorderRadius } from '../../theme/spacing';

type PeriodType = 'SEMANA' | 'MES' | 'AÑO' | 'TODO';
type MemberScope = 'Familia' | 'Joel' | 'Kath';

export const BalanceAnalyticsScreen: React.FC = () => {
  const { transactions, categories, fixedExpenses, budgets } = useFinanceStore();
  const { theme, currency } = useThemeStore();

  const [selectedMember, setSelectedMember] = useState<MemberScope>('Familia');
  const [period, setPeriod] = useState<PeriodType>('MES');

  const activePalette: 'default' | 'joel' | 'kath' =
    selectedMember === 'Kath' ? 'kath' : selectedMember === 'Joel' ? 'joel' : 'default';

  // Filtrado de transacciones según miembro
  const memberTransactions = useMemo(() => {
    if (selectedMember === 'Joel') {
      return transactions.filter((t) => t.user_name === 'Joel');
    }
    if (selectedMember === 'Kath') {
      return transactions.filter((t) => t.user_name === 'Kath' || t.user_name === 'Kat');
    }
    return transactions;
  }, [transactions, selectedMember]);

  // Fechas dinámicas
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const currentMonthName = monthNames[now.getMonth()];
  const prevMonthName = monthNames[prevMonth - 1];

  // Transacciones filtradas por el periodo seleccionado
  const periodTransactions = useMemo(() => {
    if (period === 'TODO') return memberTransactions;

    const todayStr = getTodayDateString();
    if (period === 'SEMANA') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const limitStr = sevenDaysAgo.toISOString().slice(0, 10);
      return memberTransactions.filter((t) => t.date && t.date >= limitStr && t.date <= todayStr);
    }
    if (period === 'AÑO') {
      const yearStr = String(currentYear);
      return memberTransactions.filter((t) => t.date && t.date.startsWith(yearStr));
    }
    // 'MES' por defecto
    const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    return memberTransactions.filter((t) => t.date && t.date.startsWith(monthPrefix));
  }, [memberTransactions, period, currentMonth, currentYear]);

  // Totales para el periodo seleccionado
  const currentTotals = useMemo(() => {
    if (period === 'MES') {
      return calculateMonthlyTotals(memberTransactions, currentMonth, currentYear);
    }
    let totalIncome = 0;
    let totalExpenses = 0;
    for (const t of periodTransactions) {
      if (t.type === 'income') totalIncome += t.amount;
      else if (t.type === 'expense') totalExpenses += t.amount;
    }
    const roundedIncome = roundCurrency(totalIncome);
    const roundedExpenses = roundCurrency(totalExpenses);
    const netBalance = roundCurrency(roundedIncome - roundedExpenses);
    const monthlySavings = netBalance > 0 ? netBalance : 0;
    const savingsRate =
      roundedIncome > 0
        ? Math.min(100, Math.max(0, Math.round((netBalance / roundedIncome) * 100)))
        : 0;
    return {
      totalIncome: roundedIncome,
      totalExpenses: roundedExpenses,
      netBalance,
      monthlySavings,
      savingsRate,
    };
  }, [memberTransactions, periodTransactions, period, currentMonth, currentYear]);

  const prevTotals = useMemo(
    () => calculateMonthlyTotals(memberTransactions, prevMonth, prevYear),
    [memberTransactions, prevMonth, prevYear]
  );

  const comparison = useMemo(
    () => getMonthComparisonText(currentTotals.totalExpenses, prevTotals.totalExpenses),
    [currentTotals, prevTotals]
  );

  const categoriesMap = useMemo(() => {
    return categories.reduce((acc, c) => {
      acc[c.id] = c;
      return acc;
    }, {} as Record<string, any>);
  }, [categories]);

  // Distribución de categorías del periodo seleccionado
  const categoryShares = useMemo(() => {
    return calculateCategoryBreakdown(periodTransactions, 'expense', categoriesMap);
  }, [periodTransactions, categoriesMap]);

  // Historial dinámico para el gráfico de evolución
  const evolutionData = useMemo(() => {
    const points: MonthlyDataPoint[] = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const totals = calculateMonthlyTotals(memberTransactions, m, y);
      points.push({
        month: monthNames[d.getMonth()],
        income: totals.totalIncome,
        expenses: totals.totalExpenses,
      });
    }
    return points;
  }, [memberTransactions, currentYear, currentMonth]);

  // Historial de ahorros dinámico
  const savingsData = useMemo(() => {
    return evolutionData.map((p) => ({
      month: p.month,
      savings: Math.max(0, p.income - p.expenses),
    }));
  }, [evolutionData]);

  // Salud Financiera
  const fixedTotal = fixedExpenses.reduce((sum, f) => sum + f.amount, 0);
  const budgetsOverLimit = budgets.filter((b) => {
    const spent = memberTransactions
      .filter((t) => t.type === 'expense' && t.category_id === b.category_id)
      .reduce((sum, t) => sum + t.amount, 0);
    return spent > b.allocated_amount;
  }).length;

  const financialHealth = useMemo(
    () =>
      calculateFinancialHealth({
        totalIncome: currentTotals.totalIncome,
        totalExpenses: currentTotals.totalExpenses,
        savingsRate: currentTotals.savingsRate,
        fixedExpensesTotal: fixedTotal,
        budgetsOverLimitCount: budgetsOverLimit,
        totalBudgetsCount: budgets.length,
      }),
    [currentTotals, fixedTotal, budgetsOverLimit, budgets]
  );

  // Conclusiones automatizadas para Joel y Kath
  const topCategory = categoryShares[0];
  const expensePercentageOfIncome =
    currentTotals.totalIncome > 0
      ? Math.round((currentTotals.totalExpenses / currentTotals.totalIncome) * 100)
      : 0;

  const hasAnyActivity = currentTotals.totalIncome > 0 || currentTotals.totalExpenses > 0;

  const conclusions = !hasAnyActivity
    ? [
        `No hay movimientos registrados para ${selectedMember === 'Familia' ? 'el hogar' : selectedMember} en este mes.`,
        'Los gráficos e indicadores se actualizarán en tiempo real tan pronto registres transacciones.',
      ]
    : [
        comparison.text,
        `Ahorro generado: ${formatCurrency(currentTotals.monthlySavings, currency)} este mes.`,
        topCategory ? `Mayor gasto en ${topCategory.name} (${topCategory.percentage}%).` : '',
        `Uso de ingresos: ${expensePercentageOfIncome}%.`,
        `Tasa de ahorro: ${currentTotals.savingsRate}%.`,
      ].filter(Boolean);

  const scopeColor = selectedMember === 'Kath' ? KathColors.primary : BrandColors.deepBlue;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header con selector Familia | Joel | Kath */}
      <View style={[styles.header, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Balance & Analítica</Text>
        </View>

        {/* Selector de Miembro: Familia | Joel | Kath */}
        <View style={styles.memberSelectorRow}>
          {(['Familia', 'Joel', 'Kath'] as const).map((m) => {
            const isSelected = selectedMember === m;
            const isKathTab = m === 'Kath';
            const activeBg = isKathTab ? KathColors.primary : BrandColors.nightBlue;
            const activeBorder = isKathTab ? KathColors.medium : BrandColors.deepBlue;

            return (
              <TouchableOpacity
                key={m}
                onPress={() => setSelectedMember(m)}
                style={[
                  styles.memberTab,
                  {
                    backgroundColor: isSelected ? activeBg : theme.surface,
                    borderColor: isSelected ? activeBorder : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.memberTabText,
                    { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  {m === 'Familia' ? 'Familia (Hogar)' : m}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selector de Periodo */}
        <View style={[styles.periodSelector, { backgroundColor: theme.surfaceCardAlt, marginTop: 8 }]}>
          {(['SEMANA', 'MES', 'AÑO', 'TODO'] as PeriodType[]).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={[
                styles.periodTab,
                period === p && { backgroundColor: scopeColor },
              ]}
            >
              <Text
                style={[
                  styles.periodTabText,
                  { color: period === p ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Caja de Conclusiones Automáticas */}
        <View
          style={[
            styles.conclusionsCard,
            {
              backgroundColor: selectedMember === 'Kath' ? KathColors.background : theme.surfaceCard,
              borderColor: selectedMember === 'Kath' ? KathColors.border : theme.border,
            },
          ]}
        >
          <View style={styles.conclusionsHeader}>
            <Ionicons name="sparkles" size={18} color={scopeColor} style={{ marginRight: 6 }} />
            <Text style={[styles.conclusionsTitle, { color: theme.textPrimary }]}>
              Diagnóstico: {selectedMember === 'Familia' ? 'Consolidado Familiar' : `Estadísticas de ${selectedMember}`}
            </Text>
          </View>
          {conclusions.map((concl, idx) => (
            <View key={idx} style={styles.conclusionBullet}>
              <View
                style={[
                  styles.bulletDot,
                  { backgroundColor: selectedMember === 'Kath' ? KathColors.primary : BrandColors.skyBlue },
                ]}
              />
              <Text style={[styles.conclusionText, { color: theme.textPrimary }]}>{concl}</Text>
            </View>
          ))}
        </View>

        {/* Indicador de Salud Financiera Familiar (solo cuando vista es Familia) */}
        {selectedMember === 'Familia' && (
          <JKFinancialHealthCard health={financialHealth} />
        )}

        {/* GRÁFICO 1: Ingresos vs Gastos */}
        <JKChartCard
          title="1. Ingresos vs Gastos"
          subtitle={`Balance neto del periodo (${selectedMember})`}
          insight={
            hasAnyActivity
              ? `Margen disponible: ${formatCurrency(currentTotals.netBalance, currency)}.`
              : 'Sin movimientos en el periodo actual.'
          }
        >
          <IncomeVsExpenseChart
            income={currentTotals.totalIncome}
            expenses={currentTotals.totalExpenses}
            currency={currency}
            palette={activePalette}
          />
        </JKChartCard>

        {/* GRÁFICO 2: Evolución Financiera Mensual */}
        <JKChartCard
          title="2. Evolución Financiera Mensual"
          subtitle="Histórico real de los últimos meses"
          insight={
            hasAnyActivity
              ? 'Tendencia acumulada calculada a partir de transacciones registradas.'
              : undefined
          }
        >
          <MonthlyEvolutionChart data={evolutionData} palette={activePalette} />
        </JKChartCard>

        {/* GRÁFICO 3: Distribución de Gastos por Categoría */}
        <JKChartCard
          title="3. Distribución de Gastos"
          subtitle={`Desglose por categorías (${selectedMember})`}
          insight={
            topCategory
              ? `${topCategory.name} representa el ${topCategory.percentage}% del gasto registrado.`
              : undefined
          }
        >
          <CategoryDonutChart categories={categoryShares} currency={currency} />
        </JKChartCard>

        {/* GRÁFICO 4: Ahorro Mensual */}
        <JKChartCard
          title="4. Ahorro Mensual Generado"
          subtitle="Fondos generados mes a mes"
          insight={
            currentTotals.monthlySavings > 0
              ? `Tasa de ahorro calculada del ${currentTotals.savingsRate}%.`
              : undefined
          }
        >
          <MonthlySavingsChart data={savingsData} currency={currency} palette={activePalette} />
        </JKChartCard>

        {/* GRÁFICO 5: Comparativa Mes Actual vs Mes Anterior */}
        <JKChartCard
          title="5. Mes Actual vs Mes Anterior"
          subtitle={`${currentMonthName} vs ${prevMonthName}`}
          insight={hasAnyActivity ? comparison.text : undefined}
        >
          <MonthOverMonthComparisonChart
            currentExpenses={currentTotals.totalExpenses}
            prevExpenses={prevTotals.totalExpenses}
            currentIncome={currentTotals.totalIncome}
            prevIncome={prevTotals.totalIncome}
            currentMonthName={currentMonthName}
            prevMonthName={prevMonthName}
            currency={currency}
            palette={activePalette}
          />
        </JKChartCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: Spacing.xs,
    letterSpacing: -0.3,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  memberTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  memberTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  periodSelector: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: 3,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  periodTabText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingBottom: 90,
  },
  conclusionsCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  conclusionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  conclusionsTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  conclusionBullet: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  conclusionText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});
