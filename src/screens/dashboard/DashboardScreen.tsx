// =====================================================================
// PANTALLA PRINCIPAL / DASHBOARD - JOEKAT FINANCE FINTECH PREMIUM
// Paleta: Verde profundo, Verde financiero, Azul oscuro, Blanco marfil
// Glassmorphism, Selector de Miembros (Joel/Kath/Compartido), Balance y Widgets
// =====================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../../store/financeStore';
import { useAuthStore } from '../../store/authStore';
import { Colors, Radius } from '../../theme/designTokens';
import { JKBalanceCard } from '../../components/common/JKBalanceCard';
import { JKTransactionCard } from '../../components/common/JKTransactionCard';
import { UserSelector, FinancialScope } from '../../components/common/UserSelector';
import { JKEmptyState } from '../../components/common/JKEmptyState';
import { toast } from '../../components/common/JKToast';
import { AddTransactionModal } from '../transactions/AddTransactionModal';
import { formatMonthYear, getTodayDateString } from '../../utils/date';
import { calculateMonthlyTotals, getMonthComparisonText } from '../../utils/calculations';
import { downloadMonthlyPdfReport, printMonthlyReport } from '../../services/pdfGenerator';
import { formatCurrency } from '../../utils/currency';
import { Spacing } from '../../theme/spacing';
import { Transaction } from '../../types';

interface DashboardScreenProps {
  navigation: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const {
    transactions,
    categories,
    fixedExpenses,
    budgets,
    savingGoals,
    syncWithSupabase,
    syncStatus,
    deleteTransaction,
    restoreTransaction,
    addTransaction,
  } = useFinanceStore();
  const { activeMember, switchMember } = useAuthStore();

  // Selector financiero: 'all' (Compartido) | 'joel' | 'kath'
  const [financialScope, setFinancialScope] = useState<FinancialScope>('all');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [initialTxType, setInitialTxType] = useState<any>('expense');
  const [refreshing, setRefreshing] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Fechas y periodo actual
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  // Filtrado de transacciones según el selector financiero (Compartido / Joel / Kath)
  const scopedTransactions = transactions.filter((t) => {
    if (financialScope === 'all') return true;
    if (financialScope === 'joel') return t.user_name === 'Joel' || t.owner === 'joel';
    if (financialScope === 'kath') return t.user_name === 'Kath' || t.user_name === 'Kat' || t.owner === 'kath';
    return true;
  });

  const currentMonthTotals = calculateMonthlyTotals(scopedTransactions, currentMonth, currentYear);
  const prevMonthTotals = calculateMonthlyTotals(scopedTransactions, prevMonth, prevYear);
  const comparison = getMonthComparisonText(currentMonthTotals.totalExpenses, prevMonthTotals.totalExpenses);

  // Gastos Fijos y Disponible Estimado
  const totalFixedExpenses = fixedExpenses.reduce((sum, f) => sum + f.amount, 0);
  const estimatedFreeAfterFixed = Math.max(0, currentMonthTotals.netBalance - totalFixedExpenses);

  const categoriesMap = categories.reduce((acc, c) => {
    acc[c.id] = c;
    return acc;
  }, {} as Record<string, any>);

