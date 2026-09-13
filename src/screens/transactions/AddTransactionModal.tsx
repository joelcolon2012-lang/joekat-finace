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
import { useThemeStore } from '../../store/themeStore';
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
  const { isDarkMode } = useThemeStore();

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
        style={[styles.modalOverlay, !isDarkMode && { backgroundColor: 'rgba(7, 24, 39, 0.45)' }]}
      >
        <View
          style={[
            styles.modalContent,
            !isDarkMode && styles.modalContentLight,
            Platform.OS === 'web' ? ({
              backdropFilter: 'blur(25px)',
              WebkitBackdropFilter: 'blur(25px)',
            } as any) : null,
          ]}
        >
          {/* Header con botón cerrar */}
          <View style={[styles.modalHeader, !isDarkMode && { borderBottomColor: 'rgba(0, 0, 0, 0.08)' }]}>
            <Text style={[styles.modalTitle, !isDarkMode && { color: '#071827' }]}>
              {isEditing ? 'Editar Movimiento' : 'Nuevo Movimiento'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, !isDarkMode && { backgroundColor: 'rgba(0, 0, 0, 0.06)' }]}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={!isDarkMode ? '#071827' : Colors.ivoryWhite} />
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
                      !isDarkMode && styles.typeChipLight,
                      isSelected && {
                        backgroundColor: t.color,
                        borderColor: t.color,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        !isDarkMode && !isSelected && { color: '#071827' },
                        isSelected && { color: '#FFFFFF', fontWeight: '800' },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. Campo de Monto Principal */}
            <View style={[styles.amountContainer, !isDarkMode && styles.amountContainerLight]}>
              <Text style={[styles.amountCurrencyPrefix, !isDarkMode && { color: '#0F766E' }]}>RD$</Text>
              <TextInput
                style={[styles.amountInput, !isDarkMode && { color: '#071827' }]}
                placeholder="0.00"
                placeholderTextColor={!isDarkMode ? '#94A3B8' : 'rgba(248, 245, 236, 0.35)'}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                autoFocus={!isEditing}
              />
            </View>

            {/* 3. Selección de Meta si es Ahorro */}
            {type === 'savings' && savingGoals.length > 0 ? (
              <View style={styles.sectionBlock}>
                <Text style={[styles.sectionLabel, !isDarkMode && { color: '#64748B' }]}>META DE AHORRO</Text>
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
                          !isDarkMode && styles.categoryChipLight,
                          isSelected && styles.categoryChipActive,
                        ]}
                      >
                        <Ionicons
                          name={(g.icon as any) || 'flag'}
                          size={14}
                          color={isSelected ? Colors.darkNavy : !isDarkMode ? '#0F766E' : Colors.ivoryWhite}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            styles.categoryChipText,
                            !isDarkMode && !isSelected && { color: '#071827' },
                            isSelected && styles.categoryChipTextActive,
                          ]}
                        >
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
                <Text style={[styles.sectionLabel, !isDarkMode && { color: '#64748B' }]}>CATEGORÍA</Text>
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
                          !isDarkMode && styles.categoryChipLight,
                          isSelected && styles.categoryChipActive,
                        ]}
                      >
                        <Ionicons
                          name={(c.icon as any) || 'pricetag'}
                          size={14}
                          color={isSelected ? Colors.darkNavy : !isDarkMode ? '#0F766E' : Colors.ivoryWhite}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            styles.categoryChipText,
                            !isDarkMode && !isSelected && { color: '#071827' },
                            isSelected && styles.categoryChipTextActive,
                          ]}
                        >
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
              <Text style={[styles.sectionLabel, !isDarkMode && { color: '#64748B' }]}>RESPONSABLE</Text>
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
                        !isDarkMode && styles.personChipLight,
                        isSelected && styles.personChipActive,
                      ]}
                    >
                      <Ionicons
                        name={p.icon as any}
                        size={14}
                        color={isSelected ? Colors.darkNavy : !isDarkMode ? '#0F766E' : Colors.ivoryWhite}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.personChipText,
                          !isDarkMode && !isSelected && { color: '#071827' },
                          isSelected && styles.personChipTextActive,
                        ]}
                      >
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
                <Text style={[styles.sectionLabel, !isDarkMode && { color: '#64748B' }]}>FECHA</Text>
                <View style={[styles.inputBox, !isDarkMode && styles.inputBoxLight]}>
                  <Ionicons name="calendar-outline" size={16} color={!isDarkMode ? '#0F766E' : Colors.secondaryGreen} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.textInputSmall, !isDarkMode && { color: '#071827' }]}
                    value={date}
                    onChangeText={setDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={!isDarkMode ? '#94A3B8' : 'rgba(248, 245, 236, 0.4)'}
                  />
                </View>
              </View>

              {/* Cuenta Origen */}
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionLabel, !isDarkMode && { color: '#64748B' }]}>CUENTA</Text>
                <View style={[styles.inputBox, !isDarkMode && styles.inputBoxLight]}>
                  <Ionicons name="card-outline" size={16} color={!isDarkMode ? '#0F766E' : Colors.secondaryGreen} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.textInputSmall, !isDarkMode && { color: '#071827' }]}
                    value={accounts.find((a) => a.id === selectedAccountId)?.name || 'Cuenta'}
                    editable={false}
                  />
                </View>
              </View>
            </View>

            {/* Cuenta Destino (Solo si es Transferencia) */}
            {type === 'transfer' ? (
              <View style={styles.sectionBlock}>
                <Text style={[styles.sectionLabel, !isDarkMode && { color: '#64748B' }]}>CUENTA DESTINO</Text>
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
                            !isDarkMode && styles.categoryChipLight,
                            isSelected && styles.categoryChipActive,
                          ]}
                        >
                          <Ionicons
                            name="arrow-forward-circle-outline"
                            size={14}
                            color={isSelected ? Colors.darkNavy : !isDarkMode ? '#0F766E' : Colors.ivoryWhite}
                            style={{ marginRight: 6 }}
                          />
                          <Text
                            style={[
                              styles.categoryChipText,
                              !isDarkMode && !isSelected && { color: '#071827' },
                              isSelected && styles.categoryChipTextActive,
                            ]}
                          >
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
              <Text style={[styles.sectionLabel, !isDarkMode && { color: '#64748B' }]}>DESCRIPCIÓN (OPCIONAL)</Text>
              <View style={[styles.inputBox, !isDarkMode && styles.inputBoxLight]}>
                <TextInput
                  style={[styles.textInputFull, !isDarkMode && { color: '#071827' }]}
                  placeholder="Ej. Supermercado Nacional, Cena familiar..."
                  placeholderTextColor={!isDarkMode ? '#94A3B8' : 'rgba(248, 245, 236, 0.4)'}
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
              style={[styles.saveBtn, !isDarkMode && styles.saveBtnLight]}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={!isDarkMode ? '#FFFFFF' : Colors.darkNavy} style={{ marginRight: 8 }} />
              <Text style={[styles.saveBtnText, !isDarkMode && { color: '#FFFFFF' }]}>
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
  saveBtnLight: {
    backgroundColor: '#0F766E',
    shadowColor: '#0F766E',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.darkNavy,
    letterSpacing: 0.2,
  },
  modalContentLight: {
    backgroundColor: 'rgba(248, 245, 236, 0.98)',
    borderColor: 'rgba(7, 24, 39, 0.08)',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 24,
  },
  typeChipLight: {
    backgroundColor: '#EDE8DE',
    borderColor: 'rgba(7, 24, 39, 0.08)',
  },
  amountContainerLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(7, 24, 39, 0.08)',
  },
  categoryChipLight: {
    backgroundColor: '#EDE8DE',
    borderColor: 'rgba(7, 24, 39, 0.08)',
  },
  personChipLight: {
    backgroundColor: '#EDE8DE',
    borderColor: 'rgba(7, 24, 39, 0.08)',
  },
  inputBoxLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(7, 24, 39, 0.08)',
  },
});
