// Pantalla de Reporte Mensual, Exportación a PDF/CSV y Cierre de Mes
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../../store/financeStore';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { BrandColors } from '../../theme/colors';
import { JKButton } from '../../components/common/JKButton';
import { downloadMonthlyPdfReport, printMonthlyReport } from '../../services/pdfGenerator';
import { exportTransactionsToCsv } from '../../services/csvExporter';
import { calculateMonthlyTotals, getMonthComparisonText, calculateCategoryBreakdown } from '../../utils/calculations';
import { formatCurrency } from '../../utils/currency';
import { formatMonthYear } from '../../utils/date';
import { Spacing, BorderRadius } from '../../theme/spacing';

export const MonthlyReportScreen: React.FC = () => {
  const { transactions, categories, accounts, budgets, savingGoals, closeMonth } = useFinanceStore();
  const { activeMember } = useAuthStore();
  const { theme, currency, isDarkMode } = useThemeStore();

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  // Selector de Periodo Dinámico
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
  const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;

  // Cálculos del mes seleccionado vs mes anterior
  const currentTotals = calculateMonthlyTotals(transactions, selectedMonth, selectedYear);
  const prevTotals = calculateMonthlyTotals(transactions, prevMonth, prevYear);
  const comparison = getMonthComparisonText(currentTotals.totalExpenses, prevTotals.totalExpenses);

  const categoriesMap = categories.reduce((acc, c) => {
    acc[c.id] = c;
    return acc;
  }, {} as Record<string, any>);

  const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const breakdown = calculateCategoryBreakdown(
    transactions.filter((t) => t.date && t.date.startsWith(monthPrefix)),
    'expense',
    categoriesMap
  );

  const currentPeriodLabel = formatMonthYear(new Date(selectedYear, selectedMonth - 1, 1));

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      await downloadMonthlyPdfReport({
        month: selectedMonth,
        year: selectedYear,
        transactions,
        budgets,
        categories,
        savingGoals,
        currency,
      });
      Alert.alert('Descarga Completa', 'El reporte PDF mensual ha sido generado y descargado exitosamente.');
    } catch (err: any) {
      Alert.alert('Error en Exportación', err.message || 'No se pudo generar el archivo PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrintReport = async () => {
    setIsPrinting(true);
    try {
      await printMonthlyReport({
        month: selectedMonth,
        year: selectedYear,
        transactions,
        budgets,
        categories,
        savingGoals,
        currency,
      });
    } catch (err: any) {
      Alert.alert('Error de Impresión', err.message || 'No se pudo abrir el diálogo de impresión.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    try {
      await exportTransactionsToCsv({
        transactions,
        categories,
        accounts,
      });
    } catch (err: any) {
      Alert.alert('Error en Exportación', err.message || 'No se pudo exportar el archivo CSV.');
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleCloseMonth = () => {
    Alert.alert(
      'Cerrar Mes Financiero',
      `¿Desean consolidar y guardar la fotografía financiera de ${currentPeriodLabel}? Esto congelará el balance para el historial del hogar (sus movimientos históricos nunca se borrarán).`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Mes',
          style: 'default',
          onPress: () => {
            closeMonth(selectedMonth, selectedYear, activeMember);
            Alert.alert(
              '¡Mes Cerrado con Éxito!',
              `La fotografía de ${currentPeriodLabel} quedó guardada de manera permanente en el historial familiar.`
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Selector de Mes Navegable */}
        <View style={[styles.monthNavCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn}>
            <Ionicons name="chevron-back" size={20} color={BrandColors.deepBlue} />
            <Text style={[styles.monthNavBtnText, { color: BrandColors.deepBlue }]}>Anterior</Text>
          </TouchableOpacity>
          <Text style={[styles.monthNavTitle, { color: theme.textPrimary }]}>{currentPeriodLabel}</Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn}>
            <Text style={[styles.monthNavBtnText, { color: BrandColors.deepBlue }]}>Siguiente</Text>
            <Ionicons name="chevron-forward" size={20} color={BrandColors.deepBlue} />
          </TouchableOpacity>
        </View>

        {/* Encabezado Editorial Ejecutivo */}
        <View style={[styles.reportHeaderCard, { backgroundColor: BrandColors.nightBlue }]}>
          <Text style={styles.brandTitle}>joekat finace</Text>
          <Text style={styles.reportDocTitle}>REPORTE FINANCIERO MENSUAL</Text>
          <Text style={styles.periodText}>{currentPeriodLabel}</Text>

          {/* Cuadrícula de Cifras Clave */}
          <View style={styles.gridContainer}>
            <View style={styles.gridItem}>
              <Text style={styles.itemLabel}>INGRESOS TOTALES</Text>
              <Text style={[styles.itemValue, { color: BrandColors.success }]}>
                {formatCurrency(currentTotals.totalIncome, currency)}
              </Text>
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.itemLabel}>GASTOS TOTALES</Text>
              <Text style={styles.itemValue}>{formatCurrency(currentTotals.totalExpenses, currency)}</Text>
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.itemLabel}>BALANCE DISPONIBLE</Text>
              <Text style={[styles.itemValue, { color: BrandColors.skyBlue }]}>
                {formatCurrency(currentTotals.netBalance, currency)}
              </Text>
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.itemLabel}>TASA DE AHORRO</Text>
              <Text style={[styles.itemValue, { color: BrandColors.skyBlue }]}>
                {currentTotals.savingsRate}%
              </Text>
            </View>
          </View>
        </View>

        {/* Comparación Mensual */}
        <View style={[styles.sectionCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="git-compare-outline" size={18} color={BrandColors.deepBlue} style={{ marginRight: 6 }} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Comparativa de Periodo</Text>
          </View>
          <Text style={[styles.comparisonDescription, { color: theme.textPrimary }]}>
            {comparison.text}
          </Text>
        </View>

        {/* Metas Familiares Priorizadas */}
        {savingGoals.length > 0 ? (
          <View style={[styles.sectionCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="flag-outline" size={18} color={BrandColors.deepBlue} style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Metas de Ahorro y Prioridades</Text>
            </View>
            {[...savingGoals]
              .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
              .map((g, idx) => {
                const priorityNum = g.priority ?? idx + 1;
                const percent = g.target_amount > 0 ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)) : 0;
                return (
                  <View key={g.id} style={styles.breakdownRow}>
                    <View style={styles.breakdownLeft}>
                      <View
                        style={{
                          backgroundColor: priorityNum === 1 ? BrandColors.nightBlue : BrandColors.lightSky,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4,
                          marginRight: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '700',
                            color: priorityNum === 1 ? '#FFFFFF' : BrandColors.deepBlue,
                          }}
                        >
                          #{priorityNum}
                        </Text>
                      </View>
                      <Text style={[styles.categoryName, { color: theme.textPrimary }]}>{g.name}</Text>
                    </View>
                    <View style={styles.breakdownRight}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: BrandColors.deepBlue }}>
                        {formatCurrency(g.current_amount, currency)} / {formatCurrency(g.target_amount, currency)} ({percent}%)
                      </Text>
                    </View>
                  </View>
                );
              })}
          </View>
        ) : null}

        {/* Principales Categorías de Gasto */}
        <View style={[styles.sectionCard, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginBottom: Spacing.sm }]}>
            Mayores Gastos del Mes
          </Text>
          {breakdown.slice(0, 5).map((item, idx) => (
            <View key={idx} style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <View style={[styles.dot, { backgroundColor: item.color }]} />
                <Text style={[styles.categoryName, { color: theme.textPrimary }]}>{item.name}</Text>
              </View>
              <View style={styles.breakdownRight}>
                <Text style={[styles.catAmount, { color: theme.textSecondary }]}>
                  {formatCurrency(item.amount, currency)}
                </Text>
                <Text style={[styles.catPercentage, { color: theme.textPrimary }]}>
                  {item.percentage}%
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Acciones de Exportación y Cierre */}
        <View style={styles.actionsContainer}>
          <JKButton
            title="Descargar Reporte en PDF"
            onPress={handleDownloadPdf}
            loading={isExportingPdf}
            variant="primary"
            size="lg"
            icon={<Ionicons name="cloud-download-outline" size={20} color="#FFFFFF" />}
            style={{ marginBottom: Spacing.sm }}
          />

          <JKButton
            title="Imprimir Reporte"
            onPress={handlePrintReport}
            loading={isPrinting}
            variant="secondary"
            size="lg"
            icon={<Ionicons name="print-outline" size={20} color={isDarkMode ? '#FFFFFF' : '#071827'} />}
            style={{ marginBottom: Spacing.sm }}
          />

          <JKButton
            title="Exportar Transacciones a CSV (Excel)"
            onPress={handleExportCsv}
            loading={isExportingCsv}
            variant="secondary"
            size="lg"
            icon={<Ionicons name="download-outline" size={20} color={isDarkMode ? '#FFFFFF' : '#071827'} />}
            style={{ marginBottom: Spacing.md }}
          />

          <JKButton
            title="Cerrar Mes (Fotografía Histórica)"
            onPress={handleCloseMonth}
            variant="outline"
            size="md"
            icon={<Ionicons name="lock-closed-outline" size={18} color={isDarkMode ? '#14B8A6' : '#0F766E'} />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 90,
  },
  monthNavCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  monthNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  monthNavBtnText: {
    fontSize: 13,
    fontWeight: '600',
    marginHorizontal: 4,
  },
  monthNavTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  reportHeaderCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  reportDocTitle: {
    color: BrandColors.skyBlue,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  periodText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: Spacing.md,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
  },
  gridItem: {
    width: '50%',
    padding: Spacing.sm,
    alignItems: 'center',
  },
  itemLabel: {
    color: BrandColors.slateBlue,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  itemValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  sectionCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  comparisonDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
  },
  breakdownRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catAmount: {
    fontSize: 12,
    marginRight: 8,
  },
  catPercentage: {
    fontSize: 13,
    fontWeight: '700',
    width: 32,
    textAlign: 'right',
  },
  actionsContainer: {
    marginTop: Spacing.md,
  },
});
