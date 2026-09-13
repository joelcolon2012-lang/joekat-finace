// Pantalla de Gastos Fijos (Servicios, Alquiler, Préstamos, Suscripciones)
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
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { BrandColors } from '../../theme/colors';
import { FixedExpense, FixedExpenseStatus } from '../../types';
import { JKBadge, BadgeVariant } from '../../components/common/JKBadge';
import { JKButton } from '../../components/common/JKButton';
import { JKModal } from '../../components/common/JKModal';
import { JKInput } from '../../components/common/JKInput';
import { JKAmountInput } from '../../components/common/JKAmountInput';
import { JKEmptyState } from '../../components/common/JKEmptyState';
import { toast } from '../../components/common/JKToast';
import { formatCurrency } from '../../utils/currency';
import { Spacing, BorderRadius } from '../../theme/spacing';

export const FixedExpensesScreen: React.FC = () => {
  const {
    fixedExpenses,
    categories,
    accounts,
    addFixedExpense,
    updateFixedExpense,
    deleteFixedExpense,
    markFixedExpenseStatus,
  } = useFinanceStore();
  const { activeMember } = useAuthStore();
  const { theme, currency } = useThemeStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('15');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const totalFixedAmount = fixedExpenses.reduce((sum, f) => sum + f.amount, 0);
  const pendingAmount = fixedExpenses
    .filter((f) => f.status !== 'paid')
    .reduce((sum, f) => sum + f.amount, 0);

  const categoriesMap = categories.reduce((acc, c) => {
    acc[c.id] = c;
    return acc;
  }, {} as Record<string, any>);

  const getStatusVariant = (status: FixedExpenseStatus): { variant: BadgeVariant; label: string } => {
    switch (status) {
      case 'paid':
        return { variant: 'success', label: 'PAGADO' };
      case 'upcoming':
        return { variant: 'info', label: 'PRÓXIMO' };
      case 'pending':
      default:
        return { variant: 'warning', label: 'PENDIENTE' };
    }
  };

  const handleToggleStatus = (expense: FixedExpense) => {
    const nextStatus: FixedExpenseStatus = expense.status === 'paid' ? 'pending' : 'paid';
    markFixedExpenseStatus(expense.id, nextStatus, nextStatus === 'paid', activeMember);
    if (nextStatus === 'paid') {
      toast.success(`✓ "${expense.name}" marcado como PAGADO`);
    }
  };

  const handleOpenCreate = () => {
    setEditingExpense(null);
    setName('');
    setAmount('');
    setDueDay('15');
    setSelectedAccountId(accounts[0]?.id || '');
    setSelectedCategoryId(categories[0]?.id || '');
    setModalVisible(true);
  };

  const handleOpenEdit = (expense: FixedExpense) => {
    setEditingExpense(expense);
    setName(expense.name);
    setAmount(expense.amount.toString());
    setDueDay(expense.due_day.toString());
    setSelectedAccountId(expense.account_id || accounts[0]?.id || '');
    setSelectedCategoryId(expense.category_id || categories[0]?.id || '');
    setModalVisible(true);
  };

  const handleSaveFixedExpense = () => {
    const numAmount = parseFloat(amount);
    const day = parseInt(dueDay, 10);
    if (!name.trim()) {
      Alert.alert('Nombre requerido', 'Por favor ingresa un nombre para el gasto fijo.');
      return;
    }
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Monto inválido', 'Por favor ingresa un monto válido.');
      return;
    }
    if (!day || day < 1 || day > 31) {
      Alert.alert('Día inválido', 'Ingresa un día de vencimiento entre 1 y 31.');
      return;
    }

    if (editingExpense) {
      updateFixedExpense(editingExpense.id, {
        name: name.trim(),
        amount: numAmount,
        due_day: day,
        account_id: selectedAccountId,
        category_id: selectedCategoryId || categories[0]?.id,
      });
      toast.success('✓ Compromiso fijo actualizado');
    } else {
      addFixedExpense({
        household_id: 'hh-joel-kat-01',
        name: name.trim(),
        amount: numAmount,
        due_day: day,
        frequency: 'mensual',
        account_id: selectedAccountId,
        category_id: selectedCategoryId || categories[0]?.id,
        status: 'pending',
      });
      toast.success('✓ Nuevo compromiso fijo guardado');
    }

    setName('');
    setAmount('');
    setDueDay('15');
    setEditingExpense(null);
    setModalVisible(false);
  };

  const handleDeleteFixedExpense = () => {
    if (!editingExpense) return;
    Alert.alert(
      '¿Eliminar gasto fijo?',
      `¿Deseas eliminar "${editingExpense.name}"? Los movimientos ya pagados se mantendrán en el historial.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deleteFixedExpense(editingExpense.id);
            setModalVisible(false);
            setEditingExpense(null);
            toast.success('Gasto fijo eliminado');
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
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Gastos Fijos</Text>
          <JKButton
            title="+ Nuevo"
            onPress={handleOpenCreate}
            variant="primary"
            size="sm"
          />
        </View>

        {/* Tarjeta de Resumen de Fijos */}
        <View style={[styles.summaryCard, { backgroundColor: BrandColors.nightBlue }]}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>TOTAL COMPROMISOS</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalFixedAmount, currency)}</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>POR PAGAR ESTE MES</Text>
            <Text style={[styles.summaryValue, { color: pendingAmount > 0 ? BrandColors.skyBlue : BrandColors.success }]}>
              {formatCurrency(pendingAmount, currency)}
            </Text>
          </View>
        </View>
      </View>

      {/* Lista de Gastos Fijos */}
      <FlatList
        data={fixedExpenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const statusInfo = getStatusVariant(item.status);
          const cat = categoriesMap[item.category_id || ''];

          return (
            <View
              style={[
                styles.expenseCard,
                {
                  backgroundColor: theme.surfaceCard,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.nameBlock}>
                  <Text style={[styles.expenseName, { color: theme.textPrimary }]}>{item.name}</Text>
                  <Text style={[styles.dueInfo, { color: theme.textMuted }]}>
                    Vence el día {item.due_day} de cada mes
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <JKBadge label={statusInfo.label} variant={statusInfo.variant} />
                  <TouchableOpacity
                    onPress={() => handleOpenEdit(item)}
                    style={[styles.editIconBadge, { backgroundColor: `${BrandColors.deepBlue}12`, marginLeft: 8 }]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="pencil-outline" size={13} color={BrandColors.deepBlue} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={[styles.amountText, { color: theme.textPrimary }]}>
                  {formatCurrency(item.amount, currency)}
                </Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleToggleStatus(item)}
                  style={[
                    styles.actionPill,
                    {
                      backgroundColor:
                        item.status === 'paid' ? BrandColors.lightSky : BrandColors.deepBlue,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.status === 'paid' ? 'checkmark-circle' : 'cash-outline'}
                    size={16}
                    color={item.status === 'paid' ? BrandColors.nightBlue : '#FFFFFF'}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.actionPillText,
                      {
                        color: item.status === 'paid' ? BrandColors.nightBlue : '#FFFFFF',
                      },
                    ]}
                  >
                    {item.status === 'paid' ? 'Pagado' : 'Marcar Pagado'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <JKEmptyState
            title="Sin gastos fijos registrados"
            description="Registra pagos recurrentes como alquiler, internet o colegiatura para monitorear vencimientos."
            actionLabel="+ Registrar compromiso"
            onAction={handleOpenCreate}
          />
        }
      />

      {/* Modal Crear / Editar Gasto Fijo */}
      <JKModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingExpense(null);
        }}
        title={editingExpense ? 'Editar Compromiso Fijo' : 'Nuevo Compromiso Fijo'}
      >
        <JKInput
          label="Concepto del servicio"
          placeholder="Ej: Internet, Alquiler, Agua..."
          value={name}
          onChangeText={setName}
        />

        <JKAmountInput
          label="Monto mensual"
          amount={amount}
          onChangeAmount={setAmount}
          currencyPrefix={currency === 'DOP' ? 'RD$' : currency}
        />

        <JKInput
          label="Día de pago habitual (1 - 31)"
          placeholder="15"
          value={dueDay}
          onChangeText={setDueDay}
          keyboardType="numeric"
        />

        <JKButton
          title={editingExpense ? 'Guardar Cambios' : 'Guardar Gasto Fijo'}
          onPress={handleSaveFixedExpense}
          variant="primary"
          size="md"
          style={{ marginTop: Spacing.md }}
        />

        {editingExpense && (
          <JKButton
            title="Eliminar Gasto Fijo"
            onPress={handleDeleteFixedExpense}
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
  summaryCol: {
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
  expenseCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  nameBlock: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  expenseName: {
    fontSize: 16,
    fontWeight: '700',
  },
  dueInfo: {
    fontSize: 12,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  editIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
