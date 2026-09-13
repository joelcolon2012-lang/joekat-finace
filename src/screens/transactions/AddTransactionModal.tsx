// Modal rápido para añadir transacciones (Ingreso, Gasto, Transferencia, Ahorro)
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFinanceStore } from '../../store/financeStore';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { BrandColors, KathColors, JoelColors } from '../../theme/colors';
import { Transaction, TransactionType, RecurrenceFrequency, FamilyMemberName } from '../../types';
import { JKAmountInput } from '../../components/common/JKAmountInput';
import { JKInput } from '../../components/common/JKInput';
import { JKButton } from '../../components/common/JKButton';
import { JKAvatar } from '../../components/common/JKAvatar';
import { toast } from '../../components/common/JKToast';
import { BorderRadius, Spacing } from '../../theme/spacing';
import { getTodayDateString } from '../../utils/date';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  initialTransaction?: Transaction | null;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
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
    deleteTransaction,
    restoreTransaction,
    transferBetweenAccounts,
    depositToGoal,
  } = useFinanceStore();
  const { activeMember } = useAuthStore();
  const { theme, currency } = useThemeStore();

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
  const [paymentMethod, setPaymentMethod] = useState(initialTransaction?.payment_method || 'Tarjeta de Débito');
  const [isRecurring, setIsRecurring] = useState(!!initialTransaction?.is_recurring);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(initialTransaction?.frequency || 'mensual');
  const [receiptImage, setReceiptImage] = useState<string | null>(initialTransaction?.receipt_url || null);

  const prevVisibleRef = React.useRef(visible);
  const prevTxIdRef = React.useRef<string | undefined>(initialTransaction?.id);

  // Sincronizar estado únicamente al abrir el modal o al cambiar la transacción
  React.useEffect(() => {
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
        setPaymentMethod(initialTransaction.payment_method || 'Tarjeta de Débito');
        setIsRecurring(!!initialTransaction.is_recurring);
        setFrequency(initialTransaction.frequency || 'mensual');
        setReceiptImage(initialTransaction.receipt_url || null);
      } else {
        const defaultType = initialType || 'expense';
        setType(defaultType);
        setAmount('');
        setSelectedPerson(activeMember || 'Joel');
        setSelectedAccountId(accounts[0]?.id || '');
        setDestinationAccountId(accounts[1]?.id || '');
        const relCats = categories.filter((c) => c.type === (defaultType === 'income' ? 'income' : 'expense'));
        setSelectedCategoryId(relCats[0]?.id || '');
        setDescription('');
        setDate(getTodayDateString());
        setPaymentMethod('Tarjeta de Débito');
        setIsRecurring(false);
        setReceiptImage(null);
      }
    }

    prevVisibleRef.current = visible;
    prevTxIdRef.current = initialTransaction?.id;
  }, [visible, initialTransaction, initialType, activeMember]);

  // Filtrar categorías según tipo actual
  const relevantCategories = categories.filter((c) => c.type === (type === 'income' ? 'income' : 'expense'));

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType !== 'transfer') {
      const newRelevant = categories.filter((c) => c.type === (newType === 'income' ? 'income' : 'expense'));
      if (newRelevant.length > 0 && !newRelevant.find((c) => c.id === selectedCategoryId)) {
        setSelectedCategoryId(newRelevant[0].id);
      }
    }
  };

  if (!visible) return null;

  const handlePickReceipt = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.6,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setReceiptImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'No se pudo cargar la imagen del recibo.');
    }
  };

  const handleDeleteTransaction = () => {
    if (!initialTransaction) return;
    const copy = { ...initialTransaction };
    deleteTransaction(initialTransaction.id);
    onClose();
    toast.undo('Movimiento eliminado', () => {
      restoreTransaction(copy);
    });
  };

  const handleSave = () => {
    const cleanAmount = amount.toString().replace(/,/g, '.').replace(/[^0-9.]/g, '');
    const numAmount = parseFloat(cleanAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.show('Por favor ingresa un monto válido mayor a 0.', { type: 'danger' });
      return;
    }

    if (isEditing && initialTransaction) {
      if (type === 'transfer' && selectedAccountId === destinationAccountId) {
        toast.show('Selecciona dos cuentas diferentes para la transferencia.', { type: 'danger' });
        return;
      }
      updateTransaction(initialTransaction.id, {
        household_id: initialTransaction.household_id || 'hh-joel-kat-01',
        user_name: selectedPerson,
        type,
        amount: numAmount,
        category_id: type === 'transfer' ? undefined : (selectedCategoryId || undefined),
        account_id: selectedAccountId,
        destination_account_id: type === 'transfer' ? destinationAccountId : undefined,
        date,
        description: description.trim() || undefined,
        payment_method: paymentMethod,
        is_recurring: isRecurring,
        frequency: isRecurring ? frequency : undefined,
        receipt_url: receiptImage || undefined,
      });
      toast.success('✓ Cambios guardados');
      onClose();
      return;
    }

    if (type === 'transfer') {
      if (selectedAccountId === destinationAccountId) {
        toast.show('Selecciona dos cuentas diferentes para la transferencia.', { type: 'danger' });
        return;
      }
      transferBetweenAccounts(
        selectedAccountId,
        destinationAccountId,
        numAmount,
        selectedPerson,
        description || 'Transferencia familiar'
      );
      toast.success('✓ Transferencia realizada');
    } else {
      addTransaction({
        household_id: 'hh-joel-kat-01',
        user_name: selectedPerson,
        type,
        amount: numAmount,
        category_id: selectedCategoryId,
        account_id: selectedAccountId,
        date,
        description: description.trim() || undefined,
        payment_method: paymentMethod,
        is_recurring: isRecurring,
        frequency: isRecurring ? frequency : undefined,
        receipt_url: receiptImage || undefined,
      });
      toast.success(type === 'income' ? '✓ Ingreso registrado' : '✓ Gasto registrado');
    }

    // Reset y cerrar
    setAmount('');
    setDescription('');
    setReceiptImage(null);
    onClose();
  };

  return (
    <View style={styles.modalOverlay}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidContainer}
      >
        <View style={[styles.container, { backgroundColor: theme.surfaceCard }]}>
          {/* Header con pestañas de tipo */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              {isEditing ? 'Editar Movimiento' : 'Nuevo Movimiento'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close-circle" size={26} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Selector de Tipo (Gasto / Ingreso / Transferencia) */}
          <View style={[styles.typeTabsRow, { backgroundColor: theme.surfaceCardAlt }]}>
            <TouchableOpacity
              onPress={() => handleTypeChange('expense')}
              style={[styles.typeTab, type === 'expense' && styles.typeTabExpenseActive]}
            >
              <Ionicons
                name="arrow-down-circle"
                size={16}
                color={type === 'expense' ? '#FFFFFF' : theme.textSecondary}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.typeTabText,
                  { color: type === 'expense' ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                Gasto
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleTypeChange('income')}
              style={[styles.typeTab, type === 'income' && styles.typeTabIncomeActive]}
            >
              <Ionicons
                name="arrow-up-circle"
                size={16}
                color={type === 'income' ? '#FFFFFF' : theme.textSecondary}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.typeTabText,
                  { color: type === 'income' ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                Ingreso
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleTypeChange('transfer')}
              style={[styles.typeTab, type === 'transfer' && styles.typeTabTransferActive]}
            >
              <Ionicons
                name="swap-horizontal"
                size={16}
                color={type === 'transfer' ? '#FFFFFF' : theme.textSecondary}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.typeTabText,
                  { color: type === 'transfer' ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                Transferir
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Monto con RD$ y chips rápidos */}
            <JKAmountInput
              amount={amount}
              onChangeAmount={setAmount}
              currencyPrefix={currency === 'DOP' ? 'RD$' : currency}
            />

          {/* Selector de Persona: Joel o Kat */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              {type === 'expense' ? '¿Quién realizó el gasto?' : '¿A nombre de quién?'}
            </Text>
            <View style={styles.personRow}>
              {(['Joel', 'Kath'] as FamilyMemberName[]).map((person) => {
                const isSelected = selectedPerson === person || (person === 'Kath' && selectedPerson === 'Kat');
                const isKath = person === 'Kath';
                const activeBg = isKath ? KathColors.primary : BrandColors.deepBlue;
                return (
                  <TouchableOpacity
                    key={person}
                    onPress={() => setSelectedPerson(person)}
                    style={[
                      styles.personCard,
                      {
                        backgroundColor: isSelected ? activeBg : theme.surface,
                        borderColor: isSelected ? activeBg : theme.border,
                      },
                    ]}
                  >
                    <JKAvatar name={person} size={28} />
                    <Text
                      style={[
                        styles.personName,
                        { color: isSelected ? '#FFFFFF' : theme.textPrimary },
                      ]}
                    >
                      {person}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={isKath ? KathColors.light : BrandColors.skyBlue}
                        style={{ marginLeft: 6 }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Categoría (solo si no es transferencia) */}
          {type !== 'transfer' && (
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Categoría</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                {relevantCategories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setSelectedCategoryId(cat.id)}
                      style={[
                        styles.catChip,
                        {
                          backgroundColor: isSelected ? cat.color : theme.surface,
                          borderColor: isSelected ? cat.color : theme.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={(cat.icon as any) || 'tag'}
                        size={14}
                        color={isSelected ? '#FFFFFF' : cat.color}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.catChipText,
                          { color: isSelected ? '#FFFFFF' : theme.textPrimary },
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Cuenta origen / destino */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              {type === 'transfer' ? 'Cuenta Origen (de dónde sale)' : 'Cuenta'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountScroll}>
              {accounts.map((acc) => {
                const isSelected = selectedAccountId === acc.id;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    onPress={() => setSelectedAccountId(acc.id)}
                    style={[
                      styles.accountChip,
                      {
                        backgroundColor: isSelected ? BrandColors.nightBlue : theme.surface,
                        borderColor: isSelected ? BrandColors.nightBlue : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.accountChipText,
                        { color: isSelected ? '#FFFFFF' : theme.textPrimary },
                      ]}
                    >
                      {acc.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {type === 'transfer' && (
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                Cuenta Destino (hacia dónde va)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountScroll}>
                {accounts.map((acc) => {
                  const isSelected = destinationAccountId === acc.id;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      onPress={() => setDestinationAccountId(acc.id)}
                      style={[
                        styles.accountChip,
                        {
                          backgroundColor: isSelected ? BrandColors.deepBlue : theme.surface,
                          borderColor: isSelected ? BrandColors.deepBlue : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.accountChipText,
                          { color: isSelected ? '#FFFFFF' : theme.textPrimary },
                        ]}
                      >
                        {acc.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Descripción opcional */}
          <JKInput
            label="Descripción o concepto (opcional)"
            placeholder="Ej: Compra supermercado, Cena..."
            value={description}
            onChangeText={setDescription}
          />

          {/* Foto de Recibo opcional */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Foto del Recibo (opcional)
            </Text>
            {receiptImage ? (
              <View style={styles.receiptPreviewContainer}>
                <Image source={{ uri: receiptImage }} style={styles.receiptThumb} />
                <TouchableOpacity
                  onPress={() => setReceiptImage(null)}
                  style={styles.removeReceiptBtn}
                >
                  <Ionicons name="trash" size={16} color="#FFFFFF" />
                  <Text style={styles.removeReceiptText}>Quitar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handlePickReceipt}
                style={[styles.addReceiptBtn, { borderColor: theme.border }]}
              >
                <Ionicons name="camera-outline" size={20} color={BrandColors.deepBlue} />
                <Text style={[styles.addReceiptText, { color: BrandColors.deepBlue }]}>
                  Adjuntar foto de recibo
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Movimiento Recurrente */}
          <View style={[styles.recurringRow, { borderColor: theme.border }]}>
            <View>
              <Text style={[styles.recurringTitle, { color: theme.textPrimary }]}>
                Movimiento Recurrente
              </Text>
              <Text style={[styles.recurringSub, { color: theme.textMuted }]}>
                {isRecurring ? `Se repetirá de forma ${frequency}` : 'No repetitivo'}
              </Text>
            </View>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{ false: '#CBD5E1', true: BrandColors.deepBlue }}
              thumbColor="#FFFFFF"
            />
          </View>

          {isRecurring && (
            <View style={styles.freqRow}>
              {(['semanal', 'quincenal', 'mensual', 'anual'] as RecurrenceFrequency[]).map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFrequency(f)}
                  style={[
                    styles.freqChip,
                    {
                      backgroundColor: frequency === f ? BrandColors.deepBlue : theme.surface,
                      borderColor: frequency === f ? BrandColors.deepBlue : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.freqText,
                      { color: frequency === f ? '#FFFFFF' : theme.textPrimary },
                    ]}
                  >
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Botón Guardar */}
          <JKButton
            title={
              isEditing
                ? 'Guardar Cambios'
                : type === 'income'
                ? '+ Registrar Ingreso'
                : type === 'transfer'
                ? 'Realizar Transferencia'
                : '+ Registrar Gasto'
            }
            onPress={handleSave}
            variant="primary"
            size="lg"
            style={{ marginTop: Spacing.lg, marginBottom: isEditing ? Spacing.sm : Spacing.xl }}
          />

          {isEditing && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleDeleteTransaction}
              style={styles.deleteModalBtn}
            >
              <Ionicons name="trash-outline" size={16} color={BrandColors.danger} style={{ marginRight: 6 }} />
              <Text style={styles.deleteModalBtnText}>Eliminar este movimiento</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 29, 57, 0.7)',
    justifyContent: 'flex-end',
    zIndex: 999,
  },
  keyboardAvoidContainer: {
    width: '100%',
    maxHeight: '94%',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  typeTabsRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: 3,
    marginBottom: Spacing.sm,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  typeTabExpenseActive: {
    backgroundColor: BrandColors.nightBlue,
  },
  typeTabIncomeActive: {
    backgroundColor: BrandColors.success,
  },
  typeTabTransferActive: {
    backgroundColor: BrandColors.deepBlue,
  },
  typeTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scrollBody: {
    width: '100%',
  },
  sectionBlock: {
    marginVertical: Spacing.xs + 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  personRow: {
    flexDirection: 'row',
    gap: 12,
  },
  personCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  personName: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  catScroll: {
    flexDirection: 'row',
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    marginRight: 8,
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  accountScroll: {
    flexDirection: 'row',
  },
  accountChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginRight: 8,
  },
  accountChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  addReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  addReceiptText: {
    fontSize: 13,
    fontWeight: '600',
  },
  receiptPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  receiptThumb: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
  },
  removeReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.danger,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  removeReceiptText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  recurringRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    marginTop: Spacing.sm,
  },
  recurringTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  recurringSub: {
    fontSize: 12,
    marginTop: 2,
  },
  freqRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: Spacing.xs,
  },
  freqChip: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  freqText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  deleteModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: `${BrandColors.danger}14`,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: `${BrandColors.danger}30`,
  },
  deleteModalBtnText: {
    color: BrandColors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
});
