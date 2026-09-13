// =====================================================================
// MODAL UNIVERSAL (+) FINTECH - REGISTRO RÁPIDO DE MOVIMIENTO
// Soporta: + Ingreso, − Gasto, ↔ Transferencia, ◎ Ahorro, ▣ Deuda
// Responsable: Joel | Kath | Compartido
// =====================================================================
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../../store/financeStore';
import { useAuthStore } from '../../store/authStore';
import { Colors, Radius } from '../../theme/designTokens';
import { Transaction, TransactionType, FamilyMemberName, TransactionOwner } from '../../types';
import { toast } from '../../components/common/JKToast';
import { parseAmount, formatCurrency } from '../../utils/currency';
import { getTodayDateString } from '../../utils/date';
import { Spacing } from '../../theme/spacing';

interface UniversalAddModalProps {
  visible: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  initialTransaction?: Transaction | null;
}

export const AddTransactionModal: React.FC<UniversalAddModalProps> = ({
  visible,
  onClose,
  initialType = 'expense',
  initialTransaction = null,
}) => {
  const {
    categories,
    accounts,
    savingGoals,
    addTransaction,
    updateTransaction,
    transferBetweenAccounts,
    depositToGoal,
  } = useFinanceStore();
  const { activeMember } = useAuthStore();

  const isEditing = !!initialTransaction;

  const [type, setType] = useState<TransactionType>(initialTransaction?.type || initialType);
  const [amount, setAmount] = useState(initialTransaction ? initialTransaction.amount.toString() : '');
  const [selectedPerson, setSelectedPerson] = useState<FamilyMemberName>(
    (initialTransaction?.user_name as FamilyMemberName) || activeMember || 'Joel'
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialTransaction?.category_id || '');
  const [selectedAccountId, setSelectedAccountId] = useState(
    initialTransaction?.account_id || accounts[0]?.id || ''
  );
  const [destinationAccountId, setDestinationAccountId] = useState(accounts[1]?.id || '');
  const [selectedGoalId, setSelectedGoalId] = useState(savingGoals[0]?.id || '');
  const [description, setDescription] = useState(initialTransaction?.description || '');
  const [date, setDate] = useState(initialTransaction?.date || getTodayDateString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const prevVisibleRef = useRef(visible);
  const prevTxIdRef = useRef<string | undefined>(initialTransaction?.id);

  useEffect(() => {
    const isOpening = visible && !prevVisibleRef.current;
    const isTxChanged = initialTransaction?.id !== prevTxIdRef.current;

    if (isOpening || isTxChanged) {
      if (initialTransaction) {
        setType(initialTransaction.type);
        setAmount(initialTransaction.amount ? initialTransaction.amount.toString() : '');
        setSelectedPerson((initialTransaction.user_name as FamilyMemberName) || 'Joel');
        setSelectedCategoryId(initialTransaction.category_id || '');
        setSelectedAccountId(initialTransaction.account_id || accounts[0]?.id || '');
        setDestinationAccountId(initialTransaction.destination_account_id || accounts[1]?.id || '');
        setDescription(initialTransaction.description || '');
        setDate(initialTransaction.date || getTodayDateString());
      } else {
        setType(initialType || 'expense');
        setAmount('');
        setSelectedPerson(activeMember === 'Kath' || activeMember === 'Kat' ? 'Kath' : 'Joel');
        setSelectedCategoryId('');
        setSelectedAccountId(accounts[0]?.id || '');
        setDestinationAccountId(accounts[1]?.id || '');
        setSelectedGoalId(savingGoals[0]?.id || '');
        setDescription('');
        setDate(getTodayDateString());
      }
    }
    prevVisibleRef.current = visible;
    prevTxIdRef.current = initialTransaction?.id;
  }, [visible, initialTransaction, initialType, activeMember, accounts, savingGoals]);

  // Selección automática de primera categoría adecuada
  useEffect(() => {
    if (!selectedCategoryId && categories.length > 0) {
      const match = categories.find((c) => c.type === (type === 'income' ? 'income' : 'expense'));
      if (match) setSelectedCategoryId(match.id);
    }
  }, [type, categories, selectedCategoryId]);

  const handleSubmit = async () => {
    const parsed = parseAmount(amount);
    if (!parsed || parsed <= 0) {
      toast.error('Por favor ingresa un monto válido mayor a cero');
      return;
    }

    // Mapeo de responsable
    let owner: TransactionOwner = 'shared';
    if (selectedPerson === 'Joel') owner = 'joel';
    else if (selectedPerson === 'Kath' || selectedPerson === 'Kat') owner = 'kath';
    else owner = 'shared';

    setIsSubmitting(true);
    try {
      if (type === 'transfer') {
        if (!selectedAccountId || !destinationAccountId) {
          toast.error('Selecciona la cuenta de origen y de destino');
          setIsSubmitting(false);
          return;
        }
        if (selectedAccountId === destinationAccountId) {
          toast.error('La cuenta de origen y destino deben ser diferentes');
          setIsSubmitting(false);
          return;
        }
        await transferBetweenAccounts(
          selectedAccountId,
          destinationAccountId,
          parsed,
          description || 'Transferencia entre cuentas',
          selectedPerson
        );
        toast.success(`Transferencia de ${formatCurrency(parsed, 'DOP')} realizada`);
        onClose();
        return;
      }

      if (type === 'savings') {
        if (selectedGoalId) {
          await depositToGoal(selectedGoalId, parsed, selectedPerson, selectedAccountId);
          toast.success(`Aporte de ${formatCurrency(parsed, 'DOP')} guardado en meta`);
          onClose();
          return;
        }
      }

      if (isEditing && initialTransaction) {
        await updateTransaction(initialTransaction.id, {
          type,
          amount: parsed,
          user_name: selectedPerson,
          owner,
          category_id: selectedCategoryId || undefined,
          account_id: selectedAccountId || undefined,
          description: description.trim() || undefined,
          date,
        });
        toast.success('Movimiento actualizado');
      } else {
        await addTransaction({
          household_id: 'hh-joel-kat-01',
          type,
          amount: parsed,
          user_name: selectedPerson,
          owner,
          category_id: selectedCategoryId || undefined,
          account_id: selectedAccountId || undefined,
          description: description.trim() || undefined,
          date,
        });
        toast.success('Movimiento registrado con éxito');
      }
      onClose();
    } catch (err: any) {
      toast.error('Error al guardar: ' + (err?.message || 'Error desconocido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCategories = categories.filter((c) =>
    type === 'income' ? c.type === 'income' : c.type === 'expense'
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View
          style={[
            styles.modalContent,
            Platform.OS === 'web' ? ({
              backdropFilter: 'blur(25px)',
              WebkitBackdropFilter: 'blur(25px)',
            } as any) : null,
          ]}
        >
          {/* Header con botón cerrar */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Editar Movimiento' : 'Nuevo Movimiento'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={Colors.ivoryWhite} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* 1. Selector de Tipo (5 opciones) */}
            <View style={styles.typeSelectorRow}>
              {[
                { id: 'expense', label: '− Gasto', color: Colors.expense },
                { id: 'income', label: '+ Ingreso', color: Colors.income },
                { id: 'transfer', label: '↔ Transfer', color: Colors.transfer },
                { id: 'savings', label: '◎ Ahorro', color: Colors.savings },
                { id: 'debt', label: '▣ Deuda', color: Colors.debt },
              ].map((t) => {
                const isSelected = type === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    activeOpacity={0.8}
                    onPress={() => setType(t.id as TransactionType)}
                    style={[
                      styles.typeChip,
                      isSelected && {
                        backgroundColor: t.color,
                        borderColor: t.color,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        isSelected && { color: Colors.darkNavy, fontWeight: '800' },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. Campo de Monto Principal */}
            <View style={styles.amountContainer}>
              <Text style={styles.amountCurrencyPrefix}>RD$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="rgba(248, 245, 236, 0.35)"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                autoFocus={!isEditing}
              />
            </View>

            {/* 3. Selección de Meta si es Ahorro */}
            {type === 'savings' && savingGoals.length > 0 ? (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>META DE AHORRO</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
                  {savingGoals.map((g) => {
                    const isSelected = selectedGoalId === g.id;
                    return (
                      <TouchableOpacity
                        key={g.id}
                        activeOpacity={0.8}
                        onPress={() => setSelectedGoalId(g.id)}
                        style={[
                          styles.categoryChip,
                          isSelected && styles.categoryChipActive,
                        ]}
                      >
                        <Ionicons
                          name={(g.icon as any) || 'flag'}
                          size={14}
                          color={isSelected ? Colors.darkNavy : Colors.ivoryWhite}
                          style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                          {g.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {/* 4. Categoría (para Gasto, Ingreso o Deuda) */}
            {type !== 'transfer' && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>CATEGORÍA</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
                  {currentCategories.map((c) => {
                    const isSelected = selectedCategoryId === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        activeOpacity={0.8}
                        onPress={() => setSelectedCategoryId(c.id)}
                        style={[
                          styles.categoryChip,
                          isSelected && styles.categoryChipActive,
                        ]}
                      >
                        <Ionicons
                          name={(c.icon as any) || 'pricetag'}
                          size={14}
                          color={isSelected ? Colors.darkNavy : Colors.ivoryWhite}
                          style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* 5. Responsable: Joel / Kath / Compartido */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>RESPONSABLE</Text>
              <View style={styles.personRow}>
                {[
                  { id: 'Joel', label: 'Joel', icon: 'person' },
                  { id: 'Kath', label: 'Kath', icon: 'sparkles' },
                  { id: 'Compartido', label: 'Compartido', icon: 'people' },
                ].map((p) => {
                  const isSelected = selectedPerson === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      activeOpacity={0.8}
                      onPress={() => setSelectedPerson(p.id as FamilyMemberName)}
                      style={[
                        styles.personChip,
                        isSelected && styles.personChipActive,
                      ]}
                    >
                      <Ionicons
                        name={p.icon as any}
                        size={14}
                        color={isSelected ? Colors.darkNavy : Colors.ivoryWhite}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.personChipText, isSelected && styles.personChipTextActive]}>
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 6. Fecha y Cuenta */}
            <View style={styles.twoColsRow}>
              {/* Fecha */}
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionLabel}>FECHA</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="calendar-outline" size={16} color={Colors.secondaryGreen} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.textInputSmall}
                    value={date}
                    onChangeText={setDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="rgba(248, 245, 236, 0.4)"
                  />
                </View>
              </View>

              {/* Cuenta Origen */}
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionLabel}>CUENTA</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="card-outline" size={16} color={Colors.secondaryGreen} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.textInputSmall}
                    value={accounts.find((a) => a.id === selectedAccountId)?.name || 'Cuenta'}
                    editable={false}
                  />
                </View>
              </View>
            </View>

            {/* Cuenta Destino (Solo si es Transferencia) */}
            {type === 'transfer' ? (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>CUENTA DESTINO</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
                  {accounts
                    .filter((a) => a.id !== selectedAccountId)
                    .map((a) => {
                      const isSelected = destinationAccountId === a.id;
                      return (
                        <TouchableOpacity
                          key={a.id}
                          activeOpacity={0.8}
                          onPress={() => setDestinationAccountId(a.id)}
                          style={[
                            styles.categoryChip,
                            isSelected && styles.categoryChipActive,
                          ]}
                        >
                          <Ionicons
                            name="arrow-forward-circle-outline"
                            size={14}
                            color={isSelected ? Colors.darkNavy : Colors.ivoryWhite}
                            style={{ marginRight: 6 }}
                          />
                          <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                            {a.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>
              </View>
            ) : null}

            {/* 7. Descripción Opcional */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>DESCRIPCIÓN (OPCIONAL)</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInputFull}
                  placeholder="Ej. Supermercado Nacional, Cena familiar..."
                  placeholderTextColor="rgba(248, 245, 236, 0.4)"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </View>

            {/* 8. Botón Guardar */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={styles.saveBtn}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={Colors.darkNavy} style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>
                {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Registrar Movimiento'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 24, 39, 0.82)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'rgba(16, 42, 67, 0.95)',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.ivoryWhite,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.ivoryWhite,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: Radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    marginBottom: 18,
  },
  amountCurrencyPrefix: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.secondaryGreen,
    marginRight: 8,
  },
  amountInput: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.ivoryWhite,
    flex: 1,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.ivoryTranslucent,
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  horizontalChips: {
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 13,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  categoryChipActive: {
    backgroundColor: Colors.secondaryGreen,
    borderColor: Colors.secondaryGreen,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.ivoryWhite,
  },
  categoryChipTextActive: {
    color: Colors.darkNavy,
    fontWeight: '800',
  },
  personRow: {
    flexDirection: 'row',
    gap: 8,
  },
  personChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  personChipActive: {
    backgroundColor: Colors.secondaryGreen,
    borderColor: Colors.secondaryGreen,
  },
  personChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ivoryWhite,
  },
  personChipTextActive: {
    color: Colors.darkNavy,
    fontWeight: '800',
  },
  twoColsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  textInputSmall: {
    fontSize: 13,
    color: Colors.ivoryWhite,
    fontWeight: '600',
    flex: 1,
  },
  textInputFull: {
    fontSize: 13,
    color: Colors.ivoryWhite,
    fontWeight: '500',
    flex: 1,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondaryGreen,
    borderRadius: Radius.md,
    paddingVertical: 14,
    marginTop: 8,
    shadowColor: Colors.secondaryGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.darkNavy,
    letterSpacing: 0.2,
  },
});