  const handleRefresh = async () => {
    setRefreshing(true);
    await syncWithSupabase();
    setRefreshing(false);
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      await downloadMonthlyPdfReport({
        month: currentMonth,
        year: currentYear,
        transactions: scopedTransactions,
        budgets,
        categories,
        savingGoals,
        currency: 'DOP',
      });
      toast.success('Reporte PDF descargado con éxito');
    } catch (err: any) {
      toast.error('Error al descargar reporte: ' + (err?.message || 'Error'));
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrintReport = async () => {
    try {
      setIsPrinting(true);
      await printMonthlyReport({
        month: currentMonth,
        year: currentYear,
        transactions: scopedTransactions,
        budgets,
        categories,
        savingGoals,
        currency: 'DOP',
      });
      toast.success('Reporte enviado a la impresora');
    } catch (err: any) {
      toast.error('Error al imprimir reporte: ' + (err?.message || 'Error'));
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDuplicateTx = async (tx: Transaction) => {
    try {
      await addTransaction({
        household_id: tx.household_id || 'hh-joel-kat-01',
        type: tx.type,
        amount: tx.amount,
        user_name: tx.user_name,
        owner: tx.owner,
        category_id: tx.category_id,
        account_id: tx.account_id,
        description: tx.description ? `${tx.description} (Copia)` : 'Movimiento duplicado',
        date: getTodayDateString(),
      });
      toast.success('Movimiento duplicado con éxito');
    } catch {
      toast.error('No se pudo duplicar el movimiento');
    }
  };

  const handleDeleteTx = (tx: Transaction) => {
    deleteTransaction(tx.id);
    toast.undo('Movimiento eliminado', () => {
      restoreTransaction(tx);
    });
  };

  const recentTransactions = scopedTransactions.slice(0, 5);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.secondaryGreen} />
        }
      >
        {/* 1. Selector Financiero: JOEL | KATH | COMPARTIDO */}
        <View style={styles.selectorWrapper}>
          <UserSelector
            selected={financialScope}
            onSelect={(scope) => {
              setFinancialScope(scope);
              if (scope === 'joel') switchMember('Joel');
              else if (scope === 'kath') switchMember('Kath');
            }}
          />
        </View>

        {/* 2. Tarjeta Hero de Balance con los 4 Indicadores Clave */}
        <JKBalanceCard
          periodLabel={formatMonthYear()}
          availableBalance={currentMonthTotals.netBalance}
          totalIncome={currentMonthTotals.totalIncome}
          totalExpenses={currentMonthTotals.totalExpenses}
          monthlySavings={currentMonthTotals.monthlySavings}
          savingsRate={currentMonthTotals.savingsRate}
          comparisonPercentage={comparison.percentage}
          comparisonText={comparison.text}
          isComparisonPositive={comparison.isPositive}
          onPressPeriod={() => navigation.navigate('Balance')}
        />

        {/* 3. Acciones de Reporte Ejecutivo: Descargar PDF e Imprimir */}
        <View style={styles.sectionContainer}>
          <View
            style={[
              styles.pdfCard,
              Platform.OS === 'web' ? ({
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              } as any) : null,
            ]}
          >
            <View style={styles.pdfCardHeader}>
              <View style={styles.pdfIconCircle}>
                <Ionicons name="document-text" size={20} color={Colors.secondaryGreen} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.pdfTitle}>Reporte Financiero Mensual</Text>
                <Text style={styles.pdfSubtitle}>Documento ejecutivo formal de {formatMonthYear()}</Text>
              </View>
            </View>

