// Pantalla de Presupuestos Mensuales por Categoría
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../../store/financeStore';
import { useThemeStore } from '../../store/themeStore';
import { BrandColors } from '../../theme/colors';
import { JKBadge, BadgeVariant } from '../../components/common/JKBadge';
import { JKProgressBar } from '../../components/common/JKProgressBar';
import { JKButton } from '../../components/common/JKButton';
import { JKModal } from '../../components/common/JKModal';
import { JKAmountInput } from '../../components/common/JKAmountInput';
import { JKEmptyState } from '../../components/common/JKEmptyState';
import { toast } from '../../components/common/JKToast';
import { formatCurrency } from '../../utils/currency';
import { Spacing, BorderRadius } from '../../theme/spacing';

export const BudgetsScreen: React.FC = () => {
  const { budgets, categories, transactions, setBudget, deleteBudget } = useFinanceStore();
  const { theme, currency } = useThemeStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [allocatedAmount, setAllocatedAmount] = useState('');
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const categoriesMap = categories.reduce((acc, c) => {
    acc[c.id] = c;
    return acc;
  }, {} as Record<string, any>);

  // Calcular gasto del mes actual por categoría
  const monthTransactions = transactions.filter((t) => {
    if (!t.date) return false;
    const p = t.date.split('-');
    return parseInt(p[0], 10) === currentYear && parseInt(p[1], 10) === currentMonth;
  });

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.allocated_amount, 0);
  const totalSpent = budgets.reduce((sum, b) => {
    const spent = monthTransactions
      .filter((t) => t.type === 'expense' && t.category_id === b.category_id)
      .reduce((s, t) => s + t.amount, 0);
    return sum + spent;
  }, 0);

  const handleOpenEdit = (categoryId: string, currentAmount = 0, budgetId: string | null = null) => {
    setSelectedCatId(categoryId);
    setAllocatedAmount(currentAmount > 0 ? currentAmount.toString() : '');
    setEditingBudgetId(budgetId);
    setModalVisible(true);
  };

  const handleSaveBudget = () => {
    const num = parseFloat(allocatedAmount);
    if (!selectedCatId) {
      Alert.alert('Categoría requerida', 'Por favor selecciona una categoría.');
      return;
    }
    if (isNaN(num) || num < 0) {
      Alert.alert('Monto inválido', 'Ingresa un monto válido.');
      return;
    }

    setBudget({
      household_id: 'hh-joel-kat-01',
      category_id: selectedCatId,
      month: currentMonth,
      year: currentYear,
      allocated_amount: num,
    });

    setModalVisible(false);
    setSelectedCatId('');
    setAllocatedAmount('');
    setEditingBudgetId(null);
    toast.success('✓ Presupuesto guardado');
  };

  const handleDeleteBudget = () => {
    if (!editingBudgetId) return;
    Alert.alert(
      '¿Eliminar este presupuesto?',
      '¿Estás seguro de eliminar el límite asignado para esta categoría?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deleteBudget(editingBudgetId);
            setModalVisible(false);
            setEditingBudgetId(null);
            toast.success('Presupuesto eliminado');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Resumen */}
      <View style={[styles.header, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Presupuestos Mensuales</Text>
          <JKButton
            title="+ Asignar"
            onPress={() => handleOpenEdit(expenseCategories[0]?.id || '')}
            variant="primary"
            size="sm"
          />
        </View>

        {/* Hero Card Presupuestario */}
        <View style={[styles.summaryCard, { backgroundColor: BrandColors.nightBlue }]}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>PRESUPUESTADO</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalBudgeted, currency)}</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>UTILIZADO</Text>
            <Text style={[styles.summaryValue, { color: BrandColors.skyBlue }]}>
              {formatCurrency(totalSpent, currency)}
            </Text>
          </View>
        </View>
      </View>

      {/* Lista de Presupuestos */}
      <FlatList
        data={budgets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const cat = categoriesMap[item.category_id];
          const spent = monthTransactions
            .filter((t) => t.type === 'expense' && t.category_id === item.category_id)
            .reduce((sum, t) => sum + t.amount, 0);

          const percent = item.allocated_amount > 0 ? Math.round((spent / item.allocated_amount) * 100) : 0;

          let statusLabel = 'Dentro del presupuesto';
          let statusVariant: BadgeVariant = 'success';

          if (percent >= 100) {
            statusLabel = 'Presupuesto superado';
            statusVariant = 'danger';
          } else if (percent >= 80) {
            statusLabel = 'Cerca del límite';
            statusVariant = 'warning';
          }

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleOpenEdit(item.category_id, item.allocated_amount, item.id)}
              style={[
                styles.budgetCard,
                {
                  backgroundColor: theme.surfaceCard,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.catInfoRow}>
                  <View style={[styles.iconCircle, { backgroundColor: `${cat?.color || BrandColors.deepBlue}20` }]}>
                    <Ionicons name={(cat?.icon as any) || 'pricetag'} size={18} color={cat?.color || BrandColors.deepBlue} />
                  </View>
                  <View>
                    <Text style={[styles.catName, { color: theme.textPrimary }]}>
                      {cat?.name || 'Categoría'}
                    </Text>
                    <Text style={[styles.spentSub, { color: theme.textMuted }]}>
                      {formatCurrency(spent, currency)} utilizado
                    </Text>
                  </View>
                </View>

                <View style={styles.percentBlock}>
                  <Text style={[styles.percentNumber, { color: theme.textPrimary }]}>{percent}%</Text>
                  <JKBadge label={statusLabel} variant={statusVariant} />
                </View>
              </View>

              {/* Barra de Progreso */}
              <View style={styles.progressContainer}>
                <JKProgressBar progress={percent} height={9} />
              </View>

              <View style={styles.cardBottomRow}>
                <Text style={[styles.allocatedText, { color: theme.textSecondary }]}>
                  Límite: {formatCurrency(item.allocated_amount, currency)}
                </Text>
                <Text style={[styles.remainingText, { color: item.allocated_amount - spent >= 0 ? BrandColors.success : BrandColors.danger }]}>
                  {item.allocated_amount - spent >= 0
                    ? `Quedan ${formatCurrency(item.allocated_amount - spent, currency)}`
                    : `Excedido por ${formatCurrency(Math.abs(item.allocated_amount - spent), currency)}`}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <JKEmptyState
            title="Sin presupuestos asignados"
            description="Establece límites de gasto mensual por categoría para proteger el ahorro familiar."
            actionLabel="+ Fijar presupuesto"
            onAction={() => handleOpenEdit(expenseCategories[0]?.id || '')}
          />
        }
      />

      {/* Modal Ajustar / Editar Presupuesto */}
      <JKModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingBudgetId(null);
        }}
        title={editingBudgetId ? 'Editar Presupuesto' : 'Fijar Presupuesto Mensual'}
      >
        <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Selecciona Categoría</Text>
        <View style={styles.catChipsGrid}>
          {expenseCategories.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => setSelectedCatId(c.id)}
              style={[
                styles.modalCatChip,
                selectedCatId === c.id && { backgroundColor: BrandColors.deepBlue, borderColor: BrandColors.deepBlue },
                { borderColor: theme.border },
              ]}
            >
              <Text
                style={[
                  styles.modalCatChipText,
                  { color: selectedCatId === c.id ? '#FFFFFF' : theme.textPrimary },
                ]}
              >
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <JKAmountInput
          label="Monto límite mensual"
          amount={allocatedAmount}
          onChangeAmount={setAllocatedAmount}
          currencyPrefix={currency === 'DOP' ? 'RD$' : currency}
        />

        <JKButton
          title={editingBudgetId ? 'Guardar Cambios' : 'Guardar Presupuesto'}
          onPress={handleSaveBudget}
          variant="primary"
          size="md"
          style={{ marginTop: Spacing.md }}
        />

        {editingBudgetId && (
          <JKButton
            title="Eliminar Presupuesto"
            onPress={handleDeleteBudget}
            variant="danger"
            size="md"
            style={{ marginTop: Spacing.sm }}
          />
        )}
      </JKModal>
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
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  summaryCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    marginVertical: 4,
  },
  summaryLabel: {
    color: BrandColors.slateBlue,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 90,
  },
  budgetCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  catInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  catName: {
    fontSize: 15,
    fontWeight: '700',
  },
  spentSub: {
    fontSize: 12,
    marginTop: 2,
  },
  percentBlock: {
    alignItems: 'flex-end',
  },
  percentNumber: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  progressContainer: {
    marginVertical: Spacing.xs,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  allocatedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  catChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  modalCatChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  modalCatChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
