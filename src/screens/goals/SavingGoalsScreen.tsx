// Pantalla de Metas de Ahorro Familiares
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../../store/financeStore';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { BrandColors } from '../../theme/colors';
import { SavingGoal } from '../../types';
import { JKProgressBar } from '../../components/common/JKProgressBar';
import { JKButton } from '../../components/common/JKButton';
import { JKModal } from '../../components/common/JKModal';
import { JKInput } from '../../components/common/JKInput';
import { JKAmountInput } from '../../components/common/JKAmountInput';
import { JKEmptyState } from '../../components/common/JKEmptyState';
import { toast } from '../../components/common/JKToast';
import { formatCurrency } from '../../utils/currency';
import { Spacing, BorderRadius } from '../../theme/spacing';

export const SavingGoalsScreen: React.FC = () => {
  const {
    savingGoals,
    accounts,
    addSavingGoal,
    updateSavingGoal,
    deleteSavingGoal,
    moveSavingGoal,
    depositToGoal,
  } = useFinanceStore();
  const { activeMember } = useAuthStore();
  const { theme, currency } = useThemeStore();

  // Estados de modales
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [activeGoal, setActiveGoal] = useState<SavingGoal | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositAccountId, setDepositAccountId] = useState(accounts[0]?.id || '');

  // Formulario meta
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');

  const totalTarget = savingGoals.reduce((sum, g) => sum + g.target_amount, 0);
  const totalSaved = savingGoals.reduce((sum, g) => sum + g.current_amount, 0);
  const overallPercent = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const handleOpenDeposit = (goal: SavingGoal) => {
    setActiveGoal(goal);
    setDepositAmount('');
    setDepositModalVisible(true);
  };

  const handleOpenCreateGoal = () => {
    setEditingGoal(null);
    setGoalName('');
    setGoalTarget('');
    setGoalCurrent('0');
    setGoalModalVisible(true);
  };

  const handleOpenEditGoal = (goal: SavingGoal) => {
    setEditingGoal(goal);
    setGoalName(goal.name);
    setGoalTarget(goal.target_amount.toString());
    setGoalCurrent(goal.current_amount.toString());
    setGoalModalVisible(true);
  };

  const handleConfirmDeposit = () => {
    if (!activeGoal) return;
    const num = parseFloat(depositAmount);
    if (!num || num <= 0) {
      Alert.alert('Monto requerido', 'Ingresa una cantidad válida para aportar a la meta.');
      return;
    }

    depositToGoal(activeGoal.id, num, activeMember, depositAccountId || accounts[0]?.id);
    setDepositModalVisible(false);
    setActiveGoal(null);
    setDepositAmount('');
    toast.success(`✓ Aporte de ${formatCurrency(num, currency)} registrado`);
  };

  const handleSaveGoal = () => {
    const target = parseFloat(goalTarget);
    const current = parseFloat(goalCurrent) || 0;

    if (!goalName.trim()) {
      Alert.alert('Nombre requerido', 'Por favor ingresa un nombre para la meta.');
      return;
    }
    if (!target || target <= 0) {
      Alert.alert('Monto meta inválido', 'Ingresa un objetivo monetario válido.');
      return;
    }

    if (editingGoal) {
      updateSavingGoal(editingGoal.id, {
        name: goalName.trim(),
        target_amount: target,
        current_amount: current,
      });
      toast.success('✓ Meta actualizada');
    } else {
      addSavingGoal({
        household_id: 'hh-joel-kat-01',
        name: goalName.trim(),
        target_amount: target,
        current_amount: current,
        icon: 'flag',
        color: BrandColors.skyBlue,
      });
      toast.success('✓ Meta de ahorro creada');
    }

    setGoalModalVisible(false);
    setEditingGoal(null);
    setGoalName('');
    setGoalTarget('');
    setGoalCurrent('');
  };

  const handleDeleteGoal = () => {
    if (!editingGoal) return;
    Alert.alert(
      '¿Eliminar meta de ahorro?',
      `¿Deseas eliminar "${editingGoal.name}"? Los fondos ahorrados permanecerán en sus respectivas cuentas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deleteSavingGoal(editingGoal.id);
            setGoalModalVisible(false);
            setEditingGoal(null);
            toast.success('Meta eliminada');
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
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Metas de Ahorro</Text>
          <JKButton
            title="+ Nueva Meta"
            onPress={handleOpenCreateGoal}
            variant="primary"
            size="sm"
          />
        </View>

        {/* Hero Card Metas */}
        <View style={[styles.summaryCard, { backgroundColor: BrandColors.nightBlue }]}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>TOTAL AHORRADO</Text>
            <Text style={[styles.summaryValue, { color: BrandColors.skyBlue }]}>
              {formatCurrency(totalSaved, currency)}
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>OBJETIVO GLOBAL</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalTarget, currency)}</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>PROGRESO</Text>
            <Text style={[styles.summaryValue, { color: BrandColors.success }]}>{overallPercent}%</Text>
          </View>
        </View>
      </View>

      {/* Lista de Metas */}
      <FlatList
        data={savingGoals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => {
          const percent =
            item.target_amount > 0
              ? Math.min(100, Math.round((item.current_amount / item.target_amount) * 100))
              : 0;

          return (
            <View
              style={[
                styles.goalCard,
                {
                  backgroundColor: theme.surfaceCard,
                  borderColor: index === 0 ? BrandColors.skyBlue : theme.border,
                },
              ]}
            >
              {/* Barra superior de prioridad y desplazamiento arriba/abajo */}
              <View style={styles.cardHeaderTop}>
                <View
                  style={[
                    styles.priorityPill,
                    {
                      backgroundColor: index === 0 ? '#FEF3C7' : theme.surfaceCardAlt,
                      borderColor: index === 0 ? '#F59E0B' : theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={index === 0 ? 'star' : 'flag'}
                    size={12}
                    color={index === 0 ? '#D97706' : BrandColors.deepBlue}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.priorityText,
                      { color: index === 0 ? '#92400E' : BrandColors.deepBlue },
                    ]}
                  >
                    #{index + 1} {index === 0 ? 'Prioridad Máxima' : 'Prioridad'}
                  </Text>
                </View>

                {/* Botones para desplazar arriba o abajo */}
                <View style={styles.reorderButtonsRow}>
                  <TouchableOpacity
                    disabled={index === 0}
                    onPress={() => moveSavingGoal(item.id, 'up')}
                    style={[
                      styles.reorderBtn,
                      index === 0 && styles.reorderBtnDisabled,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  >
                    <Ionicons
                      name="arrow-up"
                      size={14}
                      color={index === 0 ? theme.border : BrandColors.deepBlue}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={index === savingGoals.length - 1}
                    onPress={() => moveSavingGoal(item.id, 'down')}
                    style={[
                      styles.reorderBtn,
                      index === savingGoals.length - 1 && styles.reorderBtnDisabled,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  >
                    <Ionicons
                      name="arrow-down"
                      size={14}
                      color={index === savingGoals.length - 1 ? theme.border : BrandColors.deepBlue}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.cardHeader}>
                <View style={styles.titleIconRow}>
                  <View style={[styles.iconCircle, { backgroundColor: `${item.color}20` }]}>
                    <Ionicons name="flag" size={18} color={item.color} />
                  </View>
                  <View>
                    <Text style={[styles.goalName, { color: theme.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.goalSub, { color: theme.textMuted }]}>
                      Meta: {formatCurrency(item.target_amount, currency)}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.percentBadge, { color: BrandColors.deepBlue }]}>{percent}%</Text>
                  <TouchableOpacity
                    onPress={() => handleOpenEditGoal(item)}
                    style={[styles.editIconBadge, { backgroundColor: `${BrandColors.deepBlue}12`, marginLeft: 8 }]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="pencil-outline" size={13} color={BrandColors.deepBlue} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Barra de Progreso */}
              <View style={styles.progressBlock}>
                <JKProgressBar progress={percent} height={10} color={item.color} />
              </View>

              <View style={styles.amountsRow}>
                <Text style={[styles.savedAmount, { color: theme.textPrimary }]}>
                  Ahorrado: {formatCurrency(item.current_amount, currency)}
                </Text>
                <Text style={[styles.remainingAmount, { color: theme.textSecondary }]}>
                  Faltan: {formatCurrency(Math.max(0, item.target_amount - item.current_amount), currency)}
                </Text>
              </View>

              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleOpenDeposit(item)}
                  style={[styles.depositBtn, { backgroundColor: BrandColors.deepBlue }]}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.depositBtnText}>Aportar a esta meta</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <JKEmptyState
            title="Sin metas de ahorro"
            description="Establece objetivos compartidos (vivienda, viajes, emergencias) para motivar el ahorro conjunto."
            actionLabel="+ Crear primera meta"
            onAction={handleOpenCreateGoal}
          />
        }
      />

      {/* Modal Aportar a Meta */}
      <JKModal
        visible={depositModalVisible}
        onClose={() => setDepositModalVisible(false)}
        title={activeGoal ? `Aportar a "${activeGoal.name}"` : 'Aportar a Meta'}
      >
        <Text style={[styles.depositModalSub, { color: theme.textSecondary }]}>
          Aporte registrado por: <Text style={{ fontWeight: '700' }}>{activeMember}</Text>
        </Text>

        <JKAmountInput
          label="Monto a aportar"
          amount={depositAmount}
          onChangeAmount={setDepositAmount}
          currencyPrefix={currency === 'DOP' ? 'RD$' : currency}
        />

        {accounts.length > 0 && (
          <View style={{ marginVertical: Spacing.sm }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 6 }}>
              Debitar de la cuenta:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {accounts.map((acc) => {
                const isSelected = (depositAccountId || accounts[0]?.id) === acc.id;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    onPress={() => setDepositAccountId(acc.id)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: BorderRadius.md,
                      borderWidth: 1,
                      borderColor: isSelected ? BrandColors.deepBlue : theme.border,
                      backgroundColor: isSelected ? BrandColors.deepBlue : theme.surface,
                      marginRight: 8,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: isSelected ? '#FFFFFF' : theme.textPrimary }}>
                      {acc.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <JKButton
          title="Confirmar Depósito a la Meta"
          onPress={handleConfirmDeposit}
          variant="primary"
          size="md"
          style={{ marginTop: Spacing.md }}
        />
      </JKModal>

      {/* Modal Crear / Editar Meta */}
      <JKModal
        visible={goalModalVisible}
        onClose={() => {
          setGoalModalVisible(false);
          setEditingGoal(null);
        }}
        title={editingGoal ? 'Editar Meta de Ahorro' : 'Crear Nueva Meta Familiar'}
      >
        <JKInput
          label="Nombre del objetivo"
          placeholder="Ej: Inicial vivienda, Viaje a Europa..."
          value={goalName}
          onChangeText={setGoalName}
        />

        <JKAmountInput
          label="Monto total del objetivo"
          amount={goalTarget}
          onChangeAmount={setGoalTarget}
          currencyPrefix={currency === 'DOP' ? 'RD$' : currency}
        />

        <JKAmountInput
          label={editingGoal ? 'Monto ahorrado actual' : 'Monto inicial ahorrado (opcional)'}
          amount={goalCurrent}
          onChangeAmount={setGoalCurrent}
          currencyPrefix={currency === 'DOP' ? 'RD$' : currency}
        />

        <JKButton
          title={editingGoal ? 'Guardar Cambios' : 'Crear Meta de Ahorro'}
          onPress={handleSaveGoal}
          variant="primary"
          size="md"
          style={{ marginTop: Spacing.md }}
        />

        {editingGoal && (
          <JKButton
            title="Eliminar Meta"
            onPress={handleDeleteGoal}
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
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 90,
  },
  goalCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  titleIconRow: {
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
  goalName: {
    fontSize: 16,
    fontWeight: '700',
  },
  goalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  percentBadge: {
    fontSize: 18,
    fontWeight: '800',
  },
  editIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBlock: {
    marginVertical: Spacing.xs,
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  savedAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  remainingAmount: {
    fontSize: 12,
  },
  cardActionsRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: Spacing.sm,
  },
  depositBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  depositBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  depositModalSub: {
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  deductionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  deductionBannerText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  cardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  priorityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  reorderButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reorderBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  reorderBtnDisabled: {
    opacity: 0.35,
  },
});
