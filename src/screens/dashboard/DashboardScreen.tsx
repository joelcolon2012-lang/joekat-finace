// Pantalla principal / Dashboard de JOEKAT FINACE
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../../store/financeStore';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { BrandColors, KathColors } from '../../theme/colors';
import { JKBalanceCard } from '../../components/common/JKBalanceCard';
import { JKTransactionCard } from '../../components/common/JKTransactionCard';
import { JKFinancialHealthCard } from '../../components/common/JKFinancialHealthCard';
import { JKAvatar } from '../../components/common/JKAvatar';
import { JKEmptyState } from '../../components/common/JKEmptyState';
import { JKModal } from '../../components/common/JKModal';
import { toast } from '../../components/common/JKToast';
import { AddTransactionModal } from '../transactions/AddTransactionModal';
import { getGreeting, formatMonthYear } from '../../utils/date';
import { calculateMonthlyTotals, getMonthComparisonText } from '../../utils/calculations';
import { calculateFinancialHealth } from '../../utils/financialHealth';
import { downloadMonthlyPdfReport, printMonthlyReport } from '../../services/pdfGenerator';
import { Spacing, BorderRadius } from '../../theme/spacing';
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
    isLoading,
    syncStatus,
    deleteTransaction,
    restoreTransaction,
  } = useFinanceStore();
  const { activeMember, switchMember, household } = useAuthStore();
  const { theme, currency } = useThemeStore();

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [initialTxType, setInitialTxType] = useState<'expense' | 'income'>('expense');
  const [refreshing, setRefreshing] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Totales dinámicos del mes actual y mes anterior
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const currentMonthTotals = calculateMonthlyTotals(transactions, currentMonth, currentYear);
  const prevMonthTotals = calculateMonthlyTotals(transactions, prevMonth, prevYear);

  const comparison = getMonthComparisonText(
    currentMonthTotals.totalExpenses,
    prevMonthTotals.totalExpenses
  );

  // Salud Financiera
  const fixedTotal = fixedExpenses.reduce((sum, f) => sum + f.amount, 0);
  const budgetsOverLimit = budgets.filter((b) => {
    const spent = transactions
      .filter((t) => t.type === 'expense' && t.category_id === b.category_id)
      .reduce((sum, t) => sum + t.amount, 0);
    return spent > b.allocated_amount;
  }).length;

  const financialHealth = calculateFinancialHealth({
    totalIncome: currentMonthTotals.totalIncome,
    totalExpenses: currentMonthTotals.totalExpenses,
    savingsRate: currentMonthTotals.savingsRate,
    fixedExpensesTotal: fixedTotal,
    budgetsOverLimitCount: budgetsOverLimit,
    totalBudgetsCount: budgets.length,
  });

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
        transactions,
        budgets,
        categories,
        savingGoals,
        currency,
      });
      toast.success('Reporte PDF descargado con éxito');
    } catch (err: any) {
      toast.error('Error al descargar reporte PDF: ' + (err?.message || 'Error'));
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
        transactions,
        budgets,
        categories,
        savingGoals,
        currency,
      });
      toast.success('Reporte enviado a la impresora');
    } catch (err: any) {
      toast.error('Error al imprimir reporte: ' + (err?.message || 'Error'));
    } finally {
      setIsPrinting(false);
    }
  };

  const recentTransactions = transactions.slice(0, 5);
  const isKath = activeMember === 'Kath' || activeMember === 'Kat';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Barra superior con identidad, indicador en vivo y switch de Joel/Kath */}
      <View style={[styles.topBar, { backgroundColor: theme.background, borderColor: theme.border }]}>
        <View style={styles.brandTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>joekat finace</Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginLeft: 8,
                backgroundColor: syncStatus === 'connected' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 10,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: syncStatus === 'connected' ? '#10B981' : '#F59E0B',
                  marginRight: 4,
                }}
              />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: syncStatus === 'connected' ? '#10B981' : '#F59E0B',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {syncStatus === 'connected' ? 'En Vivo' : 'Conectando'}
              </Text>
            </View>
          </View>
          <Text style={[styles.householdName, { color: theme.textSecondary }]}>
            {household?.name || 'Hogar Joel & Kath'}
          </Text>
        </View>

        {/* Conmutador rápido de miembro activo (Joel / Kath) */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => switchMember(activeMember === 'Joel' ? 'Kath' : 'Joel')}
          style={[
            styles.memberSwitchPill,
            {
              backgroundColor: isKath ? KathColors.pale : theme.surfaceCard,
              borderColor: isKath ? KathColors.border : theme.border,
            },
          ]}
        >
          <JKAvatar name={activeMember} size={28} showBadge={true} />
          <View style={styles.memberSwitchTextCol}>
            <Text style={[styles.memberSwitchLabel, { color: isKath ? KathColors.primary : theme.textMuted }]}>
              Activo
            </Text>
            <Text style={[styles.memberSwitchName, { color: isKath ? KathColors.primary : theme.textPrimary }]}>
              {activeMember}
            </Text>
          </View>
          <Ionicons
            name="swap-vertical"
            size={14}
            color={isKath ? KathColors.primary : BrandColors.deepBlue}
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Tarjeta Hero de Balance */}
        <JKBalanceCard
          greeting={getGreeting(activeMember)}
          periodLabel={formatMonthYear()}
          availableBalance={currentMonthTotals.netBalance}
          totalIncome={currentMonthTotals.totalIncome}
          totalExpenses={currentMonthTotals.totalExpenses}
          monthlySavings={currentMonthTotals.monthlySavings}
          comparisonText={comparison.text}
          isComparisonPositive={comparison.isPositive}
        />

        {/* Botones de Acción Rápida (1 Toque) */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setInitialTxType('expense');
              setAddModalVisible(true);
            }}
            style={[styles.quickActionBtn, { backgroundColor: BrandColors.nightBlue }]}
          >
            <Ionicons name="arrow-down-circle" size={20} color="#FFFFFF" />
            <Text style={styles.quickActionText}>+ Gasto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setInitialTxType('income');
              setAddModalVisible(true);
            }}
            style={[styles.quickActionBtn, { backgroundColor: BrandColors.deepBlue }]}
          >
            <Ionicons name="arrow-up-circle" size={20} color="#FFFFFF" />
            <Text style={styles.quickActionText}>+ Ingreso</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('FixedExpenses')}
            style={[styles.quickActionBtn, { backgroundColor: BrandColors.petrolBlue }]}
          >
            <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Fijos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('SavingGoals')}
            style={[styles.quickActionBtn, { backgroundColor: BrandColors.skyBlue }]}
          >
            <Ionicons name="flag-outline" size={20} color={BrandColors.nightBlue} />
            <Text style={[styles.quickActionText, { color: BrandColors.nightBlue }]}>Metas</Text>
          </TouchableOpacity>
        </View>

        {/* Reporte Financiero Mensual con botones separados de Descarga PDF e Impresión */}
        <View style={styles.sectionContainer}>
          <View
            style={[
              styles.pdfDownloadBanner,
              { backgroundColor: theme.surfaceCard, borderColor: BrandColors.lightSky },
            ]}
          >
            <View style={styles.pdfBannerHeader}>
              <View style={[styles.pdfIconContainer, { backgroundColor: BrandColors.lightSky }]}>
                <Ionicons name="document-text" size={22} color={BrandColors.deepBlue} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.pdfBannerTitle, { color: theme.textPrimary }]}>
                  Reporte Financiero Mensual
                </Text>
                <Text style={[styles.pdfBannerSub, { color: theme.textSecondary }]}>
                  Documento ejecutivo de {formatMonthYear()}
                </Text>
              </View>
            </View>

            <View style={styles.pdfActionButtonsRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleDownloadPdf}
                disabled={isDownloadingPdf || isPrinting}
                style={[styles.pdfActionBtn, { backgroundColor: BrandColors.deepBlue }]}
              >
                {isDownloadingPdf ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="cloud-download-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.pdfActionBtnText}>Descargar PDF</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handlePrintReport}
                disabled={isDownloadingPdf || isPrinting}
                style={[
                  styles.pdfActionBtn,
                  {
                    backgroundColor: BrandColors.softGrey,
                    borderColor: BrandColors.lightSky,
                    borderWidth: 1,
                  },
                ]}
              >
                {isPrinting ? (
                  <ActivityIndicator size="small" color={BrandColors.deepBlue} />
                ) : (
                  <>
                    <Ionicons name="print-outline" size={16} color={BrandColors.deepBlue} />
                    <Text style={[styles.pdfActionBtnText, { color: BrandColors.deepBlue }]}>
                      Imprimir
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Tarjeta de Salud Financiera */}
        <View style={styles.sectionContainer}>
          <JKFinancialHealthCard
            health={financialHealth}
            onPressDetails={() => navigation.navigate('Balance')}
          />
        </View>

        {/* Movimientos Recientes */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Movimientos Recientes
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Movimientos')}>
              <Text style={[styles.seeAllText, { color: BrandColors.deepBlue }]}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length > 0 ? (
            recentTransactions.map((tx) => (
              <JKTransactionCard
                key={tx.id}
                transaction={tx}
                category={categoriesMap[tx.category_id || '']}
                onPress={() => {
                  setEditingTx(tx);
                  setAddModalVisible(true);
                }}
                onEdit={() => {
                  setEditingTx(tx);
                  setAddModalVisible(true);
                }}
                onDelete={() => setDeletingTx(tx)}
              />
            ))
          ) : (
            <JKEmptyState
              title="Aún no hay movimientos este mes"
              description="Comiencen registrando el primer gasto o ingreso familiar."
              actionLabel="+ Añadir primer movimiento"
              onAction={() => {
                setEditingTx(null);
                setInitialTxType('expense');
                setAddModalVisible(true);
              }}
            />
          )}
        </View>
      </ScrollView>

      {/* Modal Rápido de Movimiento */}
      <AddTransactionModal
        visible={addModalVisible}
        onClose={() => {
          setAddModalVisible(false);
          setEditingTx(null);
        }}
        initialType={initialTxType}
        initialTransaction={editingTx}
      />

      {/* Modal de Confirmación para Eliminar Movimiento */}
      <JKModal
        visible={!!deletingTx}
        onClose={() => setDeletingTx(null)}
        title="¿Eliminar movimiento?"
      >
        {deletingTx && (
          <View style={{ paddingTop: 4 }}>
            <Text style={{ fontSize: 15, color: theme.textSecondary, marginBottom: 16, lineHeight: 22 }}>
              ¿Deseas eliminar este movimiento de{' '}
              <Text style={{ fontWeight: '700', color: theme.textPrimary }}>
                {deletingTx.description || categoriesMap[deletingTx.category_id || '']?.name || 'Movimiento'}
              </Text>{' '}
              por{' '}
              <Text style={{ fontWeight: '800', color: BrandColors.nightBlue }}>
                RD$ {deletingTx.amount.toLocaleString()}
              </Text>
              ?
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setDeletingTx(null)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: BorderRadius.md,
                  borderWidth: 1,
                  borderColor: theme.border,
                  alignItems: 'center',
                  backgroundColor: theme.surface,
                }}
              >
                <Text style={{ fontWeight: '600', color: theme.textSecondary, fontSize: 14 }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (!deletingTx) return;
                  const copy = { ...deletingTx };
                  deleteTransaction(deletingTx.id);
                  setDeletingTx(null);
                  toast.undo('Movimiento eliminado', () => {
                    restoreTransaction(copy);
                  });
                }}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: BorderRadius.md,
                  backgroundColor: BrandColors.danger,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontWeight: '700', color: '#FFFFFF', fontSize: 14 }}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </JKModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  brandTitleRow: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  householdName: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  memberSwitchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  memberSwitchTextCol: {
    marginHorizontal: 6,
  },
  memberSwitchLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  memberSwitchName: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 90,
  },
  quickActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: 8,
    marginBottom: Spacing.sm,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    gap: 5,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionContainer: {
    paddingHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pdfDownloadBanner: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    marginBottom: Spacing.sm,
    shadowColor: '#001D39',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  pdfBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pdfIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  pdfBannerSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  pdfActionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pdfActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  pdfActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