            <View style={styles.pdfButtonsRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleDownloadPdf}
                disabled={isDownloadingPdf || isPrinting}
                style={[styles.pdfBtn, styles.pdfBtnPrimary]}
              >
                {isDownloadingPdf ? (
                  <ActivityIndicator size="small" color={Colors.darkNavy} />
                ) : (
                  <>
                    <Ionicons name="cloud-download-outline" size={16} color={Colors.darkNavy} />
                    <Text style={styles.pdfBtnPrimaryText}>Descargar PDF</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handlePrintReport}
                disabled={isDownloadingPdf || isPrinting}
                style={[styles.pdfBtn, styles.pdfBtnOutline]}
              >
                {isPrinting ? (
                  <ActivityIndicator size="small" color={Colors.ivoryWhite} />
                ) : (
                  <>
                    <Ionicons name="print-outline" size={16} color={Colors.ivoryWhite} />
                    <Text style={styles.pdfBtnOutlineText}>Imprimir</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 4. Widget de Gastos Fijos y Dinero Estimado Disponible */}
        <View style={styles.sectionContainer}>
          <View
            style={[
              styles.fixedSummaryCard,
              Platform.OS === 'web' ? ({
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              } as any) : null,
            ]}
          >
            <View style={styles.widgetHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.miniDot, { backgroundColor: Colors.secondaryGreen }]} />
                <Text style={styles.widgetTitle}>Gastos Fijos del Mes</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('FixedExpenses')}>
                <Text style={styles.widgetLink}>Ver fijos</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.fixedMetricsRow}>
              <View style={styles.fixedMetricCol}>
                <Text style={styles.metricLabel}>COMPROMISOS FIJOS</Text>
                <Text style={styles.metricValue}>{formatCurrency(totalFixedExpenses, 'DOP')}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.fixedMetricCol}>
                <Text style={styles.metricLabel}>DISPONIBLE TRAS FIJOS</Text>
                <Text style={[styles.metricValue, { color: Colors.secondaryGreen }]}>
                  {formatCurrency(estimatedFreeAfterFixed, 'DOP')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 5. Widget de Metas de Ahorro Prioritarias */}
        {savingGoals.length > 0 ? (
          <View style={styles.sectionContainer}>
            <View
              style={[
                styles.goalsPreviewCard,
                Platform.OS === 'web' ? ({
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                } as any) : null,
              ]}
            >
              <View style={styles.widgetHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="flag" size={16} color={Colors.secondaryGreen} style={{ marginRight: 6 }} />
                  <Text style={styles.widgetTitle}>Metas Prioritarias</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('SavingGoals')}>
                  <Text style={styles.widgetLink}>Ver todas</Text>
                </TouchableOpacity>
              </View>

              {savingGoals.slice(0, 3).map((goal, idx) => {
                const pct = Math.min(100, Math.round((goal.current_amount / (goal.target_amount || 1)) * 100));
                return (
                  <View key={goal.id} style={styles.goalItemRow}>
                    <View style={styles.goalItemHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.goalPriority}>#{goal.priority || idx + 1}</Text>
                        <Text style={styles.goalName}>{goal.name}</Text>
                      </View>
                      <Text style={styles.goalPercentage}>{pct}%</Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                      <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
                    </View>
                    <View style={styles.goalAmountsRow}>
                      <Text style={styles.goalSaved}>{formatCurrency(goal.current_amount, 'DOP')}</Text>
                      <Text style={styles.goalTarget}>de {formatCurrency(goal.target_amount, 'DOP')}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* 6. Movimientos Recientes con Acciones */}
        <View style={styles.sectionContainer}>
          <View style={styles.widgetHeaderRow}>
            <Text style={styles.sectionMainTitle}>Movimientos Recientes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Movimientos')}>
              <Text style={styles.widgetLink}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length > 0 ? (
            recentTransactions.map((tx) => (
              <JKTransactionCard
                key={tx.id}
                transaction={tx}
                category={categoriesMap[tx.category_id || '']}
                onEdit={() => {
                  setEditingTx(tx);
                  setAddModalVisible(true);
                }}
                onDuplicate={() => handleDuplicateTx(tx)}
                onDelete={() => handleDeleteTx(tx)}
              />
            ))
          ) : (
            <JKEmptyState
              title="Aún no hay movimientos este mes"
              description="Toca el botón (+) central para registrar tu primer gasto o ingreso familiar."
              actionLabel="Registrar primer movimiento"
              onAction={() => {
                setEditingTx(null);
                setInitialTxType('expense');
                setAddModalVisible(true);
              }}
            />
          )}
        </View>
      </ScrollView>

      {/* Modal de edición / adición rápida */}
      <AddTransactionModal
        visible={addModalVisible}
        onClose={() => {
          setAddModalVisible(false);
          setEditingTx(null);
        }}
        initialType={initialTxType}
        initialTransaction={editingTx}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.darkNavy,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 90,
  },
  selectorWrapper: {
    paddingHorizontal: Spacing.md,
    paddingTop: 10,
    paddingBottom: 4,
  },
  sectionContainer: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  widgetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  widgetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.ivoryWhite,
  },
  sectionMainTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.ivoryWhite,
    letterSpacing: -0.3,
  },
  widgetLink: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryGreen,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  pdfCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 3,
  },
  pdfCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pdfIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(20, 184, 166, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.ivoryWhite,
  },
  pdfSubtitle: {
    fontSize: 11,
    color: Colors.ivoryTranslucent,
    marginTop: 2,
  },
  pdfButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pdfBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radius.md,
    gap: 6,
  },
  pdfBtnPrimary: {
    backgroundColor: Colors.secondaryGreen,
  },
  pdfBtnPrimaryText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.darkNavy,
  },
  pdfBtnOutline: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  pdfBtnOutlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.ivoryWhite,
  },
  fixedSummaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  fixedMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  fixedMetricCol: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.ivoryTranslucent,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.ivoryWhite,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: 12,
  },
  goalsPreviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  goalItemRow: {
    marginBottom: 12,
  },
  goalItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  goalPriority: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.secondaryGreen,
    marginRight: 6,
  },
  goalName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ivoryWhite,
  },
  goalPercentage: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.secondaryGreen,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.secondaryGreen,
  },
  goalAmountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalSaved: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.ivoryWhite,
  },
  goalTarget: {
    fontSize: 11,
    color: Colors.ivoryMuted,
  },
});
