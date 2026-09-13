// =====================================================================
// MODAL UNIVERSAL (+) FINTECH - REGISTRO RÁPIDO DE MOVIMIENTO
// Soporta: + Ingreso, − Gasto, ↔ Transferencia, ◎ Ahorro, ▣ Deuda
// Optimizado para iPhone (iOS Safari & PWA) y tema Blanco Marfil
// =====================================================================
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '../../store/financeStore';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { Colors, Radius } from '../../theme/designTokens';
import { Transaction, TransactionType, FamilyMemberName, TransactionOwner } from '../../types';
import { toast } from '../../components/common/JKToast';
import { parseAmount, formatCurrency } from '../../utils/currency';
import { getTodayDateString, getYesterdayDateString, isToday, isYesterday } from '../../utils/date';
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
  const [destinationAccountId, setDestinationAccountId] = useState(
    initialTransaction?.destination_account_id || (accounts[1]?.id || '')
  );
  const [selectedGoalId, setSelectedGoalId] = useState(savingGoals[0]?.id || '');
  const [description, setDescription] = useState(initialTransaction?.description || '');
  const [date, setDate] = useState(initialTransaction?.date || getTodayDateString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const prevVisibleRef = useRef(visible);
  const prevTxIdRef = useRef<string | undefined>(initialTransaction?.id);

  // Inicialización al abrir modal o cambiar transacción
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
        const startType = initialType || 'expense';
        setType(startType);
        setAmount('');
        const defaultPerson = activeMember === 'Kath' || activeMember === 'Kat' ? 'Kath' : 'Joel';
        setSelectedPerson(defaultPerson);

        // Cuenta por defecto según miembro
        const memberAccount = accounts.find((a) =>
          defaultPerson === 'Kath' ? a.type === 'kath' : a.type === 'joel'
        );
        setSelectedAccountId(memberAccount?.id || accounts[0]?.id || '');
        setDestinationAccountId(accounts.find((a) => a.id !== (memberAccount?.id || accounts[0]?.id))?.id || '');
        setSelectedGoalId(savingGoals[0]?.id || '');
        setDescription('');
        setDate(getTodayDateString());

        // Asignar primera categoría acorde al tipo
        const initialCats = categories.filter((c) =>
          startType === 'income' ? c.type === 'income' : c.type === 'expense'
        );
        setSelectedCategoryId(initialCats[0]?.id || '');
      }
    }
    prevVisibleRef.current = visible;
    prevTxIdRef.current = initialTransaction?.id;
  }, [visible, initialTransaction, initialType, activeMember, accounts, savingGoals, categories]);

  // Lista de categorías actuales según el tipo
  const currentCategories = useMemo(() => {
    return categories.filter((c) =>
      type === 'income' ? c.type === 'income' : c.type === 'expense'
    );
  }, [categories, type]);

  // Sincronización automática de categoría al cambiar tipo (evita desfase entre Gasto e Ingreso)
  useEffect(() => {
    if (type === 'transfer' || type === 'savings') return;
    const isValidForType = currentCategories.some((c) => c.id === selectedCategoryId);
    if (!isValidForType && currentCategories.length > 0) {
      setSelectedCategoryId(currentCategories[0].id);
    }
  }, [type, currentCategories, selectedCategoryId]);

  // Manejo de cambio de responsable: sugiere cuenta correspondiente
  const handleSelectPerson = (person: FamilyMemberName) => {
    setSelectedPerson(person);
    if (person === 'Joel') {
      const joelAcc = accounts.find((a) => a.type === 'joel');
      if (joelAcc && accounts.find((a) => a.id === selectedAccountId)?.type === 'kath') {
        setSelectedAccountId(joelAcc.id);
      }
    } else if (person === 'Kath') {
      const kathAcc = accounts.find((a) => a.type === 'kath');
      if (kathAcc && accounts.find((a) => a.id === selectedAccountId)?.type === 'joel') {
        setSelectedAccountId(kathAcc.id);
      }
    } else if (person === 'Compartido') {
      const jointAcc = accounts.find((a) => a.type === 'conjunta');
      if (jointAcc && (selectedAccountId === '' || accounts.find((a) => a.id === selectedAccountId)?.type !== 'conjunta')) {
        setSelectedAccountId(jointAcc.id);
      }
    }
  };

  // Botón rápido de adición de monto (+100, +500, +1,000, etc.)
  const handleQuickAddAmount = (inc: number) => {
    const current = parseAmount(amount) || 0;
    const next = current + inc;
    setAmount(next.toString());
  };

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

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        style={[styles.modalOverlay, !isDarkMode && { backgroundColor: 'rgba(7, 24, 39, 0.50)' }]}
      >
        {/* Fondo táctil para cerrar */}
        <TouchableOpacity
          style={styles.backdropTouchArea}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.modalContent,
            !isDarkMode && styles.modalContentLight,
            Platform.OS === 'web' ? ({
              backdropFilter: 'blur(25px)',
              WebkitBackdropFilter: 'blur(25px)',
              maxHeight: '92vh',
            } as any) : null,
          ]}
        >
          {/* Barra superior / Indicador de agarre estilo iOS */}
          <View style={styles.sheetHandleContainer}>
            <View style={[styles.sheetHandle, !isDarkMode && { backgroundColor: 'rgba(7, 24, 39, 0.18)' }]} />
          </View>

          {/* Header con título y botón cerrar */}
          <View style={[styles.modalHeader, !isDarkMode && { borderBottomColor: 'rgba(7, 24, 39, 0.08)' }]}>
            <Text style={[styles.modalTitle, !isDarkMode && { color: '#071827' }]}>
              {isEditing ? 'Editar Movimiento' : 'Nuevo Movimiento'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, !isDarkMode && { backgroundColor: 'rgba(7, 24, 39, 0.06)' }]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={!isDarkMode ? '#071827' : Colors.ivoryWhite} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollBody}
          >
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
                onChangeText={(val) => {
                  const sanitized = val.replace(/[^0-9.,]/g, '');
                  setAmount(sanitized);
                }}
              />
            </View>

            {/* Chips de Incremento Rápido de Monto */}
            <View style={styles.quickAmountRow}>
              {[100, 500, 1000, 5000].map((inc) => (
                <TouchableOpacity
                  key={inc}
                  activeOpacity={0.7}
                  onPress={() => handleQuickAddAmount(inc)}
                  style={[styles.quickAmountChip, !isDarkMode && styles.quickAmountChipLight]}
                >
                  <Text style={[styles.quickAmountText, !isDarkMode && { color: '#0F766E' }]}>
                    +{inc >= 1000 ? `${inc / 1000}k` : inc}
                  </Text>
                </TouchableOpacity>
              ))}
              {amount !== '' && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setAmount('')}
                  style={[styles.quickAmountChip, styles.quickAmountChipClear]}
                >
                  <Ionicons name="backspace-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                  <Text style={styles.quickAmountClearText}>Borrar</Text>
                </TouchableOpacity>
              )}
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
                          color={isSelected ? '#FFFFFF' : !isDarkMode ? '#0F766E' : Colors.ivoryWhite}
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
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionLabel, !isDarkMode && { color: '#64748B' }]}>CATEGORÍA</Text>
                  <Text style={[styles.sectionSubHint, !isDarkMode && { color: '#94A3B8' }]}>
                    {type === 'income' ? 'Fuentes de Ingreso' : 'Rubros de Gasto'}
                  </Text>
                </View>
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
                          color={isSelected ? '#FFFFFF' : !isDarkMode ? '#0F766E' : Colors.ivoryWhite}
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
                      onPress={() => handleSelectPerson(p.id as FamilyMemberName)}
                      style={[
                        styles.personChip,
                        !isDarkMode && styles.personChipLight,
                        isSelected && styles.personChipActive,
                      ]}
                    >
                      <Ionicons
                        name={p.icon as any}
                        size={15}
                        color={isSelected ? '#FFFFFF' : !isDarkMode ? '#0F766E' : Colors.ivoryWhite}
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

            {/* 6. Selector de Cuenta Interactiva (Corrige el error de campo bloqueado) */}
            {type !== 'transfer' ? (
              <View style={styles.sectionBlock}>
                <Text style={[styles.sectionLabel, !isDarkMode && { color: '#64748B' }]}>
                  CUENTA {type === 'income' ? 'DE DEPÓSITO' : 'DE PAGO'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
                  {accounts.map((a) => {
                    const isSelected = selectedAccountId === a.id;
                    return (
                      <TouchableOpacity
                        key={a.id}
                        activeOpacity={0.8}
                        onPress={() => setSelectedAccountId(a.id)}
                        style={[
                          styles.accountChip,
                          !isDarkMode && styles.accountChipLight,
                          isSelected && styles.accountChipActive,
                        ]}
                      >
                        <Ionicons
                          name={(a.icon as any) || 'card-outline'}
                          size={16}
                          color={isSelected ? '#FFFFFF' : !isDarkMode ? '#0F766E' : Colors.secondaryGreen}
                          style={{ marginRight: 8 }}
                        />
                        <View>
                          <Text
                            style={[
                              styles.accountChipText,
                              !isDarkMode && !isSelected && { color: '#071827' },
                              isSelected && styles.accountChipTextActive,
                            ]}
                          >
                            {a.name}
                          </Text>
                          <Text
                            style={[
                              styles.accountChipBalance,
                              !isDarkMode && !isSelected && { color: '#64748B' },
                              isSelected && styles.accountChipBalanceActive,
                            ]}
                          >
                            {formatCurrency(a.balance, 'DOP')}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : (
              /* Caso Transferencia: Selector de Origen y Destino */
              <View style={styles.sectionBlock}>
                <Text style={[styles.sectionLabel, !isDarkMode && { color: '#64748B' }]}>CUENTA ORIGEN (SALE DE)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.horizontalChips, { marginBottom: 12 }]}>
                  {accounts.map((a) => {
                    const isSelected = selectedAccountId === a.id;
                    return (
                      <TouchableOpacity
                        key={a.id}
                        activeOpacity={0.8}
                        onPress={() => setSelectedAccountId(a.id)}
                        style={[
                          styles.accountChip,
                          !isDarkMode && styles.accountChipLight,
                          isSelected && styles.accountChipActive,
                        ]}
                      >
                        <Ionicons
                          name={(a.icon as any) || 'card-outline'}
                          size={16}
                          color={isSelected ? '#FFFFFF' : !isDarkMode ? '#0F766E' : Colors.secondaryGreen}
                          style={{ marginRight: 8 }}
                        />
                        <View>
                          <Text
                            style={[
                              styles.accountChipText,
                              !isDarkMode && !isSelected && { color: '#071827' },
                              isSelected && styles.accountChipTextActive,
                            ]}
                          >
                            {a.name}
                          </Text>
                          <Text
                            style={[
                              styles.accountChipBalance,
                              !isDarkMode && !isSelected && { color: '#64748B' },
                              isSelected && styles.accountChipBalanceActive,
                            ]}
                          >
                            {formatCurrency(a.balance, 'DOP')}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={[styles.sectionLabel, !isDarkMode && { color: '#64748B' }]}>CUENTA DESTINO (ENTRA EN)</Text>
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
                            styles.accountChip,
                            !isDarkMode && styles.accountChipLight,
                            isSelected && styles.accountChipActive,
                          ]}
                        >
                          <Ionicons
                            name="arrow-forward-circle-outline"
                            size={16}
                            color={isSelected ? '#FFFFFF' : !isDarkMode ? '#0F766E' : Colors.secondaryGreen}
                            style={{ marginRight: 8 }}
                          />
                          <View>
                            <Text
                              style={[
                                styles.accountChipText,
                                !isDarkMode && !isSelected && { color: '#071827' },
                                isSelected && styles.accountChipTextActive,
                              ]}
                            >
                              {a.name}
                            </Text>
                            <Text
                              style={[
                                styles.accountChipBalance,
                                !isDarkMode && !isSelected && { color: '#64748B' },
                                isSelected && styles.accountChipBalanceActive,
                              ]}
                            >
                              {formatCurrency(a.balance, 'DOP')}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>
              </View>
            )}

            {/* 7. Selector de Fecha Rápida y Nativa iOS */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionLabel, !isDarkMode && { color: '#64748B' }]}>FECHA DEL MOVIMIENTO</Text>
                <View style={styles.quickDateRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setDate(getTodayDateString())}
                    style={[
                      styles.quickDateChip,
                      !isDarkMode && styles.quickDateChipLight,
                      isToday(date) && styles.quickDateChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.quickDateText,
                        !isDarkMode && !isToday(date) && { color: '#071827' },
                        isToday(date) && styles.quickDateTextActive,
                      ]}
                    >
                      Hoy
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setDate(getYesterdayDateString())}
                    style={[
                      styles.quickDateChip,
                      !isDarkMode && styles.quickDateChipLight,
                      isYesterday(date) && styles.quickDateChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.quickDateText,
                        !isDarkMode && !isYesterday(date) && { color: '#071827' },
                        isYesterday(date) && styles.quickDateTextActive,
                      ]}
                    >
                      Ayer
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.dateInputBox, !isDarkMode && styles.inputBoxLight]}>
                <Ionicons name="calendar-outline" size={18} color={!isDarkMode ? '#0F766E' : Colors.secondaryGreen} style={{ marginRight: 8 }} />
                {Platform.OS === 'web' ? (
                  <input
                    type="date"
                    value={date}
                    onChange={(e: any) => setDate(e.target.value)}
                    style={{
                      flex: 1,
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: !isDarkMode ? '#071827' : '#FFFFFF',
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      padding: '2px 0',
                    }}
                  />
                ) : (
                  <TextInput
                    style={[styles.textInputSmall, !isDarkMode && { color: '#071827' }]}
                    value={date}
                    onChangeText={setDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={!isDarkMode ? '#94A3B8' : 'rgba(248, 245, 236, 0.4)'}
                    keyboardType="numbers-and-punctuation"
                  />
                )}
                <Text style={[styles.dateFormattedTag, !isDarkMode && { color: '#0F766E' }]}>
                  {isToday(date) ? '• Hoy' : isYesterday(date) ? '• Ayer' : ''}
                </Text>
              </View>
            </View>

            {/* 8. Descripción Opcional */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionLabel, !isDarkMode && { color: '#64748B' }]}>DESCRIPCIÓN (OPCIONAL)</Text>
              <View style={[styles.inputBox, !isDarkMode && styles.inputBoxLight]}>
                <TextInput
                  style={[styles.textInputFull, !isDarkMode && { color: '#071827' }]}
                  placeholder="Ej. Supermercado Nacional, Farmacia, Cena..."
                  placeholderTextColor={!isDarkMode ? '#94A3B8' : 'rgba(248, 245, 236, 0.4)'}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </View>

            {/* 9. Botón Guardar / Registrar Movimiento */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[styles.saveBtn, !isDarkMode && styles.saveBtnLight]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              )}
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
  backdropTouchArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalContent: {
    backgroundColor: 'rgba(16, 42, 67, 0.96)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: -6 },
    shadowRadius: 20,
    elevation: 10,
  },
  sheetHandleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 6,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: 40,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  typeChip: {
    paddingVertical: 8,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(20, 184, 166, 0.3)',
    marginBottom: 8,
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
  quickAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  quickAmountChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  quickAmountText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryGreen,
  },
  quickAmountChipClear: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    marginLeft: 'auto',
  },
  quickAmountClearText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.ivoryTranslucent,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionSubHint: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.ivoryTranslucent,
  },
  horizontalChips: {
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 13,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  categoryChipActive: {
    backgroundColor: '#0F766E',
    borderColor: '#14B8A6',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.ivoryWhite,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  personRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
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
    backgroundColor: '#0F766E',
    borderColor: '#14B8A6',
  },
  personChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ivoryWhite,
  },
  personChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  accountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  accountChipActive: {
    backgroundColor: '#0F766E',
    borderColor: '#14B8A6',
  },
  accountChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.ivoryWhite,
  },
  accountChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  accountChipBalance: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.ivoryTranslucent,
    marginTop: 2,
  },
  accountChipBalanceActive: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quickDateChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  quickDateChipActive: {
    backgroundColor: '#0F766E',
    borderColor: '#14B8A6',
  },
  quickDateText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.ivoryWhite,
  },
  quickDateTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dateInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  dateFormattedTag: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryGreen,
    marginLeft: 6,
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
    fontSize: 16,
    color: Colors.ivoryWhite,
    fontWeight: '600',
    flex: 1,
  },
  textInputFull: {
    fontSize: 16,
    color: Colors.ivoryWhite,
    fontWeight: '500',
    flex: 1,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F766E',
    borderRadius: Radius.md,
    paddingVertical: 14,
    marginTop: 8,
    shadowColor: '#0F766E',
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
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  // Variantes para Tema Blanco Marfil (Light)
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
    borderColor: '#0F766E',
  },
  quickAmountChipLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(7, 24, 39, 0.10)',
  },
  categoryChipLight: {
    backgroundColor: '#EDE8DE',
    borderColor: 'rgba(7, 24, 39, 0.08)',
  },
  personChipLight: {
    backgroundColor: '#EDE8DE',
    borderColor: 'rgba(7, 24, 39, 0.08)',
  },
  accountChipLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(7, 24, 39, 0.10)',
  },
  quickDateChipLight: {
    backgroundColor: '#EDE8DE',
    borderColor: 'rgba(7, 24, 39, 0.08)',
  },
  inputBoxLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(7, 24, 39, 0.12)',
  },
});
