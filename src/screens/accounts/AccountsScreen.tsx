// Pantalla de Cuentas Financieras Familiares
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
import { Account, AccountType } from '../../types';
import { JKButton } from '../../components/common/JKButton';
import { JKModal } from '../../components/common/JKModal';
import { JKInput } from '../../components/common/JKInput';
import { JKAmountInput } from '../../components/common/JKAmountInput';
import { toast } from '../../components/common/JKToast';
import { formatCurrency } from '../../utils/currency';
import { Spacing, BorderRadius } from '../../theme/spacing';

export const AccountsScreen: React.FC = () => {
  const { accounts, addAccount, updateAccount, deleteAccount, transferBetweenAccounts } = useFinanceStore();
  const { activeMember } = useAuthStore();
  const { theme, currency } = useThemeStore();

  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Formulario Transferencia
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');

  // Formulario Cuenta (crear / editar)
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<AccountType>('banco');
  const [accBalance, setAccBalance] = useState('');

  const totalAssets = accounts.reduce((sum, a) => sum + (a.balance > 0 ? a.balance : 0), 0);
  const totalLiabilities = accounts.reduce((sum, a) => sum + (a.balance < 0 ? Math.abs(a.balance) : 0), 0);
  const netWorth = totalAssets - totalLiabilities;

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setAccName('');
    setAccType('banco');
    setAccBalance('0');
    setAccountModalVisible(true);
  };

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setAccName(acc.name);
    setAccType(acc.type);
    setAccBalance(acc.balance.toString());
    setAccountModalVisible(true);
  };

  const handleConfirmTransfer = () => {
    const num = parseFloat(transferAmount);
    if (!num || num <= 0) {
      Alert.alert('Monto inválido', 'Por favor ingresa un monto mayor a 0.');
      return;
    }
    if (fromAccountId === toAccountId) {
      Alert.alert('Cuentas iguales', 'Selecciona dos cuentas diferentes para la transferencia.');
      return;
    }

    transferBetweenAccounts(fromAccountId, toAccountId, num, activeMember, transferNote.trim() || undefined);
    setTransferModalVisible(false);
    setTransferAmount('');
    setTransferNote('');
    toast.success(`✓ Se transfirieron ${formatCurrency(num, currency)}.`);
  };

  const handleSaveAccount = () => {
    const balanceNum = parseFloat(accBalance) || 0;
    if (!accName.trim()) {
      Alert.alert('Nombre requerido', 'Ingresa el nombre de la cuenta.');
      return;
    }

    if (editingAccount) {
      updateAccount(editingAccount.id, {
        name: accName.trim(),
        type: accType,
        balance: balanceNum,
      });
      toast.success('✓ Cuenta actualizada');
    } else {
      addAccount({
        household_id: 'hh-joel-kat-01',
        name: accName.trim(),
        type: accType,
        balance: balanceNum,
        color: BrandColors.deepBlue,
        icon: 'wallet',
        is_active: true,
      });
      toast.success('✓ Nueva cuenta agregada');
    }

    setAccountModalVisible(false);
    setEditingAccount(null);
  };

  const handleDeleteAccount = () => {
    if (!editingAccount) return;
    Alert.alert(
      '¿Eliminar esta cuenta?',
      `¿Deseas eliminar "${editingAccount.name}"? Los movimientos asociados permanecerán en el historial.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deleteAccount(editingAccount.id);
            setAccountModalVisible(false);
            setEditingAccount(null);
            toast.success('Cuenta eliminada');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Resumen de Patrimonio */}
      <View style={[styles.header, { backgroundColor: theme.surfaceCard, borderColor: theme.border }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Cuentas Familiares</Text>
          <View style={styles.headerButtonsRow}>
            <JKButton
              title="Transferir"
              onPress={() => setTransferModalVisible(true)}
              variant="outline"
              size="sm"
              style={{ marginRight: 8 }}
            />
            <JKButton
              title="+ Cuenta"
              onPress={handleOpenCreate}
              variant="primary"
              size="sm"
            />
          </View>
        </View>

        {/* Hero Card Patrimonio */}
        <View style={[styles.netWorthCard, { backgroundColor: BrandColors.nightBlue }]}>
          <Text style={styles.netWorthLabel}>PATRIMONIO NETO FAMILIAR</Text>
          <Text style={styles.netWorthAmount}>{formatCurrency(netWorth, currency)}</Text>
          <View style={styles.netWorthBreakdownRow}>
            <Text style={styles.subItemText}>Activos: {formatCurrency(totalAssets, currency)}</Text>
            <Text style={[styles.subItemText, { color: BrandColors.skyBlue }]}>
              Pasivos: {formatCurrency(totalLiabilities, currency)}
            </Text>
          </View>
        </View>
      </View>

      {/* Lista de Cuentas */}
      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isNegative = item.balance < 0;

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleOpenEdit(item)}
              style={[
                styles.accountCard,
                {
                  backgroundColor: theme.surfaceCard,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.cardLeft}>
                <View style={[styles.iconCircle, { backgroundColor: `${item.color}20` }]}>
                  <Ionicons name={(item.icon as any) || 'wallet-outline'} size={20} color={item.color} />
                </View>
                <View>
                  <Text style={[styles.accName, { color: theme.textPrimary }]}>{item.name}</Text>
                  <Text style={[styles.accType, { color: theme.textMuted }]}>
                    {item.type.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.cardRight}>
                <Text
                  style={[
                    styles.accBalance,
                    {
                      color: isNegative
                        ? BrandColors.danger
                        : item.balance > 0
                        ? BrandColors.deepBlue
                        : theme.textMuted,
                    },
                  ]}
                >
                  {formatCurrency(item.balance, currency)}
                </Text>
                <View style={[styles.editIconBadge, { backgroundColor: `${BrandColors.deepBlue}12` }]}>
                  <Ionicons name="pencil-outline" size={13} color={BrandColors.deepBlue} />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Modal Transferencia */}
      <JKModal
        visible={transferModalVisible}
        onClose={() => setTransferModalVisible(false)}
        title="Transferencia entre Cuentas"
      >
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Cuenta Origen</Text>
        <View style={styles.accountPillsRow}>
          {accounts.map((a) => (
            <TouchableOpacity
              key={a.id}
              onPress={() => setFromAccountId(a.id)}
              style={[
                styles.accountPill,
                fromAccountId === a.id && styles.accountPillActive,
                { borderColor: fromAccountId === a.id ? BrandColors.deepBlue : theme.border },
              ]}
            >
              <Text
                style={[
                  styles.accountPillText,
                  fromAccountId === a.id ? styles.accountPillTextActive : { color: theme.textPrimary },
                ]}
              >
                {a.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: Spacing.sm }]}>
          Cuenta Destino
        </Text>
        <View style={styles.accountPillsRow}>
          {accounts.map((a) => (
            <TouchableOpacity
              key={a.id}
              onPress={() => setToAccountId(a.id)}
              style={[
                styles.accountPill,
                toAccountId === a.id && styles.accountPillActive,
                { borderColor: toAccountId === a.id ? BrandColors.deepBlue : theme.border },
              ]}
            >
              <Text
                style={[
                  styles.accountPillText,
                  toAccountId === a.id ? styles.accountPillTextActive : { color: theme.textPrimary },
                ]}
              >
                {a.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <JKAmountInput
          label="Monto a transferir"
          amount={transferAmount}
          onChangeAmount={setTransferAmount}
          currencyPrefix={currency === 'DOP' ? 'RD$' : currency}
        />

        <JKInput
          label="Nota o motivo (opcional)"
          placeholder="Ej: Aporte cuenta conjunta..."
          value={transferNote}
          onChangeText={setTransferNote}
        />

        <JKButton
          title="Confirmar Transferencia"
          onPress={handleConfirmTransfer}
          variant="primary"
          size="md"
          style={{ marginTop: Spacing.md }}
        />
      </JKModal>

      {/* Modal Crear / Editar Cuenta */}
      <JKModal
        visible={accountModalVisible}
        onClose={() => {
          setAccountModalVisible(false);
          setEditingAccount(null);
        }}
        title={editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta Financiera'}
      >
        <JKInput
          label="Nombre de la cuenta"
          placeholder="Ej: Banco BHD, Banreservas, Tarjeta..."
          value={accName}
          onChangeText={setAccName}
        />

        <JKAmountInput
          label={editingAccount ? 'Balance actual' : 'Balance inicial'}
          amount={accBalance}
          onChangeAmount={setAccBalance}
          currencyPrefix={currency === 'DOP' ? 'RD$' : currency}
        />

        <JKButton
          title={editingAccount ? 'Guardar Cambios' : 'Guardar Cuenta'}
          onPress={handleSaveAccount}
          variant="primary"
          size="md"
          style={{ marginTop: Spacing.md }}
        />

        {editingAccount && (
          <JKButton
            title="Eliminar Cuenta"
            onPress={handleDeleteAccount}
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
  headerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  netWorthCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  netWorthLabel: {
    color: BrandColors.slateBlue,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  netWorthAmount: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },
  netWorthBreakdownRow: {
    flexDirection: 'row',
    gap: 20,
  },
  subItemText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 90,
  },
  accountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  accName: {
    fontSize: 15,
    fontWeight: '700',
  },
  accType: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  accBalance: {
    fontSize: 17,
    fontWeight: '800',
  },
  editIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  accountPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  accountPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  accountPillActive: {
    backgroundColor: BrandColors.deepBlue,
  },
  accountPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  accountPillTextActive: {
    color: '#FFFFFF',
  },
});
